'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import {
  ArrowUpDown, BadgeCheck, BookOpen, CornerDownLeft, LayoutGrid, Loader2, Package, Repeat2, Search, Shield,
  ShoppingBag, Sparkles, Timer, User, WalletCards, X, type LucideIcon
} from 'lucide-react'
import { ProductImage } from '@/components/shop/product-image'
import { priceRange } from '@/lib/utils'
import type { HeaderLink } from './header-navigation'
import './search-palette.css'

const QUICK_SEARCHES = ['Pikachu', 'Charizard', 'Elite Trainer Box', 'Booster Box', 'PSA 10'] as const
const PRODUCT_LIMIT = 6
const DEBOUNCE_MS = 180

interface ProductHit { id: string; name: string; slug: string; price: number; min_price: number | null; max_price: number | null; thumbnail: string | null }
interface Item { id: string; group: string; label: string; href: string; icon?: LucideIcon; hint?: string; product?: ProductHit }
type Status = 'idle' | 'loading' | 'done' | 'error'

function iconFor(href: string): LucideIcon {
  if (href.includes('type=sealed')) return Package
  if (href.includes('type=the-le')) return WalletCards
  if (href.includes('type=the-grading')) return BadgeCheck
  if (href.includes('type=phu-kien')) return Shield
  if (href.startsWith('/pre-order')) return Timer
  if (href.startsWith('/thu-mua')) return Repeat2
  if (href.startsWith('/thu-vien-the')) return BookOpen
  if (href.startsWith('/gio-hang')) return ShoppingBag
  if (href.startsWith('/tai-khoan')) return User
  return LayoutGrid
}

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim()

function isProductHit(value: unknown): value is ProductHit {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string' && typeof item.name === 'string' && typeof item.slug === 'string' && typeof item.price === 'number'
}

/** Live product search against the existing /api/products endpoint (debounced, abortable). */
function useProductSearch(term: string) {
  const [state, setState] = useState<{ term: string; status: Status; items: ProductHit[] }>({ term: '', status: 'idle', items: [] })
  useEffect(() => {
    if (term.length < 2) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setState({ term, status: 'loading', items: [] })
      try {
        const response = await fetch(`/api/products?q=${encodeURIComponent(term)}`, { signal: controller.signal, headers: { Accept: 'application/json' } })
        if (!response.ok) throw new Error('search_failed')
        const body: unknown = await response.json()
        const rows = body && typeof body === 'object' && Array.isArray((body as { items?: unknown }).items) ? (body as { items: unknown[] }).items : []
        setState({ term, status: 'done', items: rows.filter(isProductHit).slice(0, PRODUCT_LIMIT) })
      } catch {
        if (!controller.signal.aborted) setState({ term, status: 'error', items: [] })
      }
    }, DEBOUNCE_MS)
    return () => { controller.abort(); window.clearTimeout(timer) }
  }, [term])
  if (term.length < 2) return { status: 'idle' as Status, items: [] as ProductHit[] }
  return state.term === term ? state : { status: 'loading' as Status, items: [] as ProductHit[] }
}

interface Props { links: HeaderLink[]; onClose: (restoreFocus: boolean) => void }

