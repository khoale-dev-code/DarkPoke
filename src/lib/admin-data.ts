import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import { adminPage, PRODUCT_SORTS, productSort, productStatus } from '@/lib/admin-query'
import { isDemo } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import { getCatalogMeta, toDetail, type CatalogMeta } from '@/lib/catalog'
import { DEMO_CUSTOMERS, DEMO_ORDERS, DEMO_STAFF, DEMO_TRADEINS, demo } from '@/lib/demo'
import { unaccent } from '@/lib/utils'
import type {
  AdminOrder, CustomerSummary, OrderEvent, OrderItem, OrderStatus, Product, ProductDetail, ShopSettings, Staff, TradeinRequest, TradeinStatus
} from '@/lib/types'

export const ADMIN_PAGE = 20

const range = (page: number) => [(page - 1) * ADMIN_PAGE, page * ADMIN_PAGE - 1] as const
const clean = (q?: string) => (q ?? '').replace(/[%_,()"\\]/g, ' ').trim().slice(0, 60)

export interface Dashboard {
  revenue_today: number
  orders_today: number
  pending_payment: number
  to_pack: number
  tradein_new: number
  low_stock: number
  revenue_7d: { day: string; total: number }[]
}

export const getDashboard = cache(async (): Promise<Dashboard> => {
  if (isDemo) {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400_000)
      return { day: d.toISOString().slice(0, 10), total: [4.2, 6.8, 3.1, 9.4, 5.5, 12.6, 7.9][i]! * 1_000_000 }
    })
    return { revenue_today: 7_900_000, orders_today: 6, pending_payment: 2, to_pack: 1, tradein_new: 1, low_stock: 3, revenue_7d: days }
  }
  const sb = await createClient()
  const { data, error } = await sb.rpc('admin_dashboard')
  if (error) throw new Error(error.message)
  return z.object({revenue_today:z.number(),orders_today:z.number(),pending_payment:z.number(),to_pack:z.number(),tradein_new:z.number(),low_stock:z.number(),revenue_7d:z.array(z.object({day:z.string(),total:z.number()}))}).parse(data)
})

export const getNavBadges = cache(async (): Promise<Record<string, number>> => {
  if (isDemo) return { '/admin/don-hang': 2, '/admin/thu-mua': 1 }
  const sb = await createClient()
  const [o, t] = await Promise.all([
    sb.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending_payment', 'paid']).eq('channel', 'online'),
    sb.from('tradein_requests').select('id', { count: 'exact', head: true }).eq('status', 'new')
  ])
  return { '/admin/don-hang': o.count ?? 0, '/admin/thu-mua': t.count ?? 0 }
})

// ---------------------------------------------------------------- Đơn hàng
export interface OrderFilter {
  status?: OrderStatus | 'all'
  kind?: 'order' | 'preorder'
  channel?: 'online' | 'pos'
  q?: string
  page?: number
  sort?: 'newest' | 'oldest' | 'total-desc'
}

const ORDER_COLS = 'id,code,access_token,kind,channel,status,payment_method,fulfillment,customer_name,phone,email,province,address,note,subtotal,shipping_fee,discount,total,amount_due,paid_amount,proof_path,customer_confirmed_at,expires_at,created_at'

export type OrderListRow = Pick<AdminOrder, 'id' | 'code' | 'kind' | 'channel' | 'status' | 'customer_name' | 'phone' | 'total' | 'amount_due' | 'paid_amount' | 'created_at' | 'customer_confirmed_at'>
const ORDER_LIST_COLS = 'id,code,kind,channel,status,customer_name,phone,total,amount_due,paid_amount,created_at,customer_confirmed_at'
function orderListRow(o: AdminOrder): OrderListRow {
  return { id:o.id, code:o.code, kind:o.kind, channel:o.channel, status:o.status, customer_name:o.customer_name, phone:o.phone, total:o.total, amount_due:o.amount_due, paid_amount:o.paid_amount, created_at:o.created_at, customer_confirmed_at:o.customer_confirmed_at }
}
export async function listRecentOrders(): Promise<OrderListRow[]> {
  if (isDemo) return DEMO_ORDERS.slice(0,6).map(orderListRow)
  const sb = await createClient()
  const { data, error } = await sb.from('orders').select(ORDER_LIST_COLS).order('created_at',{ ascending:false }).limit(6)
  if (error) throw new Error(error.message)
  return (data ?? []) as OrderListRow[]
}

