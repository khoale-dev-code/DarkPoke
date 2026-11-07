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
