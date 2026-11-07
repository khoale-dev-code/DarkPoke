import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { ProductImage } from '@/components/shop/product-image'
import { formatDate,priceRange,formatVND } from '@/lib/utils'
import type { ProductCard as Card } from '@/lib/types'
import './product-card-v14.css'

type Tone = 'ok' | 'warn' | 'neu' | 'brand'
const LOW_STOCK = 3

/** Status line under the price: what a shopper most needs to know before opening the product. */
function status(p: Card, soldOut: boolean): { text: string; tone: Tone } {
  if (p.allow_preorder) return { text: p.preorder_release_date ? `Dự kiến ${formatDate(p.preorder_release_date)}` : 'Nhận đặt trước', tone: 'brand' }
  if (soldOut) return { text: 'Hết hàng', tone: 'neu' }
  if (p.variant_count > 1) return { text: `${p.variant_count} lựa chọn`, tone: 'ok' }
  if (p.stock_total <= LOW_STOCK) return { text: `Chỉ còn ${p.stock_total}`, tone: 'warn' }
  return { text: 'Còn hàng', tone: 'ok' }
}

/** V14.11 product card: larger image, readable name and price, honest stock line. */
export function ProductCard({p,typeName,priority,className}:{p:Card;typeName?:string;priority?:boolean;className?:string}) {
  const soldOut=p.stock_total<=0&&!p.allow_preorder
  const sale=p.variant_count<=1&&!!p.compare_at_price&&p.compare_at_price>p.price
  const off=sale&&p.compare_at_price?Math.round((1-p.price/p.compare_at_price)*100):0
  const line=status(p,soldOut)
  return <Link href={`/san-pham/${p.slug}`} className={`shop-product-card pc ${className??''}`} data-soldout={soldOut||undefined}>
    <span className="pc-media">
      <ProductImage src={p.thumbnail} alt={p.name} priority={priority} className="product-image" sizes="(max-width:639px) 60vw,(max-width:1099px) 34vw,300px"/>
      <span className="pc-badges">{p.allow_preorder?<span className="pill pill-brand">Đặt trước</span>:soldOut?<span className="pill pill-neu">Hết hàng</span>:null}{sale?<span className="pill pill-bad">Ưu đãi</span>:null}</span>
    </span>
    <span className="pc-body">
      {typeName?<span className="pc-type">{typeName}</span>:null}
      <span className="pc-name">{p.name}</span>
      <span className="pc-price"><strong>{priceRange(p)}</strong>{sale?<><del>{formatVND(p.compare_at_price)}</del>{off>0?<span className="pc-off">-{off}%</span>:null}</>:null}</span>
      <span className="pc-foot"><span className="pc-status" data-tone={line.tone}>{line.text}</span><span className="pc-arrow" aria-hidden="true"><ArrowUpRight size={17}/></span></span>
    </span>
  </Link>
}
export function ProductCardSkeleton(){return <div className="shop-product-card pc" aria-hidden="true"><div className="skeleton aspect-square !rounded-none"/><div className="pc-body"><div className="skeleton h-3 w-1/3"/><div className="skeleton h-4 w-full"/><div className="skeleton h-4 w-3/4"/><div className="skeleton mt-2 h-5 w-1/2"/></div></div>}
export const GRID='shop-product-grid'
