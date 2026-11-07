-- ============================================================
-- Dark Poke: file gộp để dán 1 lần vào Supabase > SQL Editor > New query > Run
-- Gồm: schema + RLS + hàm nghiệp vụ, kho ảnh (storage), dữ liệu mẫu.
-- Chỉ chạy 1 lần trên project mới. Muốn bỏ dữ liệu mẫu thì xóa phần SEED ở cuối trước khi chạy.
-- ============================================================

-- =====================================================================
-- Dark Poke – schema chính
-- Chạy trên Supabase (Postgres 15+). Thứ tự: file này, rồi storage, rồi seed.
-- Tiền tệ lưu bằng số nguyên VND (bigint), không dùng số thực.
-- =====================================================================

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Bỏ dấu tiếng Việt để tìm kiếm ("thẻ" -> "the"). immutable để dùng trong index và cột sinh tự động.
create or replace function public.f_unaccent(text)
returns text
language sql
immutable parallel safe strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

-- ---------------------------------------------------------------------
-- Kiểu liệt kê
-- ---------------------------------------------------------------------
create type public.staff_role as enum ('owner', 'manager', 'cashier', 'staff');
create type public.product_status as enum ('draft', 'active', 'hidden', 'archived');
create type public.attr_kind as enum ('text', 'number', 'select', 'boolean', 'date');
create type public.order_kind as enum ('order', 'preorder');
create type public.order_channel as enum ('online', 'pos');
create type public.order_status as enum ('pending_payment', 'paid', 'packing', 'shipping', 'ready_pickup', 'completed', 'cancelled');
create type public.payment_method as enum ('bank_transfer', 'cash', 'card');
create type public.fulfillment_method as enum ('delivery', 'pickup');
create type public.tradein_status as enum ('new', 'quoted', 'accepted', 'received', 'paid', 'rejected', 'expired');

-- ---------------------------------------------------------------------
-- Tiện ích chung
-- ---------------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Người dùng: hồ sơ khách và nhân viên
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- Nhân viên được mời theo email. user_id gắn khi người đó đăng nhập lần đầu (claim_staff).
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  email text not null,
  full_name text not null default '',
  role public.staff_role not null default 'staff',
  allow_google boolean not null default true,
  active boolean not null default true,
  pos_pin_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_email_lower check (email = lower(email))
);
create unique index staff_email_key on public.staff (email);
create trigger staff_updated_at before update on public.staff
  for each row execute function public.tg_set_updated_at();

-- Các hàm kiểm tra quyền dùng trong RLS (security definer để tránh đệ quy RLS trên bảng staff).
create or replace function public.current_staff_role()
returns public.staff_role
language sql
stable security definer
set search_path = ''
as $$
  select s.role from public.staff s
  where s.user_id = (select auth.uid()) and s.active
  limit 1
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff s where s.user_id = (select auth.uid()) and s.active)
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff s
    where s.user_id = (select auth.uid()) and s.active and s.role in ('owner', 'manager')
  )
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff s
    where s.user_id = (select auth.uid()) and s.active and s.role = 'owner'
  )
$$;

-- Tạo hồ sơ khi có tài khoản mới (đăng nhập Google lần đầu).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Gắn tài khoản đang đăng nhập với lời mời nhân viên theo email. Trả về vai trò hoặc null.
create or replace function public.claim_staff()
returns public.staff_role
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(coalesce((select auth.jwt()) ->> 'email', ''));
  v_provider text := coalesce((select auth.jwt()) -> 'app_metadata' ->> 'provider', 'email');
  v_staff public.staff;
begin
  if (select auth.uid()) is null or v_email = '' then
    return null;
  end if;

  select * into v_staff from public.staff where email = v_email and active;
  if not found then
    return null;
  end if;
  if v_provider = 'google' and not v_staff.allow_google then
    return null;
  end if;
  if v_staff.user_id is null then
    update public.staff set user_id = (select auth.uid()) where id = v_staff.id;
  elsif v_staff.user_id <> (select auth.uid()) then
    return null;
  end if;
  return v_staff.role;
end;
$$;

-- ---------------------------------------------------------------------
-- Cài đặt cửa hàng (key/value). is_public = khách đọc được (thông tin ngân hàng, phí ship...).
-- ---------------------------------------------------------------------
create table public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger settings_updated_at before update on public.settings
  for each row execute function public.tg_set_updated_at();

insert into public.settings (key, value, is_public) values
  ('shop', '{"name":"Dark Poke","tagline":"HUNT - TRADE - COLLECT","hotline":"[SỐ HOTLINE]","zalo":"[ZALO]","address":"[ĐỊA CHỈ CỬA HÀNG]","email":"[EMAIL]"}', true),
  ('bank', '{"bank_bin":"970403","bank_name":"[NGÂN HÀNG]","account_no":"[SỐ TÀI KHOẢN]","account_name":"[CHỦ TÀI KHOẢN]","transfer_template":"{code} {name}"}', true),
  ('shipping', '{"hcm":30000,"other":40000,"pickup":0,"free_over":null,"pickup_hold_days":3}', true),
  ('rules', '{"unpaid_cancel_hours":24,"preorder_deposit_pct":30,"preorder_balance_days":3,"cart_hold_minutes":15,"tradein_quote_hours":48,"tradein_approval_limit":5000000,"cashier_max_discount_pct":5}', true),
  ('modules', '{"preorder":true,"tradein":true,"cart_hold":true,"pos":true,"attribute_filters":true}', true);

-- ---------------------------------------------------------------------
-- Hàng hóa: loại sản phẩm, thuộc tính, danh mục, thương hiệu, bộ sưu tập
-- ---------------------------------------------------------------------
create table public.product_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  description text not null default '',
  track_inventory boolean not null default true,
  is_unique boolean not null default false,
  has_variants boolean not null default false,
  allow_preorder boolean not null default false,
  allow_tradein boolean not null default false,
  hold_in_cart boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger product_types_updated_at before update on public.product_types
  for each row execute function public.tg_set_updated_at();

create table public.attribute_defs (
  id uuid primary key default gen_random_uuid(),
  type_id uuid not null references public.product_types (id) on delete cascade,
  code text not null check (code ~ '^[a-z0-9_]{1,40}$'),
  name text not null,
  kind public.attr_kind not null default 'text',
  options text[] not null default '{}',
  required boolean not null default false,
  filterable boolean not null default false,
  visible boolean not null default true,
  sort int not null default 0,
  unique (type_id, code)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete restrict,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),
  depth smallint not null default 0 check (depth between 0 and 2),
  sort int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);
create index categories_parent_idx on public.categories (parent_id, sort);

-- Tự tính cấp (tối đa 3 cấp) và chặn vòng lặp cha con.
create or replace function public.tg_categories_depth()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_parent_depth smallint;
begin
  if new.parent_id is null then
    new.depth := 0;
    return new;
  end if;
  if new.parent_id = new.id then
    raise exception 'CATEGORY_CYCLE' using errcode = 'P0001';
  end if;
  select depth into v_parent_depth from public.categories where id = new.parent_id;
  new.depth := coalesce(v_parent_depth, 0) + 1;
  if new.depth > 2 then
    raise exception 'CATEGORY_TOO_DEEP' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger categories_depth before insert or update of parent_id on public.categories
  for each row execute function public.tg_categories_depth();

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  visible boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Sản phẩm và biến thể. Mỗi sản phẩm luôn có ít nhất 1 biến thể (biến thể mặc định),
-- giỏ hàng, đơn hàng và tồn kho đều tính theo biến thể.
-- ---------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  type_id uuid not null references public.product_types (id) on delete restrict,
  category_id uuid references public.categories (id) on delete set null,
  brand_id uuid references public.brands (id) on delete set null,
  name text not null check (length(name) between 2 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,120}$'),
  sku text not null unique,
  description text not null default '',
  unit text not null default 'Cái',
  price bigint not null check (price >= 0),
  compare_at_price bigint check (compare_at_price is null or compare_at_price >= 0),
  cost bigint check (cost is null or cost >= 0),
  status public.product_status not null default 'draft',
  online boolean not null default true,
  pos boolean not null default true,
  is_featured boolean not null default false,
  attrs jsonb not null default '{}'::jsonb check (jsonb_typeof(attrs) = 'object'),
  tags text[] not null default '{}',
  thumbnail text,
  weight_g int,
  min_stock int not null default 0,
  purchase_limit int check (purchase_limit is null or purchase_limit > 0),
  -- pre-order
  allow_preorder boolean not null default false,
  preorder_deposit_pct smallint check (preorder_deposit_pct is null or preorder_deposit_pct between 1 and 100),
  preorder_release_date date,
  preorder_slots int check (preorder_slots is null or preorder_slots >= 0),
  preorder_closes_at timestamptz,
  -- tổng hợp từ biến thể (trigger cập nhật), giúp trang danh sách không phải join
  stock_total int not null default 0,
  min_price bigint,
  max_price bigint,
  variant_count int not null default 0,
  seo_title text,
  seo_description text,
  search_text text generated always as (public.f_unaccent(lower(name || ' ' || sku))) stored,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_updated_at before update on public.products
  for each row execute function public.tg_set_updated_at();

-- Index phục vụ trang danh sách (keyset pagination theo created_at, id) và bộ lọc.
create index products_listing_idx on public.products (created_at desc, id desc)
  where status = 'active' and online;
create index products_price_idx on public.products (min_price, id)
  where status = 'active' and online;
create index products_category_idx on public.products (category_id, created_at desc);
create index products_type_idx on public.products (type_id, created_at desc);
create index products_brand_idx on public.products (brand_id);
create index products_featured_idx on public.products (created_at desc) where is_featured and status = 'active';
create index products_attrs_gin on public.products using gin (attrs jsonb_path_ops);
create index products_tags_gin on public.products using gin (tags);
create index products_search_trgm on public.products using gin (search_text extensions.gin_trgm_ops);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort int not null default 0
);
create index product_images_product_idx on public.product_images (product_id, sort);

create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  values text[] not null default '{}',
  sort int not null default 0
);
create index product_options_product_idx on public.product_options (product_id, sort);

create table public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  title text not null default 'Mặc định',
  option_values text[] not null default '{}',
  price bigint check (price is null or price >= 0),
  stock int not null default 0 check (stock >= 0),
  active boolean not null default true,
  image_url text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index variants_product_idx on public.variants (product_id, sort);

