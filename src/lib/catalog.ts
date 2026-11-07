import 'server-only'
import { unstable_cache } from 'next/cache'
import { isDemo } from '@/lib/env'
import { publicClient } from '@/lib/supabase/public'
import { DEFAULT_SETTINGS, demo } from '@/lib/demo'
import { unaccent } from '@/lib/utils'
import type {
  AttributeDef, Brand, Category, Collection, Product, ProductCard, ProductDetail, ProductType, ShopSettings
} from '@/lib/types'

export const CATALOG_TAG = 'catalog'
export const SETTINGS_TAG = 'settings'
export const PAGE_SIZE = 12

const CARD_COLUMNS =
  'id,type_id,name,slug,price,compare_at_price,thumbnail,stock_total,min_price,max_price,variant_count,allow_preorder,preorder_release_date,attrs,created_at'

export interface CatalogMeta {
  types: ProductType[]
  attributes: AttributeDef[]
  categories: Category[]
  brands: Brand[]
  collections: Collection[]
}

export type SortKey = 'new' | 'price_asc' | 'price_desc'

export interface ProductQuery {
  category?: string
  type?: string
  brand?: string
  collection?: string
  q?: string
  attrs?: Record<string, string>
  inStock?: boolean
  preorder?: boolean
  featured?: boolean
  sort?: SortKey
  cursor?: string | null
  limit?: number
}

export interface ProductPage {
  items: ProductCard[]
  nextCursor: string | null
}

// ---------------------------------------------------------------------------
// Danh mục, loại, thương hiệu… (ít thay đổi: cache 10 phút, xóa cache khi admin sửa)
// ---------------------------------------------------------------------------
export const getCatalogMeta = unstable_cache(
  async (): Promise<CatalogMeta> => {
    if (isDemo) {
      return { types: demo.types, attributes: demo.attributes, categories: demo.categories, brands: demo.brands, collections: demo.collections }
    }
    const sb = publicClient()
    const [types, attributes, categories, brands, collections] = await Promise.all([
      sb.from('product_types').select('*').order('sort'),
      sb.from('attribute_defs').select('*').order('sort'),
      sb.from('categories').select('id,parent_id,name,slug,depth,sort,visible').order('sort'),
      sb.from('brands').select('id,name,slug').order('name'),
      sb.from('collections').select('*').order('sort')
    ])
    const err = types.error ?? attributes.error ?? categories.error ?? brands.error ?? collections.error
    if (err) throw new Error(err.message)
    return {
      types: types.data as ProductType[],
      attributes: attributes.data as AttributeDef[],
      categories: categories.data as Category[],
      brands: brands.data as Brand[],
      collections: collections.data as Collection[]
    }
  },
  ['catalog-meta'],
  { tags: [CATALOG_TAG], revalidate: 600 }
)

export const getSettings = unstable_cache(
  async (): Promise<ShopSettings> => {
    if (isDemo) return DEFAULT_SETTINGS
    const { data, error } = await publicClient().from('settings').select('key,value').eq('is_public', true)
    if (error) throw new Error(error.message)
    const merged = structuredClone(DEFAULT_SETTINGS) as unknown as Record<string, Record<string, unknown>>
    for (const row of data ?? []) {
      const key = row.key as string
      merged[key] = { ...(merged[key] ?? {}), ...(row.value as Record<string, unknown>) }
    }
    return merged as unknown as ShopSettings
  },
  ['settings'],
  { tags: [SETTINGS_TAG], revalidate: 600 }
)

/** Id của danh mục và toàn bộ danh mục con (cây tối đa 3 cấp). */
export function descendantIds(categories: Category[], rootId: string) {
  const out = new Set([rootId])
  let added = true
  while (added) {
    added = false
    for (const c of categories) {
      if (c.parent_id && out.has(c.parent_id) && !out.has(c.id)) {
        out.add(c.id)
        added = true
      }
    }
  }
  return [...out]
}

