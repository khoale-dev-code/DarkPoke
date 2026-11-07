'use client'
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { ProductImage } from '@/components/shop/product-image'
import { ShopDialog } from '@/components/shop/dialog'
import type { ProductImage as Img } from '@/lib/types'

const SWIPE_PX = 40

/** V14.13 product gallery: large stage, side thumbnails on desktop, arrows, keyboard and swipe, zoom dialog. */
export function Gallery({ images, name }: { images: Img[]; name: string }) {
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const start = useRef<number | null>(null)
  const swiped = useRef(false)
  const list = images.length ? images : [{ id: 'placeholder', url: '', alt: name, product_id: '', sort: 0 }]
  const count = list.length
  const current = list[Math.min(index, count - 1)]
  const go = (delta: number) => setIndex((value) => (value + delta + count) % count)

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (count < 2) return
    if (event.key === 'ArrowRight') { event.preventDefault(); go(1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1) }
  }
  const onDown = (event: PointerEvent<HTMLButtonElement>) => { swiped.current = false; start.current = event.pointerType === 'touch' ? event.clientX : null }
  const onUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (start.current === null || count < 2) return
    const dx = event.clientX - start.current
    start.current = null
    if (Math.abs(dx) > SWIPE_PX) { swiped.current = true; go(dx < 0 ? 1 : -1) }
  }

  const thumbs = count > 1 ? <div className="pd-thumbs" role="group" aria-label="Chọn ảnh sản phẩm">
    {list.map((image, k) => <button key={image.id} type="button" onClick={() => setIndex(k)} aria-label={`Xem ảnh ${k + 1} của ${name}`} aria-pressed={k === index}>
      <ProductImage src={image.url} alt="" sizes="80px" />
    </button>)}
  </div> : null

  return <div className="shop-gallery pd-gallery" data-count={count} onKeyDown={onKey}>
    {thumbs}
    <div className="pd-stage">
      <button type="button" className="pd-stage-main" aria-label={`Mở ảnh lớn của ${name}`} onPointerDown={onDown} onPointerUp={onUp}
        onClick={() => { if (!swiped.current) setOpen(true) }}>
        <ProductImage key={current?.id} src={current?.url || null} alt={current?.alt || name} priority sizes="(max-width:767px) 92vw,(max-width:1199px) 50vw,620px" />
      </button>
      <span className="pd-zoom" aria-hidden="true"><Maximize2 size={16} /></span>
      {count > 1 ? <>
        <button type="button" className="pd-nav pd-nav-prev" aria-label="Ảnh trước" onClick={() => go(-1)}><ChevronLeft size={20} aria-hidden="true" /></button>
        <button type="button" className="pd-nav pd-nav-next" aria-label="Ảnh tiếp theo" onClick={() => go(1)}><ChevronRight size={20} aria-hidden="true" /></button>
        <span className="pd-counter" aria-live="polite">{index + 1} / {count}</span>
      </> : null}
    </div>
    <ShopDialog open={open} onClose={() => setOpen(false)} title="Xem ảnh sản phẩm" description={name} wide>
      <div className="pd-zoom-stage"><ProductImage src={current?.url || null} alt={current?.alt || name} sizes="(max-width:767px) 92vw,760px" className="rounded-xl" /></div>
      {thumbs}
    </ShopDialog>
  </div>
}