export async function listOrders(f: OrderFilter): Promise<{ rows: OrderListRow[]; count: number; counts: Record<string, number> }> {
  const page = adminPage(f.page)
  const q = unaccent(clean(f.q).toLowerCase())
  if (isDemo) {
    let rows = DEMO_ORDERS as AdminOrder[]
    if (f.kind) rows = rows.filter((o) => o.kind === f.kind)
    if (f.channel) rows = rows.filter((o) => o.channel === f.channel)
    if (q) rows = rows.filter((o) => unaccent(`${o.code} ${o.phone} ${o.customer_name} ${o.email ?? ''}`.toLowerCase()).includes(q))
    const counts: Record<string, number> = { all: rows.length }
    for (const o of rows) counts[o.status] = (counts[o.status] ?? 0) + 1
    if (f.status && f.status !== 'all') rows = rows.filter((o) => o.status === f.status)
    const [from,to] = range(page)
    return { rows: [...rows].sort((a,b) => f.sort === 'total-desc' ? b.total-a.total : f.sort === 'oldest' ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at)).slice(from,to+1).map(orderListRow), count: rows.length, counts }
  }
  const sb = await createClient()
  let query = sb.from('orders').select(ORDER_LIST_COLS, { count: 'exact' })
  if (f.kind) query = query.eq('kind', f.kind)
  if (f.channel) query = query.eq('channel', f.channel)
  if (f.status && f.status !== 'all') query = query.eq('status', f.status)
  if (q) query = query.ilike('search_text', `%${q}%`)
  const [from, to] = range(page)
  const [res, counter] = await Promise.all([
    query.order(f.sort === 'total-desc' ? 'total' : 'created_at', { ascending: f.sort === 'oldest' }).order('id', { ascending: false }).range(from, to),
    sb.rpc('admin_order_counts_v1', { p_kind: f.kind ?? null, p_channel: f.channel ?? null, p_search: q })
  ])
  if (res.error || counter.error) throw new Error('Cần áp dụng migration 20261104000300_admin_experience.sql trước khi dùng bộ lọc đơn hàng.')
  return { rows: (res.data ?? []) as OrderListRow[], count: res.count ?? 0, counts: counter.data as Record<string, number> }
}

export async function getOrder(code: string): Promise<(AdminOrder & { items: OrderItem[]; events: OrderEvent[]; proof_url: string | null }) | null> {
  if (isDemo) {
    const o = DEMO_ORDERS.find((x) => x.code === code)
    return o ? { ...o, proof_url: null } : null
  }
  const sb = await createClient()
  const { data } = await sb.from('orders').select(`${ORDER_COLS}, order_items(*), order_events(status,message,actor,created_at)`).eq('code', code).maybeSingle()
  if (!data) return null
  const { order_items, order_events, ...o } = data as unknown as AdminOrder & { order_items: OrderItem[]; order_events: OrderEvent[] }
  let proof_url: string | null = null
  if (o.proof_path) {
    const s = await sb.storage.from('payment-proofs').createSignedUrl(o.proof_path, 600)
    proof_url = s.data?.signedUrl ?? null
  }
  return { ...o, items: order_items, events: [...order_events].sort((a, b) => a.created_at.localeCompare(b.created_at)), proof_url }
}

// ---------------------------------------------------------------- Sản phẩm
export interface ProductFilter {
  type?: string
  status?: string
  q?: string
  low?: boolean
  page?: number
  preorder?: boolean
  sort?: string
}

export type AdminProductRow = Pick<Product, 'id' | 'name' | 'sku' | 'slug' | 'type_id' | 'category_id' | 'price' | 'min_price' | 'max_price' | 'stock_total' | 'min_stock' | 'variant_count' | 'status' | 'online' | 'thumbnail' | 'allow_preorder' | 'preorder_slots'>