create table public.product_collections (
  product_id uuid not null references public.products (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  primary key (product_id, collection_id)
);
create index product_collections_collection_idx on public.product_collections (collection_id, product_id);

-- Cập nhật số liệu tổng hợp của sản phẩm khi biến thể thay đổi.
create or replace function public.refresh_product_rollup(p_product_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.products p set
    stock_total = coalesce((select sum(v.stock) from public.variants v where v.product_id = p.id and v.active), 0),
    min_price = (select min(coalesce(v.price, p.price)) from public.variants v where v.product_id = p.id and v.active),
    max_price = (select max(coalesce(v.price, p.price)) from public.variants v where v.product_id = p.id and v.active),
    variant_count = (select count(*) from public.variants v where v.product_id = p.id)
  where p.id = p_product_id
$$;

create or replace function public.tg_variants_rollup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_product_rollup(old.product_id);
  else
    perform public.refresh_product_rollup(new.product_id);
    if tg_op = 'UPDATE' and old.product_id <> new.product_id then
      perform public.refresh_product_rollup(old.product_id);
    end if;
  end if;
  return null;
end;
$$;
create trigger variants_rollup after insert or update or delete on public.variants
  for each row execute function public.tg_variants_rollup();

create or replace function public.tg_products_price_rollup()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.min_price := coalesce((select min(coalesce(v.price, new.price)) from public.variants v where v.product_id = new.id and v.active), new.price);
  new.max_price := coalesce((select max(coalesce(v.price, new.price)) from public.variants v where v.product_id = new.id and v.active), new.price);
  if new.status = 'active' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;
create trigger products_price_rollup before insert or update of price, status on public.products
  for each row execute function public.tg_products_price_rollup();

-- ---------------------------------------------------------------------
-- Đơn hàng (online, pre-order, bán tại quầy)
-- ---------------------------------------------------------------------
create sequence public.order_code_seq start 100001;
create sequence public.tradein_code_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('DP' || nextval('public.order_code_seq')::text),
  access_token uuid not null default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  kind public.order_kind not null default 'order',
  channel public.order_channel not null default 'online',
  status public.order_status not null default 'pending_payment',
  payment_method public.payment_method not null default 'bank_transfer',
  fulfillment public.fulfillment_method not null default 'delivery',
  customer_name text not null,
  phone text not null,
  email text,
  province text,
  address text,
  note text,
  subtotal bigint not null default 0,
  shipping_fee bigint not null default 0,
  discount bigint not null default 0,
  total bigint not null default 0,
  amount_due bigint not null default 0,
  paid_amount bigint not null default 0,
  deposit_pct smallint,
  payment_ref text,
  proof_path text,
  customer_confirmed_at timestamptz,
  expires_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  shift_id uuid,
  created_by uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.tg_set_updated_at();
create index orders_status_created_idx on public.orders (status, created_at desc);
create index orders_created_idx on public.orders (created_at desc);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_kind_idx on public.orders (kind, status, created_at desc);
create index orders_phone_idx on public.orders (phone);
create index orders_expiring_idx on public.orders (expires_at) where status = 'pending_payment';
create index orders_shift_idx on public.orders (shift_id) where shift_id is not null;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.variants (id) on delete set null,
  name text not null,
  variant_title text not null default '',
  sku text not null,
  image_url text,
  unit_price bigint not null,
  qty int not null check (qty > 0),
  line_total bigint not null,
  is_preorder boolean not null default false,
  stock_deducted boolean not null default false
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_variant_idx on public.order_items (variant_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status,
  message text not null,
  actor text not null default 'system',
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);

-- ---------------------------------------------------------------------
-- Thu mua / trade-in
-- ---------------------------------------------------------------------
create table public.tradein_requests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('TM' || nextval('public.tradein_code_seq')::text),
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  phone text not null,
  email text,
  method text not null default 'store' check (method in ('store', 'ship')),
  payout text not null default 'cash' check (payout in ('cash', 'credit')),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  note text,
  status public.tradein_status not null default 'new',
  quoted_total bigint,
  quote_expires_at timestamptz,
  staff_note text,
  handled_by uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger tradein_updated_at before update on public.tradein_requests
  for each row execute function public.tg_set_updated_at();
create index tradein_status_idx on public.tradein_requests (status, created_at desc);
create index tradein_user_idx on public.tradein_requests (user_id);

-- ---------------------------------------------------------------------
-- Ca bán hàng tại quầy
-- ---------------------------------------------------------------------
create table public.pos_shifts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete restrict,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_cash bigint not null default 0,
  closing_cash bigint,
  note text
);
create index pos_shifts_staff_idx on public.pos_shifts (staff_id, opened_at desc);
create unique index pos_shifts_one_open on public.pos_shifts (staff_id) where closed_at is null;
alter table public.orders add constraint orders_shift_fk foreign key (shift_id) references public.pos_shifts (id) on delete set null;

-- =====================================================================
-- Hàm nghiệp vụ (RPC)
-- =====================================================================

-- Đặt hàng online: giá và tồn kho tính lại ở server, khóa dòng biến thể để không bán vượt tồn.
-- p_items: [{"variant_id":"…","qty":1}], p_customer: {"name","phone","email","province","address"}
create or replace function public.place_order(
  p_items jsonb,
  p_customer jsonb,
  p_fulfillment public.fulfillment_method default 'delivery',
  p_note text default null
)
returns table (order_code text, order_token uuid, order_total bigint, order_amount_due bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_code text;
  v_token uuid;
  v_item jsonb;
  v_qty int;
  r record;
  v_subtotal bigint := 0;
  v_ship bigint := 0;
  v_due bigint := 0;
  v_is_pre boolean;
  v_kind public.order_kind := null;
  v_rules jsonb;
  v_shipping jsonb;
  v_name text := btrim(coalesce(p_customer ->> 'name', ''));
  v_phone text := regexp_replace(coalesce(p_customer ->> 'phone', ''), '[^0-9+]', '', 'g');
  v_province text := btrim(coalesce(p_customer ->> 'province', ''));
  v_address text := btrim(coalesce(p_customer ->> 'address', ''));
  v_pct smallint;
  v_deposit bigint := 0;
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'TOO_MANY_ITEMS' using errcode = 'P0001';
  end if;
  if length(v_name) < 2 or length(v_name) > 120 then
    raise exception 'BAD_NAME' using errcode = 'P0001';
  end if;
  if v_phone !~ '^(0|\+84)[0-9]{9,10}$' then
    raise exception 'BAD_PHONE' using errcode = 'P0001';
  end if;
  if p_fulfillment = 'delivery' and (length(v_address) < 5 or v_province = '') then
    raise exception 'BAD_ADDRESS' using errcode = 'P0001';
  end if;

  select value into v_rules from public.settings where key = 'rules';
  select value into v_shipping from public.settings where key = 'shipping';

  insert into public.orders (user_id, customer_name, phone, email, province, address, fulfillment, note, expires_at)
  values (
    (select auth.uid()), v_name, v_phone, nullif(btrim(coalesce(p_customer ->> 'email', '')), ''),
    nullif(v_province, ''), nullif(v_address, ''), p_fulfillment, nullif(btrim(coalesce(p_note, '')), ''),
    now() + make_interval(hours => coalesce((v_rules ->> 'unpaid_cancel_hours')::int, 24))
  )
  returning id, code, access_token into v_order_id, v_code, v_token;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := nullif(v_item ->> 'qty', '')::int;
    if v_qty is null or v_qty < 1 or v_qty > 99 then
      raise exception 'BAD_QTY' using errcode = 'P0001';
    end if;

    select v.id as variant_id, v.sku, v.title as variant_title, v.stock, v.active as variant_active,
           coalesce(v.price, p.price) as unit_price, coalesce(v.image_url, p.thumbnail) as image_url,
           p.id as product_id, p.name, p.status, p.online, p.purchase_limit,
           p.allow_preorder, p.preorder_deposit_pct, p.preorder_slots, p.preorder_closes_at,
           t.track_inventory, t.allow_preorder as type_allow_preorder
      into r
      from public.variants v
      join public.products p on p.id = v.product_id
      join public.product_types t on t.id = p.type_id
     where v.id = nullif(v_item ->> 'variant_id', '')::uuid
     for update of v, p;

    if not found or r.status <> 'active' or not r.online or not r.variant_active then
      raise exception 'UNAVAILABLE' using errcode = 'P0001';
    end if;
    if r.purchase_limit is not null and v_qty > r.purchase_limit then
      raise exception 'OVER_LIMIT:%', r.name using errcode = 'P0001';
    end if;

    v_is_pre := r.allow_preorder and r.type_allow_preorder
                and coalesce((select (value ->> 'preorder')::boolean from public.settings where key = 'modules'), true);

    if v_kind is null then
      v_kind := case when v_is_pre then 'preorder'::public.order_kind else 'order'::public.order_kind end;
    elsif (v_kind = 'preorder') <> v_is_pre then
      raise exception 'MIXED_PREORDER' using errcode = 'P0001';
    end if;

    if v_is_pre then
      if r.preorder_closes_at is not null and r.preorder_closes_at < now() then
        raise exception 'PREORDER_CLOSED:%', r.name using errcode = 'P0001';
      end if;
      if r.preorder_slots is not null then
        if r.preorder_slots < v_qty then
          raise exception 'OUT_OF_STOCK:%', r.name using errcode = 'P0001';
        end if;
        update public.products set preorder_slots = preorder_slots - v_qty where id = r.product_id;
      end if;
      v_pct := coalesce(r.preorder_deposit_pct, (v_rules ->> 'preorder_deposit_pct')::smallint, 30);
      v_deposit := v_deposit + ceil(r.unit_price * v_qty * v_pct / 100.0)::bigint;
    elsif r.track_inventory then
      if r.stock < v_qty then
        raise exception 'OUT_OF_STOCK:%', r.name using errcode = 'P0001';
      end if;
      update public.variants set stock = stock - v_qty where id = r.variant_id;
    end if;

    insert into public.order_items (order_id, product_id, variant_id, name, variant_title, sku, image_url,
                                    unit_price, qty, line_total, is_preorder, stock_deducted)
    values (v_order_id, r.product_id, r.variant_id, r.name, r.variant_title, r.sku, r.image_url,
            r.unit_price, v_qty, r.unit_price * v_qty, v_is_pre, (not v_is_pre) and r.track_inventory);

    v_subtotal := v_subtotal + r.unit_price * v_qty;
  end loop;

  if p_fulfillment = 'pickup' then
    v_ship := coalesce((v_shipping ->> 'pickup')::bigint, 0);
  elsif public.f_unaccent(lower(v_province)) like '%ho chi minh%' or lower(v_province) like '%hcm%' then
    v_ship := coalesce((v_shipping ->> 'hcm')::bigint, 30000);
  else
    v_ship := coalesce((v_shipping ->> 'other')::bigint, 40000);
  end if;
  if (v_shipping ->> 'free_over') is not null and v_subtotal >= (v_shipping ->> 'free_over')::bigint then
    v_ship := 0;
  end if;

  v_due := case when v_kind = 'preorder' then v_deposit else v_subtotal + v_ship end;

  update public.orders
     set kind = v_kind,
         subtotal = v_subtotal,
         shipping_fee = v_ship,
         total = v_subtotal + v_ship,
         amount_due = v_due,
         deposit_pct = case when v_kind = 'preorder' then v_pct end
   where id = v_order_id;

  insert into public.order_events (order_id, status, message, actor)
  values (v_order_id, 'pending_payment', 'Khách đặt hàng', 'customer');

  return query select v_code, v_token, v_subtotal + v_ship, v_due;
end;
$$;

-- Trang "Chờ thanh toán": khách xem đơn bằng mã + token bí mật (không cần đăng nhập).
create or replace function public.get_order_public(p_code text, p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'code', o.code, 'kind', o.kind, 'status', o.status, 'fulfillment', o.fulfillment,
    'customer_name', o.customer_name, 'phone', o.phone, 'email', o.email,
    'province', o.province, 'address', o.address, 'note', o.note,
    'subtotal', o.subtotal, 'shipping_fee', o.shipping_fee, 'discount', o.discount,
    'total', o.total, 'amount_due', o.amount_due, 'paid_amount', o.paid_amount, 'deposit_pct', o.deposit_pct,
    'expires_at', o.expires_at, 'paid_at', o.paid_at, 'created_at', o.created_at,
    'customer_confirmed_at', o.customer_confirmed_at, 'has_proof', o.proof_path is not null,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'name', i.name, 'variant_title', i.variant_title, 'sku', i.sku, 'image_url', i.image_url,
        'unit_price', i.unit_price, 'qty', i.qty, 'line_total', i.line_total, 'is_preorder', i.is_preorder)
        order by i.name) from public.order_items i where i.order_id = o.id), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(jsonb_build_object('status', e.status, 'message', e.message, 'created_at', e.created_at)
        order by e.created_at) from public.order_events e where e.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o
  where o.code = p_code and o.access_token = p_token
