'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { ProductImage } from '@/components/shop/product-image'
import { priceRange } from '@/lib/utils'
import { clearRecentProducts, rememberProduct, useRecentProducts, type RecentProduct } from '../recently-viewed'

/** Placed on the product page; renders nothing. */
export function RememberProduct({ product }: { product: RecentProduct }) {
  const { id, slug, name, thumbnail, price, min_price, max_price } = product
  useEffect(() => { rememberProduct({ id, slug, name, thumbnail, price, min_price, max_price }) }, [id, slug, name, thumbnail, price, min_price, max_price])
  return null
}

export function RecentlyViewed() {
  const items = useRecentProducts()
  if (!items.length) return null
  return <section className="hp-band hp-band-plain" aria-labelledby="hp-recent-title">
    <div className="shop-container">
      <header className="hp-heading">
        <div><span className="hp-eyebrow">Tiếp tục khám phá</span><h2 id="hp-recent-title">Bạn đã xem gần đây</h2></div>
        <div className="hp-heading-tools"><button type="button" className="hp-more" onClick={clearRecentProducts}>Xóa lịch sử</button></div>
      </header>
      <ul className="hp-recent">
        {items.map((item) => <li key={item.id}><Link prefetch={false} href={`/san-pham/${item.slug}`} className="hp-recent-item">
          <span className="hp-recent-art"><ProductImage src={item.thumbnail} alt="" sizes="120px" /></span>
          <span className="hp-recent-name">{item.name}</span>
          <strong>{priceRange(item)}</strong>
        </Link></li>)}
      </ul>
    </div>
  </section>
}
