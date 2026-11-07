import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { ProductCard } from '@/components/shop/product-card'
import type { ProductCard as Card } from '@/lib/types'
import { RailControls } from './rail-controls'

interface Props { id: string; eyebrow: string; title: string; href?: string; action?: string; items: Card[]; typeNames: Record<string, string>; tone?: 'plain' | 'tint'; variant?: 'default' | 'feature' }

/** Server-rendered product row: scroll-snap on touch, small arrow controls on desktop. `feature` shows fewer, larger cards. */
export function ProductRail({ id, eyebrow, title, href, action = 'Xem tất cả', items, typeNames, tone = 'plain', variant = 'default' }: Props) {
  if (!items.length) return null
  const listId = `${id}-list`
  return <section className={`hp-band hp-band-${tone}`} aria-labelledby={`${id}-title`}>
    <div className="hp-rail-head">
      <header className="hp-heading" data-home-reveal>
        <div><span className="hp-eyebrow">{eyebrow}</span><h2 id={`${id}-title`}>{title}</h2></div>
        <div className="hp-heading-tools">
          {href ? <Link prefetch={false} href={href} className="hp-more">{action}<ArrowUpRight size={15} aria-hidden="true" /></Link> : null}
          <RailControls target={listId} label={title} />
        </div>
      </header>
    </div>
    <ul id={listId} className="hp-rail" data-variant={variant} tabIndex={-1}>
      {items.map((product) => <li key={product.id}><ProductCard p={product} typeName={typeNames[product.type_id]} /></li>)}
    </ul>
  </section>
}
