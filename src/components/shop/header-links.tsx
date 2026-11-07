'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { currentHeaderHref, type HeaderLink } from './header-navigation'

function NavList({ links, current }: { links: HeaderLink[]; current?: string | null }) {
  return <nav className="dph-nav" aria-label="Danh mục cửa hàng">
    <ul>{links.map((link) => <li key={link.href}>
      <Link href={link.href} aria-current={current === link.href ? 'page' : undefined}>{link.label}</Link>
    </li>)}</ul>
  </nav>
}

/** Static markup for prerendered pages while search params are not available yet. */
export function HeaderLinksFallback({ links }: { links: HeaderLink[] }) { return <NavList links={links} /> }

export function HeaderLinks({ links }: { links: HeaderLink[] }) {
  const pathname = usePathname()
  const params = useSearchParams()
  return <NavList links={links} current={currentHeaderHref(pathname, params, links)} />
}
