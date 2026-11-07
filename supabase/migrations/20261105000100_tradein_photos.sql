-- Additive V3 migration. Run once in Supabase SQL Editor; safe to rerun.
-- Original submit_tradein and existing requests remain valid.
begin;
alter table public.tradein_requests add column if not exists photos jsonb not null default '[]'::jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'tradein_photos_limit' and conrelid = 'public.tradein_requests'::regclass) then
    alter table public.tradein_requests add constraint tradein_photos_limit
      check (jsonb_typeof(photos) = 'array' and jsonb_array_length(photos) <= 14);
  end if;
end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('tradein-photos','tradein-photos',false,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=2097152,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists tradein_photos_staff_select on storage.objects;
create policy tradein_photos_staff_select on storage.objects for select to authenticated
  using(bucket_id='tradein-photos' and (select public.is_staff()));
-- No public INSERT, UPDATE or DELETE policy. Uploads pass through the bounded server route.

create table if not exists public.tradein_upload_sessions(
  id uuid primary key default gen_random_uuid(),
  token_hash text not null check(token_hash ~ '^[a-f0-9]{64}$'),
  fingerprint text not null,
  user_id uuid references auth.users(id) on delete set null,
  payload jsonb not null,
  manifest jsonb not null default '[]'::jsonb check(jsonb_typeof(manifest)='array' and jsonb_array_length(manifest)<=14),
  ready_slots integer[] not null default '{}',
  completed_code text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '2 hours')
);
create index if not exists tradein_upload_rate_idx on public.tradein_upload_sessions(fingerprint,created_at desc);
create index if not exists tradein_upload_expiry_idx on public.tradein_upload_sessions(expires_at) where completed_code is null;
alter table public.tradein_upload_sessions enable row level security;
revoke all on public.tradein_upload_sessions from anon,authenticated;
grant all on public.tradein_upload_sessions to service_role;

create or replace function public.prepare_tradein_upload(p_payload jsonb,p_files jsonb,p_user_id uuid,p_fingerprint text,p_token_hash text)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_id uuid := gen_random_uuid(); v_files jsonb := '[]'::jsonb; f jsonb; v_index integer:=0; v_ext text;
begin
  if coalesce((select (value->>'tradein')::boolean from public.settings where key='modules'),true) is false then raise exception 'MODULE_OFF'; end if;
  if jsonb_typeof(p_payload->'items') is distinct from 'array' or jsonb_array_length(p_payload->'items') not between 1 and 50 then raise exception 'BAD_ITEMS'; end if;
  if length(btrim(coalesce(p_payload->>'name',''))) not between 2 and 120 or coalesce(p_payload->>'phone','') !~ '^(0|\+84)[0-9]{9,10}$' then raise exception 'BAD_CONTACT'; end if;
  if jsonb_typeof(p_files) is distinct from 'array' or jsonb_array_length(p_files)>14 then raise exception 'PHOTO_LIMIT'; end if;
  if p_token_hash !~ '^[a-f0-9]{64}$' or p_fingerprint !~ '^[a-f0-9]{64}$' then raise exception 'BAD_TOKEN'; end if;
  -- Serialize rate checks per fingerprint; survives serverless restarts.
  perform pg_advisory_xact_lock(hashtextextended(p_fingerprint,0));
  if (select count(*) from public.tradein_upload_sessions where fingerprint=p_fingerprint and created_at>now()-interval '1 hour')>=15 then raise exception 'TRADEIN_RATE_LIMIT'; end if;
  for f in select value from jsonb_array_elements(p_files) loop
    if (f->>'size')::bigint not between 1 and 2097152 or coalesce(f->>'sha256','') !~ '^[a-f0-9]{64}$' then raise exception 'BAD_PHOTO'; end if;
    if not exists(select 1 from jsonb_array_elements(p_payload->'items') i where i->>'client_id'=f->>'item_id') then raise exception 'BAD_PHOTO_ITEM'; end if;
    v_ext:=case f->>'mime' when 'image/jpeg' then 'jpg' when 'image/png' then 'png' when 'image/webp' then 'webp' else null end;
    if v_ext is null then raise exception 'BAD_PHOTO_TYPE'; end if;
    v_files:=v_files||jsonb_build_array(f||jsonb_build_object('slot',v_index,'path',v_id::text||'/'||v_index::text||'.'||v_ext));
    v_index:=v_index+1;
  end loop;
  insert into public.tradein_upload_sessions(id,token_hash,fingerprint,user_id,payload,manifest)
  values(v_id,p_token_hash,p_fingerprint,p_user_id,p_payload,v_files);
  return v_id;
end $$;

create or replace function public.mark_tradein_photo_ready(p_session uuid,p_token_hash text,p_slot integer)
returns void language plpgsql security definer set search_path='' as $$
declare s public.tradein_upload_sessions%rowtype;
begin
  select * into s from public.tradein_upload_sessions where id=p_session and token_hash=p_token_hash for update;
  if not found or s.expires_at<=now() or s.completed_code is not null then raise exception 'UPLOAD_EXPIRED'; end if;
  if p_slot<0 or p_slot>=jsonb_array_length(s.manifest) then raise exception 'PHOTO_LIMIT'; end if;
  if not (p_slot=any(s.ready_slots)) then update public.tradein_upload_sessions set ready_slots=array_append(ready_slots,p_slot) where id=p_session; end if;
end $$;

create or replace function public.complete_tradein_upload(p_session uuid,p_token_hash text)
returns text language plpgsql security definer set search_path='' as $$
declare s public.tradein_upload_sessions%rowtype; v_code text;
begin
  select * into s from public.tradein_upload_sessions where id=p_session and token_hash=p_token_hash for update;
  if not found then raise exception 'UPLOAD_EXPIRED'; end if;
  -- A retry after a lost response returns the existing request, never a duplicate.
  if s.completed_code is not null then return s.completed_code; end if;
  if s.expires_at<=now() then raise exception 'UPLOAD_EXPIRED'; end if;
  if coalesce((select (value->>'tradein')::boolean from public.settings where key='modules'),true) is false then raise exception 'MODULE_OFF'; end if;
  if cardinality(s.ready_slots)<>jsonb_array_length(s.manifest) then raise exception 'PHOTOS_INCOMPLETE'; end if;
  insert into public.tradein_requests(user_id,customer_name,phone,email,method,payout,items,note,photos)
  values(s.user_id,s.payload->>'name',s.payload->>'phone',nullif(s.payload->>'email',''),s.payload->>'method',s.payload->>'payout',s.payload->'items',nullif(s.payload->>'note',''),s.manifest)
  returning code into v_code;
  update public.tradein_upload_sessions set completed_code=v_code,payload='{}'::jsonb,manifest='[]'::jsonb,ready_slots='{}' where id=p_session;
  return v_code;
end $$;

revoke all on function public.prepare_tradein_upload(jsonb,jsonb,uuid,text,text) from public,anon,authenticated;
revoke all on function public.mark_tradein_photo_ready(uuid,text,integer) from public,anon,authenticated;
revoke all on function public.complete_tradein_upload(uuid,text) from public,anon,authenticated;
grant execute on function public.prepare_tradein_upload(jsonb,jsonb,uuid,text,text) to service_role;
grant execute on function public.mark_tradein_photo_ready(uuid,text,integer) to service_role;
grant execute on function public.complete_tradein_upload(uuid,text) to service_role;
commit;