export async function listAdminProducts(f: ProductFilter): Promise<{ rows: AdminProductRow[]; count: number }> {
  const page = adminPage(f.page)
  const status=productStatus(f.status)
  const q = unaccent(clean(f.q).toLowerCase())
  if (isDemo) {
    let rows = demo.products as AdminProductRow[]
    if (f.type) rows = rows.filter((p) => demo.types.find((t) => t.id === p.type_id)?.code === f.type)
    if (status) rows = rows.filter((p) => p.status === status)
    else rows = rows.filter((p) => p.status !== 'archived')
    if (f.preorder) rows = rows.filter((p) => p.allow_preorder)
    if (f.low) rows = rows.filter((p) => p.status === 'active' && p.stock_total <= p.min_stock && !p.allow_preorder && demo.types.some((t) => t.id === p.type_id && t.track_inventory && !t.is_unique))
    if (q) rows = rows.filter((p) => unaccent(`${p.name} ${p.sku}`.toLowerCase()).includes(q))
    const sort = productSort(f.sort)
    rows = [...rows].sort((a,b) => sort === 'name-asc' ? a.name.localeCompare(b.name,'vi') : sort === 'price-asc' ? (a.min_price ?? a.price)-(b.min_price ?? b.price) : sort === 'price-desc' ? (b.min_price ?? b.price)-(a.min_price ?? a.price) : sort === 'stock-asc' ? a.stock_total-b.stock_total : 0)
    const [from, to] = range(page)
    return { rows: rows.slice(from, to + 1), count: rows.length }
  }
  const sb = await createClient()
  let query = sb.from('admin_product_inventory').select('id,name,sku,slug,type_id,category_id,price,min_price,max_price,stock_total,min_stock,variant_count,status,online,thumbnail,allow_preorder,preorder_slots', { count: 'exact' })
  if (f.type) {
    const { data: t } = await sb.from('product_types').select('id').eq('code', f.type).maybeSingle()
    query = query.eq('type_id', t?.id ?? '00000000-0000-0000-0000-000000000000')
  }
  query = status ? query.eq('status', status) : query.neq('status', 'archived')
  if (f.low) query = query.eq('is_low_stock', true)
  if (f.preorder) query = query.eq('allow_preorder', true)
  for (const term of q.split(/\s+/).filter(Boolean)) query = query.ilike('search_text', `%${term}%`)
  const [from, to] = range(page)
  const [sortColumn, ascending] = PRODUCT_SORTS[productSort(f.sort)]
  const { data, count, error } = await query.order(sortColumn, { ascending }).order('id', { ascending: false }).range(from, to)
  if (error) throw new Error(error.message)
  return { rows: (data ?? []) as AdminProductRow[], count: count ?? 0 }
}

export async function getAdminProduct(id: string): Promise<ProductDetail | null> {
  if (isDemo) {
    const p = demo.products.find((x) => x.id === id)
    if (!p) return null
    return {
      ...p,
      variants: demo.variants.filter((v) => v.product_id === id),
      images: demo.images.filter((i) => i.product_id === id),
      options: demo.options.filter((o) => o.product_id === id),
      collection_ids: demo.product_collections.filter((x) => x.product_id === id).map((x) => x.collection_id)
    }
  }
  const sb = await createClient()
  const { data } = await sb.from('products').select('*, variants(*), product_images(*), product_options(*), product_collections(collection_id)').eq('id', id).maybeSingle()
  return data ? toDetail(data as Record<string, unknown>) : null
}

export const countProductsByType = cache(async (): Promise<Record<string, number>> => {
  if (isDemo) {
    const out: Record<string, number> = {}
    for (const p of demo.products) if (p.status !== 'archived') out[p.type_id] = (out[p.type_id] ?? 0) + 1
    return out
  }
  const sb = await createClient()
  const { data, error } = await sb.rpc('admin_catalog_counts_v1', { p_dimension: 'type_id' })
  if (error) throw new Error('Cần áp dụng migration Admin V1 để tổng hợp sản phẩm.')
  return data as Record<string, number>
})
export const countProductsByCategory = cache(async (): Promise<Record<string, number>> => {
  if (isDemo) {
    const out: Record<string, number> = {}
    for (const p of demo.products) if (p.category_id && p.status !== 'archived') out[p.category_id] = (out[p.category_id] ?? 0) + 1
    return out
  }
  const sb = await createClient()
  const { data, error } = await sb.rpc('admin_catalog_counts_v1', { p_dimension: 'category_id' })
  if (error) throw new Error('Cần áp dụng migration Admin V1 để tổng hợp danh mục.')
  return data as Record<string, number>
})

