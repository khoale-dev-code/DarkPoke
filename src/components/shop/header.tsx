import { HeaderBar } from '@/components/shop/header-bar'
import type { HeaderLink } from '@/components/shop/header-navigation'
import { isDemo } from '@/lib/env'
import type { Category, ShopSettings } from '@/lib/types'
import './header-v14.css'

/** Server entry: builds links from settings, the compact bar is a small client island. */
export function SiteHeader({ categories, modules }: { categories: Category[]; modules: ShopSettings['modules'] }) {
  const shopLinks: HeaderLink[] = [
    { href: '/san-pham', label: 'Sản phẩm' },
    { href: '/san-pham?type=sealed', label: 'Sealed' },
    { href: '/san-pham?type=the-le', label: 'Thẻ lẻ' },
    { href: '/san-pham?type=the-grading', label: 'Grading' },
    { href: '/san-pham?type=phu-kien', label: 'Phụ kiện' },
    ...(modules.preorder ? [{ href: '/pre-order', label: 'Pre-order' }] : []),
    ...(modules.tradein ? [{ href: '/thu-mua', label: 'Thu mua' }] : [])
  ]
  const navLinks = [...shopLinks, { href: '/thu-vien-the', label: 'Thư viện thẻ' }]
  const roots = categories.filter((c) => !c.parent_id && c.visible).map((c) => ({ id: c.id, name: c.name, slug: c.slug }))
  return <HeaderBar links={navLinks} categories={roots} demo={isDemo} />
}
