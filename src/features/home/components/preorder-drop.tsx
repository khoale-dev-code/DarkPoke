import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, CalendarDays, MoveUpRight } from 'lucide-react'
import { ProductImage } from '@/components/shop/product-image'
import { formatDate, priceRange } from '@/lib/utils'
import type { ProductCard } from '@/lib/types'
import '../preorder-drop.css'

export function HomePreorderDrop({ items, typeNames }: { items: ProductCard[]; typeNames: Record<string, string> }) {
  if (!items.length) return null
  return <section className="preorder-drop" data-preorder-drop aria-labelledby="home-preorder-title">
    <div className="preorder-drop-shell">
      <header className="preorder-drop-heading">
        <div><span className="preorder-drop-eyebrow">Dark Poke / Đặt trước</span><h2 id="home-preorder-title"><span>Hẹn một</span><span>lần mở pack.</span></h2></div>
        <div className="preorder-drop-invite"><p>Chọn bộ bạn mong đợi. Đặt cọc theo từng sản phẩm, thanh toán phần còn lại khi hàng về.</p><Link prefetch={false} href="/pre-order">Xem tất cả pre-order<ArrowUpRight size={20} aria-hidden="true"/></Link></div>
      </header>

      <div className="preorder-drop-stage" data-preorder-stage>
        <figure className="preorder-drop-scene">
          <div className="preorder-drop-art" data-preorder-art><Image src="/home-v6/sky-world.webp" alt="Charizard bay giữa mây, biển và núi lửa trong tranh minh họa màu nước" width={1000} height={1105} sizes="(max-width: 767px) 88vw, 43vw"/></div>
          <span className="preorder-drop-sticker" aria-hidden="true">Chờ ngày<br/>khui bộ mới.<MoveUpRight size={27}/></span>
          <figcaption>Góc cảm hứng sưu tầm</figcaption>
        </figure>

        <div className="preorder-drop-list" data-single={items.length === 1}>
          {items.map((product, index) => <Link key={product.id} prefetch={false} href={`/san-pham/${product.slug}`} className={`preorder-drop-card ${index === 0 ? 'is-featured' : ''}`} data-preorder-card>
            <span className="preorder-drop-product-art"><ProductImage src={product.thumbnail} alt={product.name} sizes={index === 0 ? '(max-width: 767px) 32vw, 250px' : '100px'}/></span>
            <div className="preorder-drop-product-copy">
              <span className="preorder-drop-product-top"><span>Đặt trước</span>{typeNames[product.type_id] ? <span>{typeNames[product.type_id]}</span> : null}</span>
              <h3>{product.name}</h3>
              <span className="preorder-drop-price"><small>Giá sản phẩm</small><strong>{priceRange(product)}</strong></span>
              <span className="preorder-drop-date"><CalendarDays size={15} aria-hidden="true"/>{product.preorder_release_date ? `Dự kiến ${formatDate(product.preorder_release_date)}` : 'Xem lịch về trong chi tiết'}</span>
              <span className="preorder-drop-product-action">Xem chi tiết đặt trước<ArrowUpRight size={20} aria-hidden="true"/></span>
            </div>
          </Link>)}
        </div>
      </div>
    </div>
  </section>
}