$$;

-- Khách bấm "Tôi đã chuyển khoản".
create or replace function public.confirm_transfer(p_code text, p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  update public.orders set customer_confirmed_at = now()
   where code = p_code and access_token = p_token and status = 'pending_payment' and customer_confirmed_at is null
  returning id into v_id;
  if v_id is null then
    return false;
  end if;
  insert into public.order_events (order_id, status, message, actor)
  values (v_id, 'pending_payment', 'Khách báo đã chuyển khoản, chờ shop đối soát', 'customer');
  return true;
end;
$$;

-- Hoàn tồn kho của một đơn (dùng khi hủy).
create or replace function public.restock_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  for r in select * from public.order_items where order_id = p_order_id loop
    if r.stock_deducted and r.variant_id is not null then
      update public.variants set stock = stock + r.qty where id = r.variant_id;
      update public.order_items set stock_deducted = false where id = r.id;
    elsif r.is_preorder and r.product_id is not null then
      update public.products set preorder_slots = preorder_slots + r.qty
       where id = r.product_id and preorder_slots is not null;
    end if;
  end loop;
end;
$$;

-- Nhân viên đổi trạng thái đơn. Hủy thì hoàn kho.
create or replace function public.admin_set_order_status(p_order_id uuid, p_status public.order_status, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.order_status;
  v_staff text;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  select status into v_old from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_old = 'cancelled' then
    raise exception 'ORDER_CANCELLED' using errcode = 'P0001';
  end if;
  if p_status = 'cancelled' then
    perform public.restock_order(p_order_id);
  end if;

  update public.orders set
    status = p_status,
    paid_at = case when p_status = 'paid' and paid_at is null then now() else paid_at end,
    paid_amount = case when p_status = 'paid' and paid_amount = 0 then amount_due else paid_amount end,
    cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end,
    cancel_reason = case when p_status = 'cancelled' then p_note else cancel_reason end
  where id = p_order_id;

  select coalesce(nullif(full_name, ''), email) into v_staff from public.staff where user_id = (select auth.uid());
  insert into public.order_events (order_id, status, message, actor)
  values (p_order_id, p_status, coalesce(nullif(p_note, ''), 'Cập nhật trạng thái'), coalesce(v_staff, 'staff'));
end;
$$;

-- Webhook ngân hàng: ghi nhận tiền về theo mã đơn trong nội dung chuyển khoản (chỉ service role).
create or replace function public.mark_order_paid(p_code text, p_amount bigint, p_ref text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.orders;
begin
  select * into o from public.orders where code = upper(p_code) for update;
  if not found then
    return 'NOT_FOUND';
  end if;
  if o.payment_ref is not null and o.payment_ref = p_ref then
    return 'DUPLICATE';
  end if;
  update public.orders set
    paid_amount = paid_amount + p_amount,
    payment_ref = p_ref,
    status = case when status = 'pending_payment' and paid_amount + p_amount >= amount_due then 'paid'::public.order_status else status end,
    paid_at = case when status = 'pending_payment' and paid_amount + p_amount >= amount_due then now() else paid_at end
  where id = o.id;
  insert into public.order_events (order_id, status, message, actor)
  values (o.id, case when o.paid_amount + p_amount >= o.amount_due then 'paid'::public.order_status end,
          format('Nhận chuyển khoản %s₫ (mã giao dịch %s)', p_amount, p_ref), 'bank');
  return case when o.paid_amount + p_amount >= o.amount_due then 'PAID' else 'PARTIAL' end;
end;
$$;

-- Tự hủy đơn chưa chuyển khoản quá hạn, hoàn kho. Gọi từ pg_cron hoặc Vercel Cron.
create or replace function public.cancel_expired_orders()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  n int := 0;
begin
  for r in
    select id from public.orders
     where status = 'pending_payment' and expires_at < now() and customer_confirmed_at is null
     for update skip locked
  loop
    perform public.restock_order(r.id);
    update public.orders set status = 'cancelled', cancelled_at = now(), cancel_reason = 'Quá hạn chuyển khoản' where id = r.id;
    insert into public.order_events (order_id, status, message) values (r.id, 'cancelled', 'Tự hủy do quá hạn chuyển khoản');
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Bán tại quầy: tạo đơn đã thanh toán, trừ kho ngay. Thu ngân giảm vượt hạn mức cần quản lý.
create or replace function public.pos_create_sale(
  p_items jsonb,
  p_payment public.payment_method,
  p_discount bigint default 0,
  p_customer jsonb default '{}'::jsonb,
  p_shift_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff public.staff;
  v_order_id uuid;
  v_code text;
  v_item jsonb;
  v_qty int;
  r record;
  v_subtotal bigint := 0;
  v_max_pct numeric;
begin
  select * into v_staff from public.staff where user_id = (select auth.uid()) and active;
  if not found then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART' using errcode = 'P0001';
  end if;

  insert into public.orders (channel, status, payment_method, fulfillment, customer_name, phone, created_by, shift_id, paid_at)
  values ('pos', 'completed', p_payment, 'pickup',
          coalesce(nullif(btrim(p_customer ->> 'name'), ''), 'Khách lẻ'),
          coalesce(nullif(btrim(p_customer ->> 'phone'), ''), '-'),
          v_staff.id, p_shift_id, now())
  returning id, code into v_order_id, v_code;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := nullif(v_item ->> 'qty', '')::int;
    if v_qty is null or v_qty < 1 then
      raise exception 'BAD_QTY' using errcode = 'P0001';
    end if;
    select v.id as variant_id, v.sku, v.title as variant_title, v.stock, coalesce(v.price, p.price) as unit_price,
           coalesce(v.image_url, p.thumbnail) as image_url, p.id as product_id, p.name, p.pos, t.track_inventory
      into r
      from public.variants v
      join public.products p on p.id = v.product_id
      join public.product_types t on t.id = p.type_id
     where v.id = nullif(v_item ->> 'variant_id', '')::uuid and v.active and p.status <> 'archived'
     for update of v;
    if not found or not r.pos then
      raise exception 'UNAVAILABLE' using errcode = 'P0001';
    end if;
    if r.track_inventory then
      if r.stock < v_qty then
        raise exception 'OUT_OF_STOCK:%', r.name using errcode = 'P0001';
      end if;
      update public.variants set stock = stock - v_qty where id = r.variant_id;
    end if;
    insert into public.order_items (order_id, product_id, variant_id, name, variant_title, sku, image_url, unit_price, qty, line_total, stock_deducted)
    values (v_order_id, r.product_id, r.variant_id, r.name, r.variant_title, r.sku, r.image_url, r.unit_price, v_qty, r.unit_price * v_qty, r.track_inventory);
    v_subtotal := v_subtotal + r.unit_price * v_qty;
  end loop;

  if p_discount < 0 or p_discount > v_subtotal then
    raise exception 'BAD_DISCOUNT' using errcode = 'P0001';
  end if;
  select coalesce((value ->> 'cashier_max_discount_pct')::numeric, 5) into v_max_pct from public.settings where key = 'rules';
  if v_staff.role in ('cashier', 'staff') and p_discount > v_subtotal * coalesce(v_max_pct, 5) / 100 then
    raise exception 'DISCOUNT_NEEDS_MANAGER' using errcode = 'P0001';
  end if;

  update public.orders set subtotal = v_subtotal, discount = p_discount, total = v_subtotal - p_discount,
         amount_due = v_subtotal - p_discount, paid_amount = v_subtotal - p_discount
   where id = v_order_id;
  insert into public.order_events (order_id, status, message, actor)
  values (v_order_id, 'completed', 'Bán tại quầy', coalesce(nullif(v_staff.full_name, ''), v_staff.email));
  return v_code;
end;
$$;

-- Lưu sản phẩm kèm biến thể, tùy chọn, ảnh, bộ sưu tập trong 1 giao dịch (quyền theo RLS: quản lý).
create or replace function public.admin_save_product(p jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_type public.product_types;
  v_keep uuid[] := '{}';
  v jsonb;
  v_vid uuid;
  v_i int := 0;
  v_stock int;
begin
  if not public.is_manager() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  select * into v_type from public.product_types where id = (p ->> 'type_id')::uuid;
  if not found then
    raise exception 'BAD_TYPE' using errcode = 'P0001';
  end if;

  if v_id is null then
    insert into public.products (type_id, category_id, brand_id, name, slug, sku, description, unit, price, compare_at_price, cost,
      status, online, pos, is_featured, attrs, tags, thumbnail, weight_g, min_stock, purchase_limit,
      allow_preorder, preorder_deposit_pct, preorder_release_date, preorder_slots, preorder_closes_at, seo_title, seo_description)
    values ((p ->> 'type_id')::uuid, nullif(p ->> 'category_id', '')::uuid, nullif(p ->> 'brand_id', '')::uuid,
      p ->> 'name', p ->> 'slug', p ->> 'sku', coalesce(p ->> 'description', ''), coalesce(nullif(p ->> 'unit', ''), 'Cái'),
      (p ->> 'price')::bigint, nullif(p ->> 'compare_at_price', '')::bigint, nullif(p ->> 'cost', '')::bigint,
      coalesce(nullif(p ->> 'status', ''), 'draft')::public.product_status,
      coalesce((p ->> 'online')::boolean, true), coalesce((p ->> 'pos')::boolean, true), coalesce((p ->> 'is_featured')::boolean, false),
      case when jsonb_typeof(p -> 'attrs') = 'object' then p -> 'attrs' else '{}'::jsonb end, case when jsonb_typeof(p -> 'tags') = 'array' then array(select jsonb_array_elements_text(p -> 'tags')) else '{}'::text[] end,
      p -> 'images' -> 0 ->> 'url', nullif(p ->> 'weight_g', '')::int, coalesce(nullif(p ->> 'min_stock', '')::int, 0), nullif(p ->> 'purchase_limit', '')::int,
      coalesce((p ->> 'allow_preorder')::boolean, false) and v_type.allow_preorder, nullif(p ->> 'preorder_deposit_pct', '')::smallint,
      nullif(p ->> 'preorder_release_date', '')::date, nullif(p ->> 'preorder_slots', '')::int, nullif(p ->> 'preorder_closes_at', '')::timestamptz,
      nullif(p ->> 'seo_title', ''), nullif(p ->> 'seo_description', ''))
    returning id into v_id;
  else
    update public.products set
      type_id = (p ->> 'type_id')::uuid, category_id = nullif(p ->> 'category_id', '')::uuid, brand_id = nullif(p ->> 'brand_id', '')::uuid,
      name = p ->> 'name', slug = p ->> 'slug', sku = p ->> 'sku', description = coalesce(p ->> 'description', ''),
      unit = coalesce(nullif(p ->> 'unit', ''), 'Cái'), price = (p ->> 'price')::bigint,
      compare_at_price = nullif(p ->> 'compare_at_price', '')::bigint, cost = nullif(p ->> 'cost', '')::bigint,
      status = coalesce(nullif(p ->> 'status', ''), 'draft')::public.product_status,
      online = coalesce((p ->> 'online')::boolean, true), pos = coalesce((p ->> 'pos')::boolean, true),
      is_featured = coalesce((p ->> 'is_featured')::boolean, false),
      attrs = case when jsonb_typeof(p -> 'attrs') = 'object' then p -> 'attrs' else '{}'::jsonb end, tags = case when jsonb_typeof(p -> 'tags') = 'array' then array(select jsonb_array_elements_text(p -> 'tags')) else '{}'::text[] end,
      thumbnail = p -> 'images' -> 0 ->> 'url', weight_g = nullif(p ->> 'weight_g', '')::int,
      min_stock = coalesce(nullif(p ->> 'min_stock', '')::int, 0), purchase_limit = nullif(p ->> 'purchase_limit', '')::int,
      allow_preorder = coalesce((p ->> 'allow_preorder')::boolean, false) and v_type.allow_preorder,
      preorder_deposit_pct = nullif(p ->> 'preorder_deposit_pct', '')::smallint,
      preorder_release_date = nullif(p ->> 'preorder_release_date', '')::date,
      preorder_slots = nullif(p ->> 'preorder_slots', '')::int,
      preorder_closes_at = nullif(p ->> 'preorder_closes_at', '')::timestamptz,
      seo_title = nullif(p ->> 'seo_title', ''), seo_description = nullif(p ->> 'seo_description', '')
    where id = v_id;
    if not found then
      raise exception 'NOT_FOUND' using errcode = 'P0002';
    end if;
  end if;

  delete from public.product_options where product_id = v_id;
  insert into public.product_options (product_id, name, values, sort)
  select v_id, o ->> 'name', coalesce(array(select jsonb_array_elements_text(o -> 'values')), '{}'), ord::int
    from jsonb_array_elements(coalesce(p -> 'options', '[]'::jsonb)) with ordinality as x(o, ord)
   where coalesce(o ->> 'name', '') <> '';

  delete from public.product_images where product_id = v_id;
  insert into public.product_images (product_id, url, alt, sort)
  select v_id, im ->> 'url', coalesce(im ->> 'alt', ''), ord::int
    from jsonb_array_elements(coalesce(p -> 'images', '[]'::jsonb)) with ordinality as x(im, ord)
   where coalesce(im ->> 'url', '') <> '';

  delete from public.product_collections where product_id = v_id;
  insert into public.product_collections (product_id, collection_id)
  select v_id, c::uuid from jsonb_array_elements_text(coalesce(p -> 'collection_ids', '[]'::jsonb)) c
  on conflict do nothing;

  -- Biến thể: giữ id cũ để không mất liên kết đơn hàng. Không có biến thể thì tạo biến thể mặc định.
  if jsonb_array_length(coalesce(p -> 'variants', '[]'::jsonb)) = 0 then
    p := jsonb_set(p, '{variants}', jsonb_build_array(jsonb_build_object(
      'id', (select id::text from public.variants where product_id = v_id order by sort limit 1),
      'sku', p ->> 'sku', 'title', 'Mặc định', 'stock', coalesce(p ->> 'stock', '0'), 'active', true)));
  end if;

  for v in select value from jsonb_array_elements(p -> 'variants') loop
    v_i := v_i + 1;
    v_stock := greatest(coalesce(nullif(v ->> 'stock', '')::int, 0), 0);
    if v_type.is_unique then
      v_stock := least(v_stock, 1);
    end if;
    v_vid := nullif(v ->> 'id', '')::uuid;
    if v_vid is not null then
      update public.variants set sku = v ->> 'sku', title = coalesce(nullif(v ->> 'title', ''), 'Mặc định'),
             option_values = coalesce(array(select jsonb_array_elements_text(v -> 'option_values')), '{}'),
             price = nullif(v ->> 'price', '')::bigint, stock = v_stock, active = coalesce((v ->> 'active')::boolean, true),
             image_url = nullif(v ->> 'image_url', ''), sort = v_i
       where id = v_vid and product_id = v_id;
      if not found then
        v_vid := null;
      end if;
    end if;
    if v_vid is null then
      insert into public.variants (product_id, sku, title, option_values, price, stock, active, image_url, sort)
      values (v_id, v ->> 'sku', coalesce(nullif(v ->> 'title', ''), 'Mặc định'),
              coalesce(array(select jsonb_array_elements_text(v -> 'option_values')), '{}'),
              nullif(v ->> 'price', '')::bigint, v_stock, coalesce((v ->> 'active')::boolean, true), nullif(v ->> 'image_url', ''), v_i)
      returning id into v_vid;
    end if;
    v_keep := v_keep || v_vid;
  end loop;
  delete from public.variants where product_id = v_id and not (id = any (v_keep));
  return v_id;
end;
$$;

-- Khách gửi yêu cầu thu mua.
create or replace function public.submit_tradein(p jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_phone text := regexp_replace(coalesce(p ->> 'phone', ''), '[^0-9+]', '', 'g');
begin
  if coalesce((select (value ->> 'tradein')::boolean from public.settings where key = 'modules'), true) is false then
    raise exception 'MODULE_OFF' using errcode = 'P0001';
  end if;
  if length(btrim(coalesce(p ->> 'name', ''))) < 2 then
    raise exception 'BAD_NAME' using errcode = 'P0001';
  end if;
  if v_phone !~ '^(0|\+84)[0-9]{9,10}$' then
    raise exception 'BAD_PHONE' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p -> 'items') is distinct from 'array' or jsonb_array_length(p -> 'items') = 0 or jsonb_array_length(p -> 'items') > 50 then
    raise exception 'EMPTY_ITEMS' using errcode = 'P0001';
  end if;
  insert into public.tradein_requests (user_id, customer_name, phone, email, method, payout, items, note)
  values ((select auth.uid()), btrim(p ->> 'name'), v_phone, nullif(btrim(coalesce(p ->> 'email', '')), ''),
          coalesce(nullif(p ->> 'method', ''), 'store'), coalesce(nullif(p ->> 'payout', ''), 'cash'),
          p -> 'items', nullif(btrim(coalesce(p ->> 'note', '')), ''))
  returning code into v_code;
  return v_code;
end;
$$;

-- Số liệu bảng điều khiển (1 lần gọi thay vì nhiều truy vấn).
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
                   where p.status = 'active' and t.track_inventory and not t.is_unique and p.stock_total <= p.min_stock),
    'revenue_7d', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'total', coalesce(s.total, 0)) order by d), '[]'::jsonb)
                     from generate_series(v_today - interval '6 day', v_today, interval '1 day') d
                     left join lateral (select sum(o.total) as total from public.orders o
                                         where o.created_at >= d and o.created_at < d + interval '1 day'
                                           and o.status not in ('pending_payment', 'cancelled')) s on true)
  );