function encodeCursor(v: string | number, id: string) {
  return Buffer.from(JSON.stringify([v, id])).toString('base64url')
}
function decodeCursor(c: string): [string | number, string] | null {
  try {
    const v = JSON.parse(Buffer.from(c, 'base64url').toString()) as unknown
    if (Array.isArray(v) && v.length === 2 && typeof v[1] === 'string') return [v[0] as string | number, v[1]]
  } catch {}
  return null
}

function searchTerms(q?: string) {
  return unaccent((q ?? '').toLowerCase())
    .replace(/[%_,()"\\]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .slice(0, 5)
}

// ---------------------------------------------------------------------------
// Danh sách sản phẩm: phân trang theo con trỏ (keyset), dùng index products_listing_idx / products_price_idx
// ---------------------------------------------------------------------------
async function queryProducts(query: ProductQuery): Promise<ProductPage> {
  const limit = Math.min(Math.max(query.limit ?? PAGE_SIZE, 1), 48)
  const sort: SortKey = query.sort ?? 'new'
  const meta = await getCatalogMeta()
  const cursor = query.cursor ? decodeCursor(query.cursor) : null

  const category = query.category ? meta.categories.find((c) => c.slug === query.category) : undefined
  const type = query.type ? meta.types.find((t) => t.code === query.type) : undefined
  const brand = query.brand ? meta.brands.find((b) => b.slug === query.brand) : undefined
  const collection = query.collection ? meta.collections.find((c) => c.slug === query.collection) : undefined
  if ((query.category && !category) || (query.type && !type) || (query.brand && !brand) || (query.collection && !collection)) {
    return { items: [], nextCursor: null }
  }
  const catIds = category ? descendantIds(meta.categories, category.id) : null
  const terms = searchTerms(query.q)
  const attrs = Object.fromEntries(Object.entries(query.attrs ?? {}).filter(([, v]) => v !== ''))

  if (isDemo) {
    const colIds = collection ? new Set(demo.product_collections.filter((x) => x.collection_id === collection.id).map((x) => x.product_id)) : null
    let rows = demo.products.filter((p) => p.status === 'active' && p.online)
    if (catIds) rows = rows.filter((p) => p.category_id && catIds.includes(p.category_id))
    if (type) rows = rows.filter((p) => p.type_id === type.id)
    if (brand) rows = rows.filter((p) => p.brand_id === brand.id)
    if (colIds) rows = rows.filter((p) => colIds.has(p.id))
    if (query.inStock) rows = rows.filter((p) => p.stock_total > 0)
    if (query.preorder) rows = rows.filter((p) => p.allow_preorder)
    if (query.featured) rows = rows.filter((p) => p.is_featured)
    if (terms.length) rows = rows.filter((p) => terms.every((t) => unaccent(`${p.name} ${p.sku}`.toLowerCase()).includes(t)))
    for (const [k, v] of Object.entries(attrs)) rows = rows.filter((p) => String(p.attrs[k] ?? '') === v)
    const priceOf = (p: Product) => p.min_price ?? p.price
    rows.sort((a, b) => {
      if (sort === 'new') return b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id)
      const d = sort === 'price_asc' ? priceOf(a) - priceOf(b) : priceOf(b) - priceOf(a)
      return d || (sort === 'price_asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id))
    })
    if (cursor) {
      const i = rows.findIndex((p) => p.id === cursor[1])
      rows = i >= 0 ? rows.slice(i + 1) : []
    }
    const page = rows.slice(0, limit)
    const last = page[page.length - 1]
    return {
      items: page,
      nextCursor: rows.length > limit && last ? encodeCursor(sort === 'new' ? last.created_at : priceOf(last), last.id) : null
    }
  }

  const sb = publicClient()
  let q = sb.from('products').select(CARD_COLUMNS).eq('status', 'active').eq('online', true)
  if (catIds) q = q.in('category_id', catIds)
  if (type) q = q.eq('type_id', type.id)
  if (brand) q = q.eq('brand_id', brand.id)
  if (collection) {
    const { data } = await sb.from('product_collections').select('product_id').eq('collection_id', collection.id).limit(1000)
    q = q.in('id', (data ?? []).map((r) => r.product_id as string))
  }
  if (query.inStock) q = q.gt('stock_total', 0)
  if (query.preorder) q = q.eq('allow_preorder', true)
  if (query.featured) q = q.eq('is_featured', true)
  for (const t of terms) q = q.ilike('search_text', `%${t}%`)
  if (Object.keys(attrs).length) q = q.contains('attrs', attrs)

  if (sort === 'new') {
    if (cursor) q = q.or(`created_at.lt."${cursor[0]}",and(created_at.eq."${cursor[0]}",id.lt.${cursor[1]})`)
    q = q.order('created_at', { ascending: false }).order('id', { ascending: false })
  } else {
    const asc = sort === 'price_asc'
    if (cursor) {
      const op = asc ? 'gt' : 'lt'
      q = q.or(`min_price.${op}.${Number(cursor[0])},and(min_price.eq.${Number(cursor[0])},id.${op}.${cursor[1]})`)
    }
    q = q.order('min_price', { ascending: asc }).order('id', { ascending: asc })
  }

  const { data, error } = await q.limit(limit + 1)
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as unknown as ProductCard[]
  const page = rows.slice(0, limit)
  const last = page[page.length - 1]
  return {
    items: page,
    nextCursor: rows.length > limit && last ? encodeCursor(sort === 'new' ? last.created_at : (last.min_price ?? last.price), last.id) : null
  }
}

export const listProducts = unstable_cache(queryProducts, ['products-list'], { tags: [CATALOG_TAG], revalidate: 120 })

// ---------------------------------------------------------------------------
// Chi tiết sản phẩm
// ---------------------------------------------------------------------------
export const getProductBySlug = unstable_cache(
  async (slug: string): Promise<ProductDetail | null> => {
    if (isDemo) {
      const p = demo.products.find((x) => x.slug === slug && x.status === 'active')
      if (!p) return null
      return {
        ...p,
        variants: demo.variants.filter((v) => v.product_id === p.id).sort((a, b) => a.sort - b.sort),
        images: demo.images.filter((i) => i.product_id === p.id).sort((a, b) => a.sort - b.sort),
        options: demo.options.filter((o) => o.product_id === p.id).sort((a, b) => a.sort - b.sort),
        collection_ids: demo.product_collections.filter((x) => x.product_id === p.id).map((x) => x.collection_id)
      }
    }
    const { data, error } = await publicClient()
      .from('products')
      .select('*, variants(*), product_images(*), product_options(*), product_collections(collection_id)')
      .eq('slug', slug)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return null
    return toDetail(data as Record<string, unknown>)
  },
  ['product-by-slug'],
  { tags: [CATALOG_TAG], revalidate: 300 }
)

export function toDetail(row: Record<string, unknown>): ProductDetail {
  const { variants, product_images, product_options, product_collections, ...rest } = row as Record<string, unknown> & {
    variants?: ProductDetail['variants']
    product_images?: ProductDetail['images']
    product_options?: ProductDetail['options']
    product_collections?: { collection_id: string }[]
  }
  return {
    ...(rest as unknown as Product),
    variants: [...(variants ?? [])].sort((a, b) => a.sort - b.sort),
    images: [...(product_images ?? [])].sort((a, b) => a.sort - b.sort),
    options: [...(product_options ?? [])].sort((a, b) => a.sort - b.sort),
    collection_ids: (product_collections ?? []).map((c) => c.collection_id)
  }
}

export async function getFeaturedSlugs(limit = 24) {
  if (isDemo) return demo.products.map((p) => p.slug)
  const { data } = await publicClient()
    .from('products')
    .select('slug')
    .eq('status', 'active')
    .eq('online', true)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map((r) => r.slug as string)
}