/** Command palette: navigation, live products and library search in one keyboard-first dialog. */
export function SearchPalette({ links, onClose }: Props) {
  const router = useRouter()
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  // Rendered only after the user opens it, so navigator is always available here.
  const [mac] = useState(() => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent))

  const pageMode = query.startsWith('/')
  const term = (pageMode ? query.slice(1) : query).trim()
  const products = useProductSearch(pageMode ? '' : term)

  const pages = useMemo<Item[]>(() => [
    ...links,
    { href: '/gio-hang', label: 'Giỏ hàng' },
    { href: '/tai-khoan', label: 'Tài khoản & đơn hàng' }
  ].map((link) => ({ id: `page:${link.href}`, group: 'Điều hướng', label: `Đến ${link.label}`, href: link.href, icon: iconFor(link.href) })), [links])

  const items = useMemo<Item[]>(() => {
    const needle = normalize(term)
    const matchedPages = needle ? pages.filter((page) => normalize(page.label).includes(needle)) : pages
    if (pageMode) return matchedPages
    if (!term) return [
      ...pages,
      ...QUICK_SEARCHES.map((word) => ({ id: `quick:${word}`, group: 'Tìm nhanh', label: word, href: `/san-pham?q=${encodeURIComponent(word)}`, icon: Sparkles }))
    ]
    const encoded = encodeURIComponent(term)
    return [
      ...products.items.map((product) => ({ id: `product:${product.id}`, group: 'Sản phẩm', label: product.name, href: `/san-pham/${product.slug}`, product })),
      { id: 'action:products', group: 'Tìm kiếm', label: `Tìm “${term}” trong tất cả sản phẩm`, href: `/san-pham?q=${encoded}`, icon: Search },
      { id: 'action:library', group: 'Tìm kiếm', label: `Tra cứu “${term}” trong thư viện thẻ`, href: `/thu-vien-the?q=${encoded}`, icon: BookOpen, hint: 'Giá TCGplayer' },
      ...matchedPages
    ]
  }, [pages, pageMode, term, products.items])

  const groups = useMemo(() => {
    const map = new Map<string, { item: Item; index: number }[]>()
    items.forEach((item, index) => { const rows = map.get(item.group) ?? []; rows.push({ item, index }); map.set(item.group, rows) })
    return [...map.entries()]
  }, [items])

  const current = Math.min(active, Math.max(items.length - 1, 0))
  const activeId = items[current] ? `${id}-opt-${current}` : undefined

  useEffect(() => {
    const frame = requestAnimationFrame(() => input.current?.focus())
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => { cancelAnimationFrame(frame); root.style.overflow = previous }
  }, [])

  useEffect(() => {
    if (!activeId) return
    document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' })
  }, [activeId])

  const open = (item: Item | undefined, newTab: boolean) => {
    const href = item?.href ?? (term ? `/san-pham?q=${encodeURIComponent(term)}` : null)
    if (!href) return
    if (newTab) { window.open(href, '_blank', 'noopener'); return }
    onClose(false)
    router.push(href)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); onClose(true); return }
    if (event.key === 'Tab') {
      // Two stops only: the field and the close button. Results are reached with the arrow keys.
      event.preventDefault()
      ;(document.activeElement === input.current ? closeButton.current : input.current)?.focus()
      return
    }
    if (event.target !== input.current) return
    const count = items.length
    if (event.key === 'ArrowDown' && count) { event.preventDefault(); setActive((current + 1) % count) }
    else if (event.key === 'ArrowUp' && count) { event.preventDefault(); setActive((current - 1 + count) % count) }
    else if (event.key === 'Home' && event.ctrlKey && count) { event.preventDefault(); setActive(0) }
    else if (event.key === 'End' && event.ctrlKey && count) { event.preventDefault(); setActive(count - 1) }
    else if (event.key === 'Enter') { event.preventDefault(); open(items[current], event.metaKey || event.ctrlKey) }
  }

  const productStatus: ReactNode = !pageMode && term.length >= 2
    ? products.status === 'loading' ? <p className="dps-note" role="status"><Loader2 size={15} className="animate-spin" aria-hidden="true" />Đang tìm sản phẩm…</p>
      : products.status === 'error' ? <p className="dps-note" role="status">Chưa tải được gợi ý sản phẩm. Nhấn Enter để tìm trên trang sản phẩm.</p>
      : products.status === 'done' && !products.items.length ? <p className="dps-note" role="status">Không có sản phẩm khớp “{term}”. Thử tra cứu trong thư viện thẻ.</p>
      : null
    : null

  return <div className="dps-root" onKeyDown={onKeyDown}>
    <div className="dps-scrim" aria-hidden="true" onClick={() => onClose(false)} />
    <div className="dps" role="dialog" aria-modal="true" aria-label="Tìm kiếm tại Dark Poke">
      <div className="dps-field">
        <Search size={20} strokeWidth={1.7} aria-hidden="true" />
        <input ref={input} type="search" value={query} onChange={(event) => { setQuery(event.target.value); setActive(0) }}
          placeholder="Tìm sản phẩm sealed hoặc thẻ lẻ…" aria-label="Tìm kiếm"
          role="combobox" aria-expanded="true" aria-controls={`${id}-list`} aria-activedescendant={activeId} aria-autocomplete="list"
          autoComplete="off" spellCheck={false} enterKeyHint="search" maxLength={80} />
        <button ref={closeButton} type="button" className="dps-close" aria-label="Đóng tìm kiếm" onClick={() => onClose(true)}><X size={18} strokeWidth={1.8} aria-hidden="true" /></button>
      </div>

      <div className="dps-list" id={`${id}-list`} role="listbox" aria-label="Kết quả">
        {productStatus}
        {groups.map(([group, rows]) => <div key={group} role="group" aria-labelledby={`${id}-${group}`}>
          <p className="dps-group" id={`${id}-${group}`} role="presentation">{group}</p>
          {rows.map(({ item, index }) => <Link key={item.id} id={`${id}-opt-${index}`} href={item.href} prefetch={false} role="option" aria-selected={index === current} tabIndex={-1}
            className="dps-item" data-active={index === current || undefined}
            onPointerMove={() => { if (index !== current) setActive(index) }}
            onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return; event.preventDefault(); open(item, false) }}>
            {item.product
              ? <span className="dps-thumb" aria-hidden="true"><ProductImage src={item.product.thumbnail} alt="" sizes="40px" /></span>
              : item.icon ? <item.icon className="dps-icon" size={18} strokeWidth={1.7} aria-hidden="true" /> : null}
            <span className="dps-label">{item.label}</span>
            {item.product ? <span className="dps-meta">{priceRange(item.product)}</span> : item.hint ? <span className="dps-meta">{item.hint}</span> : null}
          </Link>)}
        </div>)}
        {!items.length ? <p className="dps-note" role="status">Không có trang nào khớp “{term}”.</p> : null}
      </div>

      <div className="dps-hints" aria-hidden="true">
        <span><kbd><ArrowUpDown size={12} /></kbd>Di chuyển</span>
        <span><kbd><CornerDownLeft size={12} /></kbd>Mở</span>
        <span><kbd>{mac ? '⌘' : 'Ctrl'}</kbd><kbd><CornerDownLeft size={12} /></kbd>Mở tab mới</span>
        <span><kbd>/</kbd>Tìm trang</span>
        <span className="dps-hint-end"><kbd>Esc</kbd>Đóng</span>
      </div>
    </div>
  </div>
}