end;
$$;

-- =====================================================================
-- Phân quyền thực thi hàm
-- =====================================================================
revoke execute on function public.mark_order_paid(text, bigint, text) from public, anon, authenticated;
revoke execute on function public.cancel_expired_orders() from public, anon, authenticated;
revoke execute on function public.restock_order(uuid) from public, anon, authenticated;
revoke execute on function public.refresh_product_rollup(uuid) from public, anon, authenticated;
grant execute on function public.mark_order_paid(text, bigint, text) to service_role;
grant execute on function public.cancel_expired_orders() to service_role;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.staff enable row level security;
alter table public.settings enable row level security;
alter table public.product_types enable row level security;
alter table public.attribute_defs enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_options enable row level security;
alter table public.variants enable row level security;
alter table public.product_collections enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.tradein_requests enable row level security;
alter table public.pos_shifts enable row level security;

-- Hồ sơ: chính chủ đọc/sửa, nhân viên đọc
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_staff()));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Nhân viên: nhân viên đọc, chủ shop quản lý
create policy staff_select on public.staff for select to authenticated using ((select public.is_staff()));
create policy staff_write on public.staff for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

-- Cài đặt
create policy settings_select on public.settings for select to anon, authenticated
  using (is_public or (select public.is_staff()));
create policy settings_write on public.settings for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

-- Danh mục hàng hóa: ai cũng đọc, quản lý ghi
create policy product_types_select on public.product_types for select to anon, authenticated using (true);
create policy product_types_write on public.product_types for all to authenticated
  using ((select public.is_manager())) with check ((select public.is_manager()));
create policy attribute_defs_select on public.attribute_defs for select to anon, authenticated using (true);
create policy attribute_defs_write on public.attribute_defs for all to authenticated
  using ((select public.is_manager())) with check ((select public.is_manager()));
create policy categories_select on public.categories for select to anon, authenticated
  using (visible or (select public.is_staff()));
create policy categories_write on public.categories for all to authenticated
  using ((select public.is_manager())) with check ((select public.is_manager()));
create policy brands_select on public.brands for select to anon, authenticated using (true);
create policy brands_write on public.brands for all to authenticated
  using ((select public.is_manager())) with check ((select public.is_manager()));
create policy collections_select on public.collections for select to anon, authenticated
  using (visible or (select public.is_staff()));
create policy collections_write on public.collections for all to authenticated
  using ((select public.is_manager())) with check ((select public.is_manager()));

-- Sản phẩm: khách chỉ thấy sản phẩm đang bán online
create policy products_select on public.products for select to anon, authenticated
  using ((status = 'active' and online) or (select public.is_staff()));
create policy products_write on public.products for all to authenticated
  using ((select public.is_manager())) with check ((select public.is_manager()));

create policy product_images_select on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy product_images_write on public.product_images for all to authenticated
  using ((select public.is_manager())) with check ((select public.is_manager()));
create policy product_options_select on public.product_options for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy product_options_write on public.product_options for all to authenticated
  using ((select public.is_manager())) with check ((select public.is_manager()));
create policy variants_select on public.variants for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy variants_write on public.variants for all to authenticated
  using ((select public.is_manager())) with check ((select public.is_manager()));
create policy product_collections_select on public.product_collections for select to anon, authenticated using (true);
create policy product_collections_write on public.product_collections for all to authenticated
  using ((select public.is_manager())) with check ((select public.is_manager()));

-- Đơn hàng: khách xem đơn của mình, nhân viên xem tất cả. Tạo đơn chỉ qua RPC place_order.
create policy orders_select on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));
create policy orders_update on public.orders for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy order_items_select on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_staff()))));
create policy order_events_select on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_staff()))));

-- Thu mua: khách xem yêu cầu của mình (tạo qua RPC submit_tradein), nhân viên xử lý
create policy tradein_select on public.tradein_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));
create policy tradein_update on public.tradein_requests for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy tradein_delete on public.tradein_requests for delete to authenticated
  using ((select public.is_manager()));

