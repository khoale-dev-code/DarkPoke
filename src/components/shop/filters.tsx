'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { ChevronDown, Loader2, Search, SlidersHorizontal, X } from 'lucide-react'
import { ShopDialog } from '@/components/shop/dialog'
import { queryString } from '@/lib/query'
import type { AttributeDef, ProductType } from '@/lib/types'
import type { ProductQuery } from '@/lib/catalog'

interface Props { basePath: string; query: ProductQuery; types: ProductType[]; attributes: AttributeDef[]; showTypes?: boolean; autoFocus?: boolean; preorderLink?: boolean }

/** V14.21 catalog filters (design option A): one toolbar (search, filters, sort), underlined type tabs, then the active filters. */
export function Filters({ basePath, query, types, attributes, showTypes = true, autoFocus, preorderLink }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [q, setQ] = useState(query.q ?? '')
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ProductQuery>(query)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { if (autoFocus) input.current?.focus() }, [autoFocus])

  function go(next: Partial<ProductQuery>) {
    const merged = { ...query, ...next }
    if (Object.hasOwn(next, 'type') && next.type !== query.type && !Object.hasOwn(next, 'attrs')) merged.attrs = {}
    merged.attrs = Object.fromEntries(Object.entries(merged.attrs ?? {}).filter(([, v]) => !!v))
    const qs = queryString(merged)
    start(() => router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false }))
  }

  const selectedType = types.find((t) => t.code === draft.type)
  const defs = selectedType ? attributes.filter((a) => a.type_id === selectedType.id && a.filterable && a.options.length) : []
  const attrs = Object.entries(query.attrs ?? {}).filter(([, v]) => !!v)
  const n = attrs.length + (query.inStock ? 1 : 0) + (query.type ? 1 : 0)
  const clear = () => { setQ(''); go({ q: undefined, type: undefined, brand: undefined, collection: undefined, attrs: {}, inStock: false }) }
  const activeType = types.find((t) => t.code === query.type)

  return <div className="shop-filters ctf" aria-busy={pending}>
    <div className="ctf-bar">
      <form role="search" className="ctf-search" onSubmit={(e) => { e.preventDefault(); go({ q: q.trim() || undefined }) }}>
        <Search size={20} aria-hidden="true" />
        <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Tìm tên thẻ, bộ thẻ, SKU…" aria-label="Tìm trong danh sách sản phẩm" enterKeyHint="search" />
        {q ? <button type="button" className="ctf-clear" aria-label="Xóa từ khóa" onClick={() => { setQ(''); go({ q: undefined }) }}><X size={17} aria-hidden="true" /></button> : null}
        <button type="submit" className="ctf-submit" disabled={pending}>{pending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : 'Tìm'}</button>
      </form>
      <button type="button" className="ctf-btn" disabled={pending} onClick={() => { setDraft(query); setOpen(true) }}>
        <SlidersHorizontal size={18} aria-hidden="true" />Bộ lọc{n ? <span className="ctf-badge">{n}</span> : null}
      </button>
      <label className="ctf-sort">
        <span>Sắp xếp:</span>
        <select value={query.sort ?? 'new'} disabled={pending} onChange={(e) => go({ sort: e.target.value as ProductQuery['sort'] })} aria-label="Sắp xếp sản phẩm">
          <option value="new">Mới nhất</option><option value="price_asc">Giá thấp đến cao</option><option value="price_desc">Giá cao đến thấp</option>
        </select>
        <ChevronDown size={18} aria-hidden="true" />
      </label>
    </div>

    {showTypes ? <div className="ctf-tabs" role="group" aria-label="Loại sản phẩm">
      <button type="button" aria-pressed={!query.type} disabled={pending} onClick={() => go({ type: undefined })}>Tất cả</button>
      {types.map((t) => <button key={t.id} type="button" aria-pressed={query.type === t.code} disabled={pending} onClick={() => go({ type: t.code })}>{t.name}</button>)}
      {preorderLink ? <Link prefetch={false} href="/pre-order" className="ctf-tab-link">Pre-order<span>Mới</span></Link> : null}
    </div> : null}

    {n || query.q ? <div className="ctf-active" aria-label="Bộ lọc đang dùng">
      <span className="ctf-active-label">Đang lọc:</span>
      {query.q ? <button type="button" onClick={() => { setQ(''); go({ q: undefined }) }}>“{query.q}”<X size={14} aria-hidden="true" /><span className="sr-only">Xóa từ khóa</span></button> : null}
      {activeType ? <button type="button" onClick={() => go({ type: undefined })}>{activeType.name}<X size={14} aria-hidden="true" /><span className="sr-only">Bỏ loại sản phẩm</span></button> : null}
      {query.inStock ? <button type="button" onClick={() => go({ inStock: false })}>Còn hàng<X size={14} aria-hidden="true" /><span className="sr-only">Bỏ lọc còn hàng</span></button> : null}
      {attrs.map(([key, value]) => <button key={key} type="button" onClick={() => go({ attrs: { ...query.attrs, [key]: '' } })}>{attributes.find((a) => a.code === key)?.name ?? key}: {value}<X size={14} aria-hidden="true" /></button>)}
      <button type="button" className="ctf-reset" onClick={clear}>Xóa tất cả</button>
    </div> : null}

    <ShopDialog open={open} onClose={() => setOpen(false)} title="Tìm đúng món bạn cần" description="Chọn bộ lọc rồi áp dụng để xem những sản phẩm phù hợp." drawer
      actions={<><button type="button" className="btn btn-secondary" onClick={() => setDraft({ ...draft, type: undefined, attrs: {}, inStock: false })}>Đặt lại</button><button type="button" className="btn btn-primary" onClick={() => { go(draft); setOpen(false) }}>Áp dụng bộ lọc</button></>}>
      <div className="shop-filter-fields">
        {showTypes ? <label><span>Loại sản phẩm</span><select className="input" value={draft.type ?? ''} onChange={(e) => setDraft((s) => ({ ...s, type: e.target.value || undefined, attrs: {} }))}><option value="">Tất cả sản phẩm</option>{types.map((t) => <option key={t.id} value={t.code}>{t.name}</option>)}</select></label> : null}
        <label className="shop-choice !flex-row !items-center"><input type="checkbox" checked={!!draft.inStock} onChange={(e) => setDraft((s) => ({ ...s, inStock: e.target.checked }))} /><span>Chỉ hiện sản phẩm còn hàng</span></label>
        {defs.map((a) => <label key={a.id}><span>{a.name}</span><select className="input" value={draft.attrs?.[a.code] ?? ''} onChange={(e) => setDraft((s) => ({ ...s, attrs: { ...s.attrs, [a.code]: e.target.value } }))}><option value="">Tất cả</option>{a.options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>)}
        {!defs.length ? <p className="text-xs leading-relaxed text-muted">{draft.type ? 'Loại sản phẩm này chưa có thuộc tính cần lọc thêm.' : 'Chọn loại sản phẩm để xem các bộ lọc như bộ thẻ, tình trạng hoặc độ hiếm.'}</p> : null}
      </div>
    </ShopDialog>
  </div>
}
