'use client'

import Link from 'next/link'
import { useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, ChevronDown, Hash, Languages, Layers, Loader2, Search, SlidersHorizontal, ArrowDownWideNarrow, Type, X } from 'lucide-react'
import { LANGUAGES, libraryHref, type LibraryQuery, type LibrarySet } from '../domain'
import '../library-hero.css'

const QUICK = ['Pikachu', 'Charizard', 'Eevee', 'Mewtwo', 'Umbreon', 'Gengar'] as const

interface Props { query: LibraryQuery; sets: LibrarySet[]; setsAvailable: boolean; intro: ReactNode; aside?: ReactNode }

/** Hero search (name or card code) with quick picks, then a compact toolbar for language, set and sort. */
export function LibraryFilters({ query, sets, setsAvailable, intro, aside }: Props) {
  const router = useRouter()
  const [q, setQ] = useState(query.q)
  const [by, setBy] = useState(query.by)
  const [expanded, setExpanded] = useState(false)
  const [pending, start] = useTransition()
  const go = (patch: Partial<LibraryQuery>) => start(() => router.push(libraryHref({ ...query, q: q.trim(), by, page: 1, ...patch }), { scroll: false }))
  const hasFilters = !!query.q || !!query.set || query.sort !== 'id_desc' || query.by !== 'name'
  const language = LANGUAGES.find((item) => item.code === query.lang)?.label
  const setName = query.set ? sets.find((set) => set.id === query.set)?.name ?? query.set : null
  const active = [language && query.lang !== 'en' ? language : null, setName].filter(Boolean)

  return <>
    <section className="dxl-hero" aria-labelledby="dxl-title" aria-busy={pending}>
      <div className="dxl-hero-glow" aria-hidden="true"><i /><i /><i /></div>
      <div className="dxl-fan" aria-hidden="true"><i><b /></i><i><b /></i><i><b /></i></div>
      <div className="dxl-hero-inner">
        {intro}
        <form role="search" aria-label="Tra cứu thư viện thẻ" className="dxl-search-form" onSubmit={(event) => { event.preventDefault(); go({}) }}>
          <div className="dxl-mode" role="radiogroup" aria-label="Cách tìm thẻ" data-by={by}>
            <button type="button" role="radio" aria-checked={by === 'name'} disabled={pending} onClick={() => setBy('name')}><Type size={14} aria-hidden="true" />Theo tên</button>
            <button type="button" role="radio" aria-checked={by === 'id'} disabled={pending} onClick={() => setBy('id')}><Hash size={14} aria-hidden="true" />Theo mã thẻ</button>
          </div>
          <div className="dxl-search">
            <Search size={20} aria-hidden="true" />
            <label htmlFor="dex-search" className="sr-only">{by === 'id' ? 'Mã thẻ' : 'Tên thẻ'}</label>
            <input id="dex-search" type="search" value={q} maxLength={80} onChange={(event) => setQ(event.target.value)} enterKeyHint="search" autoComplete="off"
              placeholder={by === 'id' ? 'Nhập mã đầy đủ, ví dụ swsh3-136' : 'Tìm Pikachu, Charizard…'} aria-describedby="dex-search-hint" disabled={pending} />
            {q ? <button type="button" className="dxl-clear" aria-label="Xóa từ khóa" onClick={() => setQ('')}><X size={16} aria-hidden="true" /></button> : null}
            <button type="submit" className="dxl-submit" disabled={pending}>{pending ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <Search size={17} aria-hidden="true" />}<span>Tra cứu</span></button>
          </div>
          <p id="dex-search-hint" className="sr-only">{by === 'id' ? 'Nhập mã gồm bộ thẻ và số thẻ, ví dụ swsh3-136.' : 'Tìm theo tên thẻ trong ngôn ngữ đã chọn.'}</p>
        </form>
        <div className="dxl-quick" aria-label="Tìm nhanh">
          <span>Phổ biến</span>
          {QUICK.map((name) => <Link key={name} prefetch={false} href={libraryHref({ ...query, q: name, by: 'name', page: 1 })} aria-current={query.q === name ? 'true' : undefined}>{name}</Link>)}
        </div>
        {aside}
      </div>
    </section>

    <div className="dxl-toolbar" aria-busy={pending}>
      <button type="button" className="dxl-filter-toggle" aria-expanded={expanded} aria-controls="dex-filter-fields" onClick={() => setExpanded((value) => !value)}>
        <SlidersHorizontal size={16} aria-hidden="true" />Bộ lọc{active.length ? <b>{active.length}</b> : null}<ChevronDown size={15} aria-hidden="true" />
      </button>
      <div className="dxl-fields" id="dex-filter-fields" data-expanded={expanded}>
        <label className="dxl-field"><Languages size={16} aria-hidden="true" /><span className="sr-only">Ngôn ngữ thẻ</span>
          <select value={query.lang} disabled={pending} onChange={(event) => go({ lang: event.target.value as LibraryQuery['lang'], set: '' })} aria-label="Ngôn ngữ thẻ">
            {LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
          </select><ChevronDown size={15} className="dxl-caret" aria-hidden="true" /></label>
        <label className="dxl-field dxl-field-wide"><Layers size={16} aria-hidden="true" /><span className="sr-only">Bộ thẻ</span>
          <select value={query.set} disabled={pending || !setsAvailable} onChange={(event) => go({ set: event.target.value })} aria-label="Bộ thẻ">
            <option value="">{setsAvailable ? 'Tất cả bộ thẻ' : 'Chưa tải được danh sách bộ thẻ'}</option>
            {query.set && !sets.some((set) => set.id === query.set) ? <option value={query.set}>{query.set}</option> : null}
            {sets.map((set) => <option key={set.id} value={set.id}>{set.name} · {set.id}</option>)}
          </select><ChevronDown size={15} className="dxl-caret" aria-hidden="true" /></label>
        <label className="dxl-field"><ArrowDownWideNarrow size={16} aria-hidden="true" /><span className="sr-only">Sắp xếp</span>
          <select value={query.sort} disabled={pending || (by === 'id' && !!q)} onChange={(event) => go({ sort: event.target.value as LibraryQuery['sort'] })} aria-label="Sắp xếp">
            <option value="id_desc">Mới nhất</option><option value="name_asc">Tên A–Z</option><option value="number_asc">Số thẻ tăng dần</option>
          </select><ChevronDown size={15} className="dxl-caret" aria-hidden="true" /></label>
      </div>
      <p className="dxl-status" role="status">{pending ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" />Đang tìm…</> : null}</p>
      {hasFilters ? <button type="button" className="dxl-reset" disabled={pending} onClick={() => { setQ(''); setBy('name'); go({ q: '', by: 'name', set: '', sort: 'id_desc' }) }}><X size={14} aria-hidden="true" />Xóa bộ lọc</button> : null}
      <Link href="/san-pham" className="dxl-shop">Mua thẻ tại shop<ArrowUpRight size={15} aria-hidden="true" /></Link>
    </div>
  </>
}
