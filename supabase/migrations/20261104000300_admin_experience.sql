-- Dark Poke Admin V1. Additive migration for an EXISTING database.
-- Run only this file after the existing 001/002 migrations. No reset, no seed.
begin;

alter table public.orders add column if not exists search_text text
  generated always as (public.f_unaccent(lower(code || ' ' || customer_name || ' ' || phone || ' ' || coalesce(email,'')))) stored;
create index if not exists orders_search_trgm on public.orders using gin (search_text extensions.gin_trgm_ops);
create index if not exists orders_channel_created_v1 on public.orders (channel, created_at desc, id desc);
create index if not exists products_status_created_v1 on public.products (status, created_at desc, id desc);
create index if not exists products_preorder_created_v1 on public.products (created_at desc, id desc) where allow_preorder and status <> 'archived';
create index if not exists variants_sku_search_v1 on public.variants using gin (sku extensions.gin_trgm_ops) where active;

-- security_invoker preserves the products/type RLS policies for every caller.
create or replace view public.admin_product_inventory with (security_invoker = true) as
select p.*, (p.status = 'active' and not p.allow_preorder and t.track_inventory and not t.is_unique and p.stock_total <= p.min_stock) as is_low_stock
from public.products p join public.product_types t on t.id = p.type_id
where (select public.is_staff());
revoke all on public.admin_product_inventory from anon, public;
grant select on public.admin_product_inventory to authenticated;

-- One aggregate per list rather than one network request for every tab.
create or replace function public.admin_order_counts_v1(p_kind text default null, p_channel text default null, p_search text default '')
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
  if not public.is_staff() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  return (select jsonb_build_object('all',coalesce(sum(n),0)) || coalesce(jsonb_object_agg(status,n),'{}'::jsonb)
    from (select o.status::text, count(*) as n from public.orders o
      where (p_kind is null or o.kind::text = p_kind)
        and (p_channel is null or o.channel::text = p_channel)
        and (coalesce(p_search,'') = '' or o.search_text like '%' || public.f_unaccent(lower(p_search)) || '%')
      group by o.status) x);
end; $$;

create or replace function public.admin_catalog_counts_v1(p_dimension text)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
  if not public.is_staff() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if p_dimension not in ('type_id','category_id') then raise exception 'BAD_DIMENSION'; end if;
  return (select coalesce(jsonb_object_agg(k,n),'{}'::jsonb) from (
    select case when p_dimension = 'type_id' then p.type_id else p.category_id end as k, count(*) as n
      from public.products p where p.status <> 'archived'
      group by 1) x where k is not null);
end; $$;
revoke all on function public.admin_order_counts_v1(text,text,text) from public, anon;
revoke all on function public.admin_catalog_counts_v1(text) from public, anon;
grant execute on function public.admin_order_counts_v1(text,text,text) to authenticated;
grant execute on function public.admin_catalog_counts_v1(text) to authenticated;

-- Keep the dashboard low-stock count consistent with the list filter.
create or replace function public.admin_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today timestamptz := date_trunc('day', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh';
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'revenue_today', (select coalesce(sum(total), 0) from public.orders where created_at >= v_today and status not in ('pending_payment', 'cancelled')),
    'orders_today', (select count(*) from public.orders where created_at >= v_today),
    'pending_payment', (select count(*) from public.orders where status = 'pending_payment'),
    'to_pack', (select count(*) from public.orders where status = 'paid'),
    'tradein_new', (select count(*) from public.tradein_requests where status = 'new'),
    'low_stock', (select count(*) from public.products p join public.product_types t on t.id = p.type_id
                  where p.status = 'active' and t.track_inventory and not t.is_unique and not p.allow_preorder and p.stock_total <= p.min_stock),
    'revenue_7d', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'total', coalesce(s.total, 0)) order by d), '[]'::jsonb)
                    from generate_series(v_today - interval '6 day', v_today, interval '1 day') d
                    left join lateral (select sum(o.total) as total from public.orders o
                                        where o.created_at >= d and o.created_at < d + interval '1 day'
                                          and o.status not in ('pending_payment', 'cancelled')) s on true)
  );
end;
$$;

-- Subscribe only from authenticated admin/POS. Existing RLS still controls rows.
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
      alter publication supabase_realtime add table public.orders;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'variants') then
      alter publication supabase_realtime add table public.variants;
    end if;
  end if;
end $$;
commit;