-- Ca POS
create policy pos_shifts_all on public.pos_shifts for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- Tổng hợp khách hàng theo số điện thoại (gồm cả khách không đăng nhập). security_invoker: áp RLS của orders (chỉ nhân viên thấy hết).
create view public.customer_summary with (security_invoker = true) as
select
  o.phone,
  (array_agg(o.customer_name order by o.created_at desc))[1] as customer_name,
  (array_agg(o.email order by o.created_at desc) filter (where o.email is not null))[1] as email,
  bool_or(o.user_id is not null) as has_account,
  count(*) as order_count,
  coalesce(sum(o.total) filter (where o.status not in ('pending_payment', 'cancelled')), 0) as total_spent,
  max(o.created_at) as last_order_at
from public.orders o
where o.channel = 'online' or o.phone <> '-'
group by o.phone;

-- ===== STORAGE =====
-- Kho ảnh: ảnh sản phẩm (công khai) và ảnh chuyển khoản của khách (riêng tư).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('products', 'products', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

-- Ảnh sản phẩm: ai cũng xem (bucket public), quản lý được tải lên, sửa, xóa.
create policy "products_images_manager_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'products' and (select public.is_manager()));
create policy "products_images_manager_update" on storage.objects for update to authenticated
  using (bucket_id = 'products' and (select public.is_manager()));
create policy "products_images_manager_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'products' and (select public.is_manager()));

-- Ảnh chuyển khoản: chỉ nhân viên xem. Khách tải lên qua server (service role) sau khi kiểm tra mã đơn + token.
create policy "payment_proofs_staff_select" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and (select public.is_staff()));