// ---------------------------------------------------------------- Thu mua, khách, nhân viên, cài đặt
export async function listTradeins(status?: TradeinStatus, page = 1): Promise<{ rows: TradeinRequest[]; count: number }> {
  page = adminPage(page)
  if (isDemo) {
    const rows = status ? DEMO_TRADEINS.filter((t) => t.status === status) : DEMO_TRADEINS
    const [from,to] = range(page)
    return { rows: rows.slice(from,to+1), count: rows.length }
  }
  const sb = await createClient()
  let q = sb.from('tradein_requests').select('*', { count: 'exact' })
  if (status) q = q.eq('status', status)
  const [from, to] = range(page)
  const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to)
  if (error) throw new Error(error.message)
  const itemsSchema=z.array(z.object({name:z.string(),condition:z.string().optional(),qty:z.number().optional(),expected:z.number().optional(),note:z.string().optional()}))
  const rows=(data ?? []).map<TradeinRequest>((r)=>({...r,method:r.method==='ship'?'ship':'store',payout:r.payout==='credit'?'credit':'cash',items:itemsSchema.parse(r.items)}))
  return { rows, count:count ?? 0 }
}

export async function listCustomers(q?: string, page = 1): Promise<{ rows: CustomerSummary[]; count: number }> {
  page = adminPage(page)
  const s = clean(q)
  if (isDemo) {
    const rows = s ? DEMO_CUSTOMERS.filter((c) => `${c.phone} ${unaccent(c.customer_name.toLowerCase())}`.includes(unaccent(s.toLowerCase()))) : DEMO_CUSTOMERS
    const [from,to] = range(page)
    return { rows: rows.slice(from,to+1), count: rows.length }
  }
  const sb = await createClient()
  let query = sb.from('customer_summary').select('*', { count: 'exact' })
  if (s) query = query.or(`phone.ilike.%${s}%,customer_name.ilike.%${s}%,email.ilike.%${s}%`)
  const [from, to] = range(page)
  const { data, count, error } = await query.order('last_order_at', { ascending: false }).range(from, to)
  if (error) throw new Error(error.message)
  return { rows: (data ?? []) as CustomerSummary[], count: count ?? 0 }
}

export async function listStaff(): Promise<Staff[]> {
  if (isDemo) return DEMO_STAFF
  const sb = await createClient()
  const { data } = await sb.from('staff').select('*').order('created_at')
  return (data ?? []) as Staff[]
}

export async function getAllSettings(): Promise<Partial<ShopSettings>> {
  if (isDemo) return {}
  const sb = await createClient()
  const { data } = await sb.from('settings').select('key,value')
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Partial<ShopSettings>
}

/** Danh mục, loại… cho trang quản trị: đọc bằng phiên nhân viên (thấy cả mục đang ẩn), không cache. */
export const getAdminMeta = cache(async (): Promise<CatalogMeta> => {
  if (isDemo) return getCatalogMeta()
  const sb = await createClient()
  const [types, attributes, categories, brands, collections] = await Promise.all([
    sb.from('product_types').select('*').order('sort'),
    sb.from('attribute_defs').select('*').order('sort'),
    sb.from('categories').select('id,parent_id,name,slug,depth,sort,visible').order('sort'),
    sb.from('brands').select('id,name,slug').order('name'),
    sb.from('collections').select('*').order('sort')
  ])
  return {
    types: (types.data ?? []) as CatalogMeta['types'],
    attributes: (attributes.data ?? []) as CatalogMeta['attributes'],
    categories: (categories.data ?? []) as CatalogMeta['categories'],
    brands: (brands.data ?? []) as CatalogMeta['brands'],
    collections: (collections.data ?? []) as CatalogMeta['collections']
  }
})
