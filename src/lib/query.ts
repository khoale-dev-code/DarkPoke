import type { ProductQuery, SortKey } from '@/lib/catalog'

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

/** Đọc bộ lọc từ URL. Thuộc tính lọc dùng tiền tố a_ (ví dụ a_condition=NM). */
export function parseProductQuery(sp: SP | URLSearchParams): ProductQuery {
  const get = (k: string) => (sp instanceof URLSearchParams ? (sp.get(k) ?? '') : one(sp[k]))
  const keys = sp instanceof URLSearchParams ? [...sp.keys()] : Object.keys(sp)
  const attrs: Record<string, string> = {}
  for (const k of keys) {
    if (k.startsWith('a_') && /^a_[a-z0-9_]{1,40}$/.test(k)) {
      const v = get(k).slice(0, 80)
      if (v) attrs[k.slice(2)] = v
    }
  }
  const sort = get('sort')
  return {
    q: get('q').slice(0, 80) || undefined,
    type: get('type') || undefined,
    category: get('category') || undefined,
    brand: get('brand') || undefined,
    collection: get('collection') || undefined,
    sort: (['new', 'price_asc', 'price_desc'].includes(sort) ? sort : 'new') as SortKey,
    inStock: get('instock') === '1',
    preorder: get('preorder') === '1',
    attrs
  }
}

/** Chuỗi query ổn định (dùng làm khóa cache cho lưới cuộn vô hạn). */
export function queryString(q: ProductQuery) {
  const p = new URLSearchParams()
  if (q.q) p.set('q', q.q)
  if (q.type) p.set('type', q.type)
  if (q.category) p.set('category', q.category)
  if (q.brand) p.set('brand', q.brand)
  if (q.collection) p.set('collection', q.collection)
  if (q.sort && q.sort !== 'new') p.set('sort', q.sort)
  if (q.inStock) p.set('instock', '1')
  if (q.preorder) p.set('preorder', '1')
  for (const [k, v] of Object.entries(q.attrs ?? {}).sort()) p.set(`a_${k}`, v)
  return p.toString()
}