-- ===== SEED (dữ liệu mẫu) =====
-- Dữ liệu mẫu Dark Poke (giống chế độ demo). Chạy sau các file trong migrations.
-- Ảnh mẫu dùng đường dẫn /art/*.svg có sẵn trong thư mục public.

insert into public.product_types (id, code, name, description, track_inventory, is_unique, has_variants, allow_preorder, allow_tradein, hold_in_cart, sort) values
  ('9d876c01-e90f-5047-9e5e-a1140aa628ff', 'sealed', 'Sealed', 'Booster box, ETB, pack, tin, deck còn nguyên seal', true, false, false, true, true, false, 0),
  ('5ba880dc-5ec4-5b34-bc07-01031d87615d', 'the-le', 'Thẻ lẻ', 'Từng thẻ, có tình trạng NM, LP, MP, HP', true, true, false, false, true, true, 1),
  ('f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'the-grading', 'Thẻ grading', 'Thẻ đã chấm điểm, có số cert', true, true, false, false, true, true, 2),
  ('fd048791-a896-5560-83f9-b906ff9556aa', 'phu-kien', 'Phụ kiện', 'Sleeves, binder, hộp đựng', true, false, true, false, false, false, 3),
  ('c7834efb-e539-5863-bf16-c2737466365d', 'hang-thuong', 'Hàng thường', 'Mẫu trống, thêm thuộc tính khi cần', true, false, false, false, false, false, 4)
on conflict (id) do nothing;

insert into public.attribute_defs (id, type_id, code, name, kind, options, required, filterable, visible, sort) values
  ('82fd5263-f8b4-5919-afd8-ca18ecca4aff', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'game', 'Game', 'select', array['Pokémon TCG','One Piece TCG','Riftbound']::text[], true, true, true, 0),
  ('5be24d84-52c2-536e-8005-30dc8c125cbf', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'form', 'Dạng sản phẩm', 'select', array['Booster Box','Elite Trainer Box','Booster Pack','Tin','Starter Deck','Collection Box']::text[], true, true, true, 1),
  ('dc3cf246-f51b-51f2-862b-6d7a405988e2', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'set_name', 'Bộ thẻ', 'text', '{}'::text[], false, false, true, 2),
  ('884aeeb9-e300-52f0-98d6-745827dc48a4', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'language', 'Ngôn ngữ', 'select', array['EN','JP','VN']::text[], true, true, true, 3),
  ('3aa10f25-6392-5999-86fa-55fb5cc168ae', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'packs', 'Số pack', 'number', '{}'::text[], false, false, true, 4),
  ('7d02ec83-fcae-5dd0-a40a-450e766a85c1', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'release_date', 'Ngày phát hành', 'date', '{}'::text[], false, false, true, 5),
  ('e38c4a5d-4367-5a73-89c9-c746d7982800', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'game', 'Game', 'select', array['Pokémon TCG','One Piece TCG','Riftbound']::text[], true, true, true, 0),
  ('1cf4a602-d796-5876-a707-7f416f6d6a06', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'set_name', 'Bộ thẻ', 'text', '{}'::text[], true, false, true, 1),
  ('95c6a87f-f732-5c3e-8246-32b06a740e28', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'card_no', 'Số thẻ', 'text', '{}'::text[], false, false, true, 2),
  ('aa0244a1-aa42-5447-b8b7-851a3e371eb8', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'rarity', 'Độ hiếm', 'select', array['Common','Uncommon','Rare','Ultra Rare','Secret Rare']::text[], false, true, true, 3),
  ('536acbb8-67e5-5e50-a81b-e1442b09e68a', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'condition', 'Tình trạng', 'select', array['NM','LP','MP','HP']::text[], true, true, true, 4),
  ('902cf408-0e5c-577b-b07c-7b99071ffa8d', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'language', 'Ngôn ngữ', 'select', array['EN','JP','VN']::text[], false, true, true, 5),
  ('35dde7b1-9991-5244-babe-1a4d730c0c5d', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'game', 'Game', 'select', array['Pokémon TCG','One Piece TCG','Riftbound']::text[], true, true, true, 0),
  ('d939ee0d-6f7f-5eb8-b06c-338f80fa4cb8', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'set_name', 'Bộ thẻ', 'text', '{}'::text[], true, false, true, 1),
  ('4703bdd0-30fd-5b70-b510-28de26edf45c', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'card_no', 'Số thẻ', 'text', '{}'::text[], false, false, true, 2),
  ('136a5260-24d3-5494-90b2-5751d0f356a5', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'grader', 'Hãng chấm', 'select', array['PSA','BGS','CGC']::text[], true, true, true, 3),
  ('15045dd6-73f2-5501-8d7d-ec4e16af0ce7', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'grade', 'Điểm', 'select', array['10','9.5','9','8.5','8']::text[], true, true, true, 4),
  ('0b43b855-3b90-5f47-a64b-1ca2eb83194e', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'cert_no', 'Số cert', 'text', '{}'::text[], true, false, true, 5),
  ('e692fde8-3516-5d3c-bce5-5c10797777d5', 'fd048791-a896-5560-83f9-b906ff9556aa', 'material', 'Chất liệu', 'select', array['PP trong suốt','Nhựa mờ','Da PU','Vải']::text[], true, false, true, 0),
  ('0c6255ae-2263-5ce1-977d-6724f881f30c', 'fd048791-a896-5560-83f9-b906ff9556aa', 'card_size', 'Kích thước thẻ phù hợp', 'select', array['Chuẩn (63×88)','Nhỏ Nhật (59×86)']::text[], false, true, true, 1),
  ('b896b260-a855-5904-974c-10ba06ddfc2c', 'fd048791-a896-5560-83f9-b906ff9556aa', 'pack_count', 'Số lượng trong gói', 'number', '{}'::text[], false, false, true, 2)
on conflict (id) do nothing;

insert into public.categories (id, parent_id, name, slug, sort, visible) values
  ('2433d42d-eaf9-5afd-bb3e-164333542d12', null, 'Thẻ bài', 'the-bai', 0, true),
  ('c3fd3120-e26a-59c7-be0d-56f12b78eccb', null, 'Phụ kiện', 'phu-kien', 1, true),
  ('77b793ff-d489-5688-afa2-b3c0c09b230e', null, 'Mô hình', 'mo-hinh', 2, true)
on conflict (id) do nothing;

insert into public.categories (id, parent_id, name, slug, sort, visible) values
  ('ad17fe33-3b0a-5453-8b1a-b10905495108', '2433d42d-eaf9-5afd-bb3e-164333542d12', 'Pokémon TCG', 'pokemon-tcg', 0, true),
  ('7589e86f-994e-563b-9c4c-a9e78d9347bd', '2433d42d-eaf9-5afd-bb3e-164333542d12', 'One Piece TCG', 'one-piece-tcg', 1, true),
  ('f48d5368-5b6a-540e-8192-f392885e328a', '2433d42d-eaf9-5afd-bb3e-164333542d12', 'Riftbound', 'riftbound', 2, true),
  ('df4ed986-ebfc-5bd7-bb8e-15fc0410a22d', 'c3fd3120-e26a-59c7-be0d-56f12b78eccb', 'Sleeves', 'sleeves', 0, true),
  ('d3d0e7d0-f099-5c7f-a1c6-a8d5e695a492', 'c3fd3120-e26a-59c7-be0d-56f12b78eccb', 'Binder', 'binder', 1, true),
  ('be8fff99-0e4b-5df6-8fd0-901384c24147', 'c3fd3120-e26a-59c7-be0d-56f12b78eccb', 'Hộp đựng', 'hop-dung', 2, true)
on conflict (id) do nothing;

insert into public.brands (id, name, slug) values
  ('b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'The Pokémon Company', 'pokemon'),
  ('822455eb-2fcf-57b1-9402-adc15200c469', 'Bandai', 'bandai'),
  ('80dcca09-4673-5190-a4be-7cf09f5df0c6', 'Riot Games', 'riot'),
  ('d5b7bb0a-5c60-5c80-8eba-3e1c6ec30379', 'Ultra Pro', 'ultra-pro'),
  ('7fdf4433-a515-5ea0-95c5-9540a7ab0122', 'Dark Poke', 'dark-poke')
on conflict (id) do nothing;

insert into public.collections (id, name, slug, description, visible, sort) values
  ('1810dcdc-2222-5472-8287-ac66b28b66ce', 'Chaos Rising', 'chaos-rising', 'Bộ mở rộng mới nhất', true, 0),
  ('a105f044-b6d1-59b8-8607-1dc72ade241c', 'Hàng mới về', 'hang-moi-ve', 'Vừa lên kệ tuần này', true, 1),
  ('588121a2-f141-5f3c-ab11-2b7e20e29810', 'Quà tặng mùa lễ hội', 'qua-tang', 'Gợi ý quà cho người chơi', true, 2)
on conflict (id) do nothing;

insert into public.products (id, type_id, category_id, brand_id, name, slug, sku, description, unit, price, compare_at_price, cost, status, online, pos, is_featured, attrs, tags, thumbnail, min_stock, purchase_limit, allow_preorder, preorder_deposit_pct, preorder_release_date, preorder_slots, preorder_closes_at, created_at) values
  ('bc381fb4-8f90-57aa-b7d9-4e9e3f0d93c5', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Booster Box Chaos Rising', 'booster-box-chaos-rising', 'PKM-BB-CR-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 5500000, null, 4400000, 'active', true, true, true, '{"game": "Pokémon TCG", "form": "Booster Box", "set_name": "Chaos Rising", "language": "EN", "packs": 36, "release_date": "2026-10-24"}'::jsonb, array['bán chạy']::text[], '/art/box1.svg', 3, null, false, null, null, null, null, '2026-11-04T09:00:00+00:00'),
  ('e200ef80-36fd-56b0-a08a-10872e481441', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Elite Trainer Box Chaos Rising', 'etb-chaos-rising', 'PKM-ETB-CR-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 2700000, 2900000, 2160000, 'active', true, true, true, '{"game": "Pokémon TCG", "form": "Elite Trainer Box", "set_name": "Chaos Rising", "language": "EN", "packs": 9}'::jsonb, '{}'::text[], '/art/etb1.svg', 3, null, false, null, null, null, null, '2026-11-04T03:00:00+00:00'),
  ('ad584866-3e6e-5157-b84d-823b3fc8db0f', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Booster Pack Mega Dream ex JP', 'booster-pack-mega-dream-ex-jp', 'PKM-BP-MD-JP', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 95000, null, 76000, 'active', true, true, true, '{"game": "Pokémon TCG", "form": "Booster Pack", "set_name": "Mega Dream ex", "language": "JP", "packs": 1}'::jsonb, '{}'::text[], '/art/pack1.svg', 3, null, false, null, null, null, null, '2026-11-03T21:00:00+00:00'),
  ('50f7db78-f7b6-577a-b1d0-50b268e2f7c5', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Mini Tin Chaos Rising', 'mini-tin-chaos-rising', 'PKM-TIN-CR-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 320000, null, 256000, 'active', true, true, false, '{"game": "Pokémon TCG", "form": "Tin", "set_name": "Chaos Rising", "language": "EN", "packs": 2}'::jsonb, '{}'::text[], '/art/tin1.svg', 3, null, false, null, null, null, null, '2026-11-03T15:00:00+00:00'),
  ('12cd3002-6c38-5d07-acdb-1f1b7ab5caaf', '9d876c01-e90f-5047-9e5e-a1140aa628ff', '7589e86f-994e-563b-9c4c-a9e78d9347bd', '822455eb-2fcf-57b1-9402-adc15200c469', 'Booster Box OP-12', 'booster-box-op-12', 'OP-BB-12-JP', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 1870000, null, 1496000, 'active', true, true, true, '{"game": "One Piece TCG", "form": "Booster Box", "set_name": "OP-12", "language": "JP", "packs": 24}'::jsonb, '{}'::text[], '/art/box2.svg', 3, null, false, null, null, null, null, '2026-11-03T09:00:00+00:00'),
  ('eb6ab2f8-ec72-5fb8-937a-07d6569a4f3a', '9d876c01-e90f-5047-9e5e-a1140aa628ff', '7589e86f-994e-563b-9c4c-a9e78d9347bd', '822455eb-2fcf-57b1-9402-adc15200c469', 'Booster Box OP-13 (Pre-order)', 'booster-box-op-13-preorder', 'OP-BB-13-JP', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 1950000, null, 1560000, 'active', true, true, true, '{"game": "One Piece TCG", "form": "Booster Box", "set_name": "OP-13", "language": "JP", "packs": 24, "release_date": "2026-12-12"}'::jsonb, '{}'::text[], '/art/box3.svg', 3, 2, true, 30, '2026-12-12', 60, '2026-11-30T16:59:59+00:00', '2026-11-03T03:00:00+00:00'),
  ('a16af232-0a0d-5b5b-8368-2a9b568ff9cf', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'f48d5368-5b6a-540e-8192-f392885e328a', '80dcca09-4673-5190-a4be-7cf09f5df0c6', 'Starter Deck Riftbound Origins', 'starter-deck-riftbound-origins', 'RB-SD-OR-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 450000, null, 360000, 'active', true, true, false, '{"game": "Riftbound", "form": "Starter Deck", "set_name": "Origins", "language": "EN"}'::jsonb, '{}'::text[], '/art/deck1.svg', 3, null, false, null, null, null, null, '2026-11-02T21:00:00+00:00'),
  ('fae19057-6a43-5d16-b631-288dbccfe9bf', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'f48d5368-5b6a-540e-8192-f392885e328a', '80dcca09-4673-5190-a4be-7cf09f5df0c6', 'Booster Box Riftbound Origins', 'booster-box-riftbound-origins', 'RB-BB-OR-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 3200000, null, 2560000, 'active', true, true, false, '{"game": "Riftbound", "form": "Booster Box", "set_name": "Origins", "language": "EN", "packs": 24}'::jsonb, '{}'::text[], '/art/box3.svg', 3, null, false, null, null, null, null, '2026-11-02T15:00:00+00:00'),
  ('58470d73-5281-53b9-9fb2-628084a7bafc', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Premium Collection Mega Charizard', 'premium-collection-mega-charizard', 'PKM-PC-MC-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 1450000, null, 1160000, 'active', true, true, false, '{"game": "Pokémon TCG", "form": "Collection Box", "set_name": "Mega Evolution", "language": "EN", "packs": 6}'::jsonb, '{}'::text[], '/art/coll1.svg', 3, null, false, null, null, null, null, '2026-11-02T09:00:00+00:00'),
  ('275bc22d-49dd-5800-94b4-72ed23d35c89', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Build & Battle Box Chaos Rising', 'build-battle-chaos-rising', 'PKM-BNB-CR-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 520000, null, 416000, 'active', true, true, false, '{"game": "Pokémon TCG", "form": "Starter Deck", "set_name": "Chaos Rising", "language": "EN", "packs": 4}'::jsonb, '{}'::text[], '/art/deck2.svg', 3, null, false, null, null, null, null, '2026-11-02T03:00:00+00:00'),
  ('c92a1d17-6b07-5691-b833-8c751fc6356c', '9d876c01-e90f-5047-9e5e-a1140aa628ff', '7589e86f-994e-563b-9c4c-a9e78d9347bd', '822455eb-2fcf-57b1-9402-adc15200c469', 'Starter Deck ST-21 One Piece', 'starter-deck-st-21', 'OP-ST-21-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 380000, null, 304000, 'active', true, true, false, '{"game": "One Piece TCG", "form": "Starter Deck", "set_name": "ST-21", "language": "EN"}'::jsonb, '{}'::text[], '/art/deck3.svg', 3, null, false, null, null, null, null, '2026-11-01T21:00:00+00:00'),
  ('5c18448e-747e-56ea-aaf1-28ba45ab23dc', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Booster Pack Chaos Rising EN', 'booster-pack-chaos-rising-en', 'PKM-BP-CR-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 160000, null, 128000, 'active', true, true, false, '{"game": "Pokémon TCG", "form": "Booster Pack", "set_name": "Chaos Rising", "language": "EN", "packs": 1}'::jsonb, '{}'::text[], '/art/pack2.svg', 3, null, false, null, null, null, null, '2026-11-01T15:00:00+00:00'),
  ('a722cc89-b72d-59e9-a68e-30c67bc38b28', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Pikachu ex · Chaos Rising #063 · NM', 'pikachu-ex-chaos-rising-063', 'SGL-0101', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 420000, null, 336000, 'active', true, true, true, '{"game": "Pokémon TCG", "set_name": "Chaos Rising", "card_no": "063/191", "rarity": "Ultra Rare", "condition": "NM", "language": "EN"}'::jsonb, '{}'::text[], '/art/card1.svg', 0, null, false, null, null, null, null, '2026-11-01T09:00:00+00:00'),
  ('58b2c938-7a49-56e8-bec0-f482a08e8d1b', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Gengar · Mega Dream #112 · LP', 'gengar-mega-dream-112', 'SGL-0102', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 180000, null, 144000, 'active', true, true, false, '{"game": "Pokémon TCG", "set_name": "Mega Dream ex", "card_no": "112/250", "rarity": "Rare", "condition": "LP", "language": "JP"}'::jsonb, '{}'::text[], '/art/card2.svg', 0, null, false, null, null, null, null, '2026-11-01T03:00:00+00:00'),
  ('98ba03a9-87e2-551f-bbed-0ad99355a8b5', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Umbreon ex · Prismatic #161 · NM', 'umbreon-ex-prismatic-161', 'SGL-0103', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 2350000, null, 1880000, 'active', true, true, true, '{"game": "Pokémon TCG", "set_name": "Prismatic Evolutions", "card_no": "161/131", "rarity": "Secret Rare", "condition": "NM", "language": "EN"}'::jsonb, '{}'::text[], '/art/card3.svg', 0, null, false, null, null, null, null, '2026-10-31T21:00:00+00:00'),
  ('1ddeb587-8d49-564f-80d0-245cd5dbd7cd', '5ba880dc-5ec4-5b34-bc07-01031d87615d', '7589e86f-994e-563b-9c4c-a9e78d9347bd', '822455eb-2fcf-57b1-9402-adc15200c469', 'Monkey D. Luffy · OP-12 #001 · NM', 'luffy-op12-001', 'SGL-0104', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 650000, null, 520000, 'active', true, true, false, '{"game": "One Piece TCG", "set_name": "OP-12", "card_no": "OP12-001", "rarity": "Secret Rare", "condition": "NM", "language": "JP"}'::jsonb, '{}'::text[], '/art/card1.svg', 0, null, false, null, null, null, null, '2026-10-31T15:00:00+00:00'),
  ('850557ab-be27-5e97-a013-88724b30d328', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Snorlax · Chaos Rising #143 · MP', 'snorlax-chaos-rising-143', 'SGL-0105', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 45000, null, 36000, 'active', true, true, false, '{"game": "Pokémon TCG", "set_name": "Chaos Rising", "card_no": "143/191", "rarity": "Uncommon", "condition": "MP", "language": "EN"}'::jsonb, '{}'::text[], '/art/card2.svg', 0, null, false, null, null, null, null, '2026-10-31T09:00:00+00:00'),
  ('3b16fca9-4c3e-588c-ba00-b21928a997b2', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'f48d5368-5b6a-540e-8192-f392885e328a', '80dcca09-4673-5190-a4be-7cf09f5df0c6', 'Jinx · Origins #030 · NM', 'jinx-origins-030', 'SGL-0106', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 280000, null, 224000, 'active', true, true, false, '{"game": "Riftbound", "set_name": "Origins", "card_no": "030/298", "rarity": "Rare", "condition": "NM", "language": "EN"}'::jsonb, '{}'::text[], '/art/card3.svg', 0, null, false, null, null, null, null, '2026-10-31T03:00:00+00:00'),
  ('0668ea86-b6b1-5931-94cd-5b99154730c4', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Charizard ex · Obsidian Flames #125 · PSA 10', 'charizard-ex-obsidian-flames-125-psa10', 'GRD-0001', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 6500000, null, 5200000, 'active', true, true, true, '{"game": "Pokémon TCG", "set_name": "Obsidian Flames", "card_no": "125/197", "grader": "PSA", "grade": "10", "cert_no": "[SỐ CERT]"}'::jsonb, '{}'::text[], '/art/slab1.svg', 0, null, false, null, null, null, null, '2026-10-30T21:00:00+00:00'),
  ('c2a19752-5825-5365-af69-f2dc718c1bcb', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Pikachu VMAX · Vivid Voltage #188 · BGS 9.5', 'pikachu-vmax-vivid-voltage-188-bgs95', 'GRD-0002', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 3800000, null, 3040000, 'active', true, true, false, '{"game": "Pokémon TCG", "set_name": "Vivid Voltage", "card_no": "188/185", "grader": "BGS", "grade": "9.5", "cert_no": "[SỐ CERT]"}'::jsonb, '{}'::text[], '/art/slab2.svg', 0, null, false, null, null, null, null, '2026-10-30T15:00:00+00:00'),
  ('694eb561-ab77-52fc-9fc6-f56a8460d43b', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', '7589e86f-994e-563b-9c4c-a9e78d9347bd', '822455eb-2fcf-57b1-9402-adc15200c469', 'Shanks · OP-01 #120 · PSA 9', 'shanks-op01-120-psa9', 'GRD-0003', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 2900000, null, 2320000, 'active', true, true, false, '{"game": "One Piece TCG", "set_name": "OP-01", "card_no": "OP01-120", "grader": "PSA", "grade": "9", "cert_no": "[SỐ CERT]"}'::jsonb, '{}'::text[], '/art/slab3.svg', 0, null, false, null, null, null, null, '2026-10-30T09:00:00+00:00'),
  ('cb28840b-d511-5590-8cd7-3768c25a33b4', 'fd048791-a896-5560-83f9-b906ff9556aa', 'df4ed986-ebfc-5bd7-bb8e-15fc0410a22d', '7fdf4433-a515-5ea0-95c5-9540a7ab0122', 'Sleeves Dark Poke 100 cái', 'sleeves-dark-poke-100', 'ACC-SLV-DP', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 95000, null, 76000, 'active', true, true, true, '{"material": "PP trong suốt", "card_size": "Chuẩn (63×88)", "pack_count": 100}'::jsonb, '{}'::text[], '/art/deck1.svg', 3, null, false, null, null, null, null, '2026-10-30T03:00:00+00:00'),
  ('4a262152-8a32-5508-b505-df9206d8195b', 'fd048791-a896-5560-83f9-b906ff9556aa', 'd3d0e7d0-f099-5c7f-a1c6-a8d5e695a492', 'd5b7bb0a-5c60-5c80-8eba-3e1c6ec30379', 'Binder Collection 9 ngăn', 'binder-collection-9-ngan', 'ACC-BND-09', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 650000, null, 520000, 'active', true, true, false, '{"material": "Da PU", "card_size": "Chuẩn (63×88)", "pack_count": 360}'::jsonb, '{}'::text[], '/art/coll2.svg', 3, null, false, null, null, null, null, '2026-10-29T21:00:00+00:00'),
  ('4fc19181-5dd3-5eb8-a1ae-4b538dd439ac', 'fd048791-a896-5560-83f9-b906ff9556aa', 'be8fff99-0e4b-5df6-8fd0-901384c24147', 'd5b7bb0a-5c60-5c80-8eba-3e1c6ec30379', 'Hộp đựng deck 100+', 'hop-dung-deck-100', 'ACC-DBX-100', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 120000, null, 96000, 'active', true, true, false, '{"material": "Nhựa mờ", "card_size": "Chuẩn (63×88)", "pack_count": 1}'::jsonb, '{}'::text[], '/art/coll3.svg', 3, null, false, null, null, null, null, '2026-10-29T15:00:00+00:00')
on conflict (id) do nothing;

insert into public.variants (id, product_id, sku, title, option_values, price, stock, active, sort) values
  ('0fad3ed9-798a-5583-8a4e-2f0f1410ff70', 'bc381fb4-8f90-57aa-b7d9-4e9e3f0d93c5', 'PKM-BB-CR-EN', 'Mặc định', '{}'::text[], null, 12, true, 0),
  ('7445a06f-e11d-5b35-bea2-5716b25e7547', 'e200ef80-36fd-56b0-a08a-10872e481441', 'PKM-ETB-CR-EN', 'Mặc định', '{}'::text[], null, 3, true, 0),
  ('d6437738-5608-524b-adf0-516fc18c666b', 'ad584866-3e6e-5157-b84d-823b3fc8db0f', 'PKM-BP-MD-JP', 'Mặc định', '{}'::text[], null, 240, true, 0),
  ('b3eae4dc-302b-561e-bda9-41a28be13226', '50f7db78-f7b6-577a-b1d0-50b268e2f7c5', 'PKM-TIN-CR-EN', 'Mặc định', '{}'::text[], null, 0, true, 0),
  ('7fde9b6f-3f59-5a76-8aa2-eb6efe0b4047', '12cd3002-6c38-5d07-acdb-1f1b7ab5caaf', 'OP-BB-12-JP', 'Mặc định', '{}'::text[], null, 8, true, 0),
  ('70136bcc-cb98-5895-a480-e1e850825905', 'eb6ab2f8-ec72-5fb8-937a-07d6569a4f3a', 'OP-BB-13-JP', 'Mặc định', '{}'::text[], null, 0, true, 0),
  ('8c26f246-3280-5440-b278-7e8f905ecd94', 'a16af232-0a0d-5b5b-8368-2a9b568ff9cf', 'RB-SD-OR-EN', 'Mặc định', '{}'::text[], null, 22, true, 0),
  ('9cf6b2ae-9517-5aa5-9a77-1ca1becabe8e', 'fae19057-6a43-5d16-b631-288dbccfe9bf', 'RB-BB-OR-EN', 'Mặc định', '{}'::text[], null, 5, true, 0),
  ('0db77e90-78c7-546a-881e-e86b40b105e6', '58470d73-5281-53b9-9fb2-628084a7bafc', 'PKM-PC-MC-EN', 'Mặc định', '{}'::text[], null, 6, true, 0),
  ('be210c69-ccbc-5e47-944f-086f395c5b35', '275bc22d-49dd-5800-94b4-72ed23d35c89', 'PKM-BNB-CR-EN', 'Mặc định', '{}'::text[], null, 14, true, 0),
  ('586c7aa8-4740-52c2-b6d5-2e3972c34b5c', 'c92a1d17-6b07-5691-b833-8c751fc6356c', 'OP-ST-21-EN', 'Mặc định', '{}'::text[], null, 18, true, 0),
  ('43df1daa-d568-55b5-80d7-d763a98d2b72', '5c18448e-747e-56ea-aaf1-28ba45ab23dc', 'PKM-BP-CR-EN', 'Mặc định', '{}'::text[], null, 120, true, 0),
  ('7aadbcf2-b2dd-5150-b698-b7f3bda1f3a5', 'a722cc89-b72d-59e9-a68e-30c67bc38b28', 'SGL-0101', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('1c5fcf5b-fb29-5a64-b084-df4345fa72ad', '58b2c938-7a49-56e8-bec0-f482a08e8d1b', 'SGL-0102', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('27c806a7-6c3c-5fd3-8ac4-c9704629a8a6', '98ba03a9-87e2-551f-bbed-0ad99355a8b5', 'SGL-0103', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('a502f803-9fa7-5d7d-829a-dd54225acacc', '1ddeb587-8d49-564f-80d0-245cd5dbd7cd', 'SGL-0104', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('39d3deee-62c7-501f-b511-73692d25d3c2', '850557ab-be27-5e97-a013-88724b30d328', 'SGL-0105', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('a6f65b31-781a-590c-a927-412f4fe5db05', '3b16fca9-4c3e-588c-ba00-b21928a997b2', 'SGL-0106', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('5c178d8a-2f55-5d56-9123-b4e4ef856474', '0668ea86-b6b1-5931-94cd-5b99154730c4', 'GRD-0001', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('7dfde197-7fd8-5079-9314-d6c0c5406a3b', 'c2a19752-5825-5365-af69-f2dc718c1bcb', 'GRD-0002', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('42523df8-c652-5e8d-b879-aa216211a156', '694eb561-ab77-52fc-9fc6-f56a8460d43b', 'GRD-0003', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('f2abae35-30bc-5e97-a144-3e090d40171e', 'cb28840b-d511-5590-8cd7-3768c25a33b4', 'ACC-SLV-DP-1', 'Đen · Chuẩn', array['Đen','Chuẩn']::text[], 95000, 24, true, 0),
  ('994ee8a0-bd5c-577c-8228-ba60f65ac4ed', 'cb28840b-d511-5590-8cd7-3768c25a33b4', 'ACC-SLV-DP-2', 'Đen · Nhỏ', array['Đen','Nhỏ']::text[], 85000, 12, true, 1),
  ('0437c27f-0453-5852-ae33-95a6798506c5', 'cb28840b-d511-5590-8cd7-3768c25a33b4', 'ACC-SLV-DP-3', 'Xanh · Chuẩn', array['Xanh','Chuẩn']::text[], 95000, 28, true, 2),
  ('964a6cd5-f2cb-5a7f-aa4f-8cf7c14abcb1', 'cb28840b-d511-5590-8cd7-3768c25a33b4', 'ACC-SLV-DP-4', 'Xanh · Nhỏ', array['Xanh','Nhỏ']::text[], 85000, 0, true, 3),
  ('b6b37227-c781-50cb-9453-f39f94ca251d', '4a262152-8a32-5508-b505-df9206d8195b', 'ACC-BND-09-1', 'Đen', array['Đen']::text[], null, 12, true, 0),
  ('ec9a2063-b339-5b5a-9cc4-8bfa453ac9c6', '4a262152-8a32-5508-b505-df9206d8195b', 'ACC-BND-09-2', 'Xanh dương', array['Xanh dương']::text[], null, 8, true, 1),
  ('f0d5f94e-51a5-5551-aa7d-d8568739b39a', '4fc19181-5dd3-5eb8-a1ae-4b538dd439ac', 'ACC-DBX-100', 'Mặc định', '{}'::text[], null, 30, true, 0)
on conflict (id) do nothing;

insert into public.product_images (id, product_id, url, alt, sort) values
  ('f8939720-765b-5a4b-8cad-aab6f330c230', 'bc381fb4-8f90-57aa-b7d9-4e9e3f0d93c5', '/art/box1.svg', 'Booster Box Chaos Rising', 0),
  ('b8e9828d-3095-532c-a8e9-e7189713d8d7', 'bc381fb4-8f90-57aa-b7d9-4e9e3f0d93c5', '/art/box2.svg', 'Booster Box Chaos Rising', 1),
  ('803ad8e1-1cd4-54ad-b94b-8828d4370bce', 'e200ef80-36fd-56b0-a08a-10872e481441', '/art/etb1.svg', 'Elite Trainer Box Chaos Rising', 0),
  ('199a3dd3-fbbb-5618-b467-dc3812bb04dd', 'e200ef80-36fd-56b0-a08a-10872e481441', '/art/etb2.svg', 'Elite Trainer Box Chaos Rising', 1),
  ('7851a868-4fa6-5ff4-a783-fabe2c11b285', 'ad584866-3e6e-5157-b84d-823b3fc8db0f', '/art/pack1.svg', 'Booster Pack Mega Dream ex JP', 0),
  ('1e303974-9021-5f0a-afef-77ae0c743043', 'ad584866-3e6e-5157-b84d-823b3fc8db0f', '/art/pack2.svg', 'Booster Pack Mega Dream ex JP', 1),
  ('673fa107-130c-5617-b6e8-0952443f839a', '50f7db78-f7b6-577a-b1d0-50b268e2f7c5', '/art/tin1.svg', 'Mini Tin Chaos Rising', 0),
  ('1a01e1e4-1a68-5068-aab9-123a0507749a', '50f7db78-f7b6-577a-b1d0-50b268e2f7c5', '/art/tin2.svg', 'Mini Tin Chaos Rising', 1),
  ('5421d64e-28aa-5a2c-aaae-41385b544009', '12cd3002-6c38-5d07-acdb-1f1b7ab5caaf', '/art/box2.svg', 'Booster Box OP-12', 0),
  ('960b2038-b741-5c36-9071-b684ae73b6d5', '12cd3002-6c38-5d07-acdb-1f1b7ab5caaf', '/art/box1.svg', 'Booster Box OP-12', 1),
  ('84a0ac40-a8bb-52e7-b3b3-aec453a2fb0f', 'eb6ab2f8-ec72-5fb8-937a-07d6569a4f3a', '/art/box3.svg', 'Booster Box OP-13 (Pre-order)', 0),
  ('02110c60-499b-52e6-8130-c62795ba26c3', 'eb6ab2f8-ec72-5fb8-937a-07d6569a4f3a', '/art/box1.svg', 'Booster Box OP-13 (Pre-order)', 1),
  ('0f3bb6a0-f276-5bed-bc6e-6ed386c671cc', 'a16af232-0a0d-5b5b-8368-2a9b568ff9cf', '/art/deck1.svg', 'Starter Deck Riftbound Origins', 0),
  ('a162052a-0d81-524c-bba9-5473a23ac875', 'a16af232-0a0d-5b5b-8368-2a9b568ff9cf', '/art/deck2.svg', 'Starter Deck Riftbound Origins', 1),
  ('cb0302ef-773c-5326-8789-e1c0f1cef077', 'fae19057-6a43-5d16-b631-288dbccfe9bf', '/art/box3.svg', 'Booster Box Riftbound Origins', 0),
  ('cf241f80-44ac-5b7c-97ed-7b0e494a3ac1', 'fae19057-6a43-5d16-b631-288dbccfe9bf', '/art/box1.svg', 'Booster Box Riftbound Origins', 1),
  ('af79c523-19d7-5d72-b3c9-b9cc6d898c53', '58470d73-5281-53b9-9fb2-628084a7bafc', '/art/coll1.svg', 'Premium Collection Mega Charizard', 0),
  ('48181fa4-c8d0-503f-95ed-e984c9453412', '58470d73-5281-53b9-9fb2-628084a7bafc', '/art/coll2.svg', 'Premium Collection Mega Charizard', 1),
  ('116436d5-445e-51e9-b2a0-164e397f2ec1', '275bc22d-49dd-5800-94b4-72ed23d35c89', '/art/deck2.svg', 'Build & Battle Box Chaos Rising', 0),
  ('1c82a79a-de0f-5718-930b-8e3cd39bc402', '275bc22d-49dd-5800-94b4-72ed23d35c89', '/art/deck1.svg', 'Build & Battle Box Chaos Rising', 1),
  ('9b16e84e-397e-51af-aaa7-794f11d6fb41', 'c92a1d17-6b07-5691-b833-8c751fc6356c', '/art/deck3.svg', 'Starter Deck ST-21 One Piece', 0),
  ('1abc998f-53d7-583a-9ad8-f67f376be928', 'c92a1d17-6b07-5691-b833-8c751fc6356c', '/art/deck1.svg', 'Starter Deck ST-21 One Piece', 1),
  ('8df572cd-72df-5f36-afbe-7e360bde3cdb', '5c18448e-747e-56ea-aaf1-28ba45ab23dc', '/art/pack2.svg', 'Booster Pack Chaos Rising EN', 0),
  ('73eb5e79-204b-5146-b45d-89ea45702470', '5c18448e-747e-56ea-aaf1-28ba45ab23dc', '/art/pack1.svg', 'Booster Pack Chaos Rising EN', 1),
  ('dce59953-f225-594c-a9b3-032fa42a2fbc', 'a722cc89-b72d-59e9-a68e-30c67bc38b28', '/art/card1.svg', 'Pikachu ex · Chaos Rising #063 · NM', 0),
  ('95d96b8e-4472-51b5-b5e9-7520a56efa49', 'a722cc89-b72d-59e9-a68e-30c67bc38b28', '/art/card2.svg', 'Pikachu ex · Chaos Rising #063 · NM', 1),
  ('66513347-f013-57e3-b892-ff77a2beeccc', '58b2c938-7a49-56e8-bec0-f482a08e8d1b', '/art/card2.svg', 'Gengar · Mega Dream #112 · LP', 0),
  ('113bd9f2-ba55-5f3e-9fac-8cf391882cd8', '58b2c938-7a49-56e8-bec0-f482a08e8d1b', '/art/card1.svg', 'Gengar · Mega Dream #112 · LP', 1),
  ('90dfee59-da04-5986-bf15-a509c100293f', '98ba03a9-87e2-551f-bbed-0ad99355a8b5', '/art/card3.svg', 'Umbreon ex · Prismatic #161 · NM', 0),
  ('5d2152a2-e110-5291-be21-2c3590c7e1b8', '98ba03a9-87e2-551f-bbed-0ad99355a8b5', '/art/card1.svg', 'Umbreon ex · Prismatic #161 · NM', 1),
  ('a9881793-81cf-5363-a188-c19dda25bafc', '1ddeb587-8d49-564f-80d0-245cd5dbd7cd', '/art/card1.svg', 'Monkey D. Luffy · OP-12 #001 · NM', 0),
  ('ba2d7384-2a29-592e-9d87-fee8bceaeebb', '1ddeb587-8d49-564f-80d0-245cd5dbd7cd', '/art/card2.svg', 'Monkey D. Luffy · OP-12 #001 · NM', 1),
  ('945a77ac-9269-5e77-979a-99e7fa94f0ff', '850557ab-be27-5e97-a013-88724b30d328', '/art/card2.svg', 'Snorlax · Chaos Rising #143 · MP', 0),
  ('55ffc6f9-453f-589f-94f1-29b1d836fe5c', '850557ab-be27-5e97-a013-88724b30d328', '/art/card1.svg', 'Snorlax · Chaos Rising #143 · MP', 1),
  ('ae4aced2-5d95-528b-bb1b-0cd0dc2a695e', '3b16fca9-4c3e-588c-ba00-b21928a997b2', '/art/card3.svg', 'Jinx · Origins #030 · NM', 0),
  ('e33e83eb-f30c-54b5-a1e4-6266f485e8f9', '3b16fca9-4c3e-588c-ba00-b21928a997b2', '/art/card1.svg', 'Jinx · Origins #030 · NM', 1),
  ('85af6fd7-cfbb-50ad-a302-df749a368e31', '0668ea86-b6b1-5931-94cd-5b99154730c4', '/art/slab1.svg', 'Charizard ex · Obsidian Flames #125 · PSA 10', 0),
  ('43f78304-ddd8-529f-8204-eded20e86add', '0668ea86-b6b1-5931-94cd-5b99154730c4', '/art/slab2.svg', 'Charizard ex · Obsidian Flames #125 · PSA 10', 1),
  ('4a162001-d3d7-5030-95a6-5fb48ac5e14d', 'c2a19752-5825-5365-af69-f2dc718c1bcb', '/art/slab2.svg', 'Pikachu VMAX · Vivid Voltage #188 · BGS 9.5', 0),
  ('f9a1bcff-5852-53d2-aa87-7fa3b41b809c', 'c2a19752-5825-5365-af69-f2dc718c1bcb', '/art/slab1.svg', 'Pikachu VMAX · Vivid Voltage #188 · BGS 9.5', 1),
  ('8c1d0877-6b71-5272-8278-19567bd80969', '694eb561-ab77-52fc-9fc6-f56a8460d43b', '/art/slab3.svg', 'Shanks · OP-01 #120 · PSA 9', 0),
  ('f9d43ffa-8fd4-589c-8c51-50c1ccb033d0', '694eb561-ab77-52fc-9fc6-f56a8460d43b', '/art/slab1.svg', 'Shanks · OP-01 #120 · PSA 9', 1),
  ('52267960-45fd-59c4-bbe1-f8fb50533bf6', 'cb28840b-d511-5590-8cd7-3768c25a33b4', '/art/deck1.svg', 'Sleeves Dark Poke 100 cái', 0),
  ('48839718-f7d8-52eb-903a-2d492da2007d', 'cb28840b-d511-5590-8cd7-3768c25a33b4', '/art/deck2.svg', 'Sleeves Dark Poke 100 cái', 1),
  ('cb8d2499-0a61-5b4a-a44c-41d18a885dbf', '4a262152-8a32-5508-b505-df9206d8195b', '/art/coll2.svg', 'Binder Collection 9 ngăn', 0),
  ('daceb784-bfab-50f9-8cef-78fee34a6ee1', '4a262152-8a32-5508-b505-df9206d8195b', '/art/coll1.svg', 'Binder Collection 9 ngăn', 1),
  ('d1d37189-6f23-5e96-a55e-f0d14e2829f4', '4fc19181-5dd3-5eb8-a1ae-4b538dd439ac', '/art/coll3.svg', 'Hộp đựng deck 100+', 0),
  ('43db8890-79cf-55d9-8767-01f25cf53159', '4fc19181-5dd3-5eb8-a1ae-4b538dd439ac', '/art/coll1.svg', 'Hộp đựng deck 100+', 1)
on conflict (id) do nothing;

insert into public.product_options (id, product_id, name, values, sort) values
  ('e934ae78-93d3-5bf9-a7c1-39a35fdcc400', 'cb28840b-d511-5590-8cd7-3768c25a33b4', 'Màu sắc', array['Đen','Xanh']::text[], 0),
  ('d65d9f22-7cc5-56fb-b30b-7f14f9360ab1', 'cb28840b-d511-5590-8cd7-3768c25a33b4', 'Kích cỡ', array['Chuẩn','Nhỏ']::text[], 1),
  ('94d0a7b0-1e3b-5633-b073-152957e89f6b', '4a262152-8a32-5508-b505-df9206d8195b', 'Màu sắc', array['Đen','Xanh dương']::text[], 0)
on conflict (id) do nothing;

insert into public.product_collections (product_id, collection_id) values
  ('bc381fb4-8f90-57aa-b7d9-4e9e3f0d93c5', '1810dcdc-2222-5472-8287-ac66b28b66ce'),
  ('bc381fb4-8f90-57aa-b7d9-4e9e3f0d93c5', 'a105f044-b6d1-59b8-8607-1dc72ade241c'),
  ('e200ef80-36fd-56b0-a08a-10872e481441', '1810dcdc-2222-5472-8287-ac66b28b66ce'),
  ('ad584866-3e6e-5157-b84d-823b3fc8db0f', 'a105f044-b6d1-59b8-8607-1dc72ade241c'),
  ('50f7db78-f7b6-577a-b1d0-50b268e2f7c5', '1810dcdc-2222-5472-8287-ac66b28b66ce'),
  ('eb6ab2f8-ec72-5fb8-937a-07d6569a4f3a', 'a105f044-b6d1-59b8-8607-1dc72ade241c'),
  ('58470d73-5281-53b9-9fb2-628084a7bafc', '588121a2-f141-5f3c-ab11-2b7e20e29810'),
  ('275bc22d-49dd-5800-94b4-72ed23d35c89', '1810dcdc-2222-5472-8287-ac66b28b66ce'),
  ('275bc22d-49dd-5800-94b4-72ed23d35c89', '588121a2-f141-5f3c-ab11-2b7e20e29810'),
  ('5c18448e-747e-56ea-aaf1-28ba45ab23dc', '1810dcdc-2222-5472-8287-ac66b28b66ce'),
  ('cb28840b-d511-5590-8cd7-3768c25a33b4', '588121a2-f141-5f3c-ab11-2b7e20e29810'),
  ('4a262152-8a32-5508-b505-df9206d8195b', '588121a2-f141-5f3c-ab11-2b7e20e29810')
on conflict (product_id, collection_id) do nothing;
