import type { Database } from '@/lib/database.types'
export type ProductStatus = Database['public']['Enums']['product_status']
export type AttrKind = Database['public']['Enums']['attr_kind']
export type OrderStatus = Database['public']['Enums']['order_status']
export type StaffRole = Database['public']['Enums']['staff_role']
export type TradeinStatus = Database['public']['Enums']['tradein_status']

export interface ProductType {
  id: string
  code: string
  name: string
  description: string
  track_inventory: boolean
  is_unique: boolean
  has_variants: boolean
  allow_preorder: boolean
  allow_tradein: boolean
  hold_in_cart: boolean
  sort: number
}

export interface AttributeDef {
  id: string
  type_id: string
  code: string
  name: string
  kind: AttrKind
  options: string[]
  required: boolean
  filterable: boolean
  visible: boolean
  sort: number
}

export interface Category {
  id: string
  parent_id: string | null
  name: string
  slug: string
  depth: number
  sort: number
  visible: boolean
}

export interface Brand {
  id: string
  name: string
  slug: string
}

export interface Collection {
  id: string
  name: string
  slug: string
  description: string
  visible: boolean
  sort: number
}

export interface Product {
  id: string
  type_id: string
  category_id: string | null
  brand_id: string | null
  name: string
  slug: string
  sku: string
  description: string
  unit: string
  price: number
  compare_at_price: number | null
  cost: number | null
  status: ProductStatus
  online: boolean
  pos: boolean
  is_featured: boolean
  attrs: Record<string, string | number | boolean>
  tags: string[]
  thumbnail: string | null
  weight_g: number | null
  min_stock: number
  purchase_limit: number | null
  allow_preorder: boolean
  preorder_deposit_pct: number | null
  preorder_release_date: string | null
  preorder_slots: number | null
  preorder_closes_at: string | null
  stock_total: number
  min_price: number | null
  max_price: number | null
  variant_count: number
  seo_title?: string | null
  seo_description?: string | null
  created_at: string
}

/** Dữ liệu gọn cho thẻ sản phẩm ở trang danh sách. */
export type ProductCard = Pick<
  Product,
  'id' | 'type_id' | 'name' | 'slug' | 'price' | 'compare_at_price' | 'thumbnail' | 'stock_total' | 'min_price' | 'max_price' | 'variant_count' | 'allow_preorder' | 'preorder_release_date' | 'attrs' | 'created_at'
>

export interface Variant {
  id: string
  product_id: string
  sku: string
  title: string
  option_values: string[]
  price: number | null
  stock: number
  active: boolean
  image_url: string | null
  sort: number
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt: string
  sort: number
}

export interface ProductOption {
  id: string
  product_id: string
  name: string
  values: string[]
  sort: number
}

export interface ProductDetail extends Product {
  variants: Variant[]
  images: ProductImage[]
  options: ProductOption[]
  collection_ids: string[]
}

export interface OrderItem {
  name: string
  variant_title: string
  sku: string
  image_url: string | null
  unit_price: number
  qty: number
  line_total: number
  is_preorder: boolean
}

export interface OrderEvent {
  status: OrderStatus | null
  message: string
  created_at: string
  actor?: string
}

export interface PublicOrder {
  code: string
  kind: 'order' | 'preorder'
  status: OrderStatus
  fulfillment: 'delivery' | 'pickup'
  customer_name: string
  phone: string
  email: string | null
  province: string | null
  address: string | null
  note: string | null
  subtotal: number
  shipping_fee: number
  discount: number
  total: number
  amount_due: number
  paid_amount: number
  deposit_pct: number | null
  expires_at: string | null
  paid_at: string | null
  created_at: string
  customer_confirmed_at: string | null
  has_proof: boolean
  items: OrderItem[]
  events: OrderEvent[]
}

export interface AdminOrder {
  id: string
  code: string
  access_token: string
  kind: 'order' | 'preorder'
  channel: 'online' | 'pos'
  status: OrderStatus
  payment_method: 'bank_transfer' | 'cash' | 'card'
  fulfillment: 'delivery' | 'pickup'
  customer_name: string
  phone: string
  email: string | null
  province: string | null
  address: string | null
  note: string | null
  subtotal: number
  shipping_fee: number
  discount: number
  total: number
  amount_due: number
  paid_amount: number
  proof_path: string | null
  customer_confirmed_at: string | null
  expires_at: string | null
  created_at: string
}

export interface TradeinItem {
  client_id?: string
  condition_note?: string
  name: string
  condition?: string
  qty?: number
  expected?: number
  note?: string
}

export interface TradeinRequest {
  id: string
  code: string
  customer_name: string
  phone: string
  email: string | null
  method: 'store' | 'ship'
  payout: 'cash' | 'credit'
  items: TradeinItem[]
  photos?: import('@/lib/database.types').Json
  note: string | null
  status: TradeinStatus
  quoted_total: number | null
  quote_expires_at: string | null
  staff_note: string | null
  created_at: string
}

export interface Staff {
  id: string
  user_id: string | null
  email: string
  full_name: string
  role: StaffRole
  allow_google: boolean
  active: boolean
  created_at: string
}

export interface CustomerSummary {
  phone: string
  customer_name: string
  email: string | null
  has_account: boolean
  order_count: number
  total_spent: number
  last_order_at: string
}

export interface ShopSettings {
  shop: { name: string; tagline: string; hotline: string; zalo: string; address: string; email: string }
  bank: { bank_bin: string; bank_name: string; account_no: string; account_name: string; transfer_template: string }
  shipping: { hcm: number; other: number; pickup: number; free_over: number | null; pickup_hold_days: number }
  rules: {
    unpaid_cancel_hours: number
    preorder_deposit_pct: number
    preorder_balance_days: number
    cart_hold_minutes: number
    tradein_quote_hours: number
    tradein_approval_limit: number
    cashier_max_discount_pct: number
  }
  modules: { preorder: boolean; tradein: boolean; cart_hold: boolean; pos: boolean; attribute_filters: boolean }
}

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string }
