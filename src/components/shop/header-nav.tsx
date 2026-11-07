'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ArrowUpRight, BookOpen, Grid2x2 } from 'lucide-react'
import { currentHeaderHref, type HeaderLink } from './header-navigation'

function NavContent({ links, current }: { links: HeaderLink[]; current?: string | null }) {
  return <nav className="store-header-nav store-shell" aria-label="Điều hướng cửa hàng">
    <div className="store-header-links" data-lenis-prevent-horizontal>
      {links.map((link, index) => <Link key={link.href} href={link.href} aria-current={current === link.href ? 'location' : undefined}>
        {index === 0 ? <Grid2x2 size={18} aria-hidden="true"/> : null}{link.label}
      </Link>)}
    </div>
    <Link href="/thu-vien-the" className="store-header-library" aria-current={current === '/thu-vien-the' ? 'location' : undefined}><BookOpen size={19} aria-hidden="true"/><span>Thư viện thẻ</span><ArrowUpRight size={17} aria-hidden="true"/></Link>
  </nav>
}

export function HeaderNavFallback({ links }: { links: HeaderLink[] }) { return <NavContent links={links}/> }

export function HeaderNav({ links }: { links: HeaderLink[] }) {
  const pathname = usePathname()
  const query = useSearchParams()
  return <NavContent links={links} current={currentHeaderHref(pathname, query, links)}/>
}
