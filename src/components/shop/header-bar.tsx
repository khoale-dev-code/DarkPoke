'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Search, ShoppingBag, User } from 'lucide-react'
import { ShopBrand } from '@/components/shop/brand'
import { ShopMenu } from '@/components/shop/menu'
import { cartCount, useCart } from '@/lib/cart'
import { HeaderLinks, HeaderLinksFallback } from './header-links'
import type { HeaderLink } from './header-navigation'

/** Routes whose first section is a full-bleed hero drawn beneath the bar. */
const OVERLAY_ROUTES = new Set(['/'])
const SOLID_AFTER_PX = 8

// The palette ships in its own chunk; it is fetched on hover/focus of the search button or on first open.
const loadPalette = () => import('./search-palette')
const SearchPalette = dynamic(() => loadPalette().then((module) => module.SearchPalette), { ssr: false })

const isEditable = (target: EventTarget | null) => target instanceof HTMLElement
  && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

interface Props { links: HeaderLink[]; categories: { id: string; name: string; slug: string }[]; demo: boolean }

function useScrolledPast(enabled: boolean) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    if (!enabled) return
    let frame = 0
    const update = () => { frame = 0; setScrolled(window.scrollY > SOLID_AFTER_PX) }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    frame = requestAnimationFrame(update)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) }
  }, [enabled])
  return scrolled
}

function CartLink() {
  const count = cartCount(useCart())
  return <Link href="/gio-hang" className="dph-icon dph-cart" aria-label={count ? `Giỏ hàng, ${count} sản phẩm` : 'Giỏ hàng'}>
    <ShoppingBag size={20} strokeWidth={1.7} aria-hidden="true" />
    {count ? <span className="dph-badge" aria-hidden="true">{count > 99 ? '99+' : count}</span> : null}
  </Link>
}

export function HeaderBar({ links, categories, demo }: Props) {
  const pathname = usePathname()
  const overlayRoute = OVERLAY_ROUTES.has(pathname)
  const scrolled = useScrolledPast(overlayRoute)
  const [searchOpen, setSearchOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const tone = overlayRoute && !scrolled ? 'overlay' : 'solid'

  const closeSearch = useCallback((restoreFocus: boolean) => {
    setSearchOpen(false)
    if (restoreFocus) requestAnimationFrame(() => toggle.current?.focus())
  }, [])

  // Ctrl/⌘ + K anywhere, or "/" outside a text field, opens the palette.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const combo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      const slash = event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isEditable(event.target)
      if (!combo && !slash) return
      event.preventDefault()
      setSearchOpen(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return <header className="shop-header dph-header" data-tone={tone}>
    <div className="dph-inner">
      <div className="dph-menu"><ShopMenu links={links} categories={categories} /></div>
      <div className="dph-brand"><ShopBrand />{demo ? <span className="dph-demo" title="Đang hiển thị dữ liệu mẫu">Demo</span> : null}</div>
      <Suspense fallback={<HeaderLinksFallback links={links} />}><HeaderLinks links={links} /></Suspense>
      <div className="dph-actions">
        <button ref={toggle} type="button" className="dph-icon" aria-label="Tìm kiếm sản phẩm" aria-haspopup="dialog" aria-expanded={searchOpen} aria-keyshortcuts="Control+K Meta+K /"
          onPointerEnter={() => void loadPalette()} onFocus={() => void loadPalette()} onClick={() => setSearchOpen(true)}>
          <Search size={20} strokeWidth={1.7} aria-hidden="true" />
        </button>
        <Link href="/tai-khoan" className="dph-icon dph-account" aria-label="Tài khoản và đơn hàng"><User size={20} strokeWidth={1.7} aria-hidden="true" /></Link>
        <CartLink />
      </div>
    </div>

    {searchOpen ? <SearchPalette links={links} onClose={closeSearch} /> : null}
  </header>
}
