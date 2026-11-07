'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Store, Trash2, Truck, Undo2 } from 'lucide-react'
import { ProductImage } from '@/components/shop/product-image'
import { cart, cartCount, cartSubtotal, useCart, type CartLine } from '@/lib/cart'
import type { ShopSettings } from '@/lib/types'
import { formatVND } from '@/lib/utils'
import './checkout-v14.css'

/** V14.29 cart: large product rows, clear quantity controls, undo after removing, shipping costs and free-shipping progress up front. */
export function CartView({ shipping }: { shipping: ShopSettings['shipping'] }) {
  const lines = useCart()
  const [removed, setRemoved] = useState<CartLine | null>(null)
  const subtotal = cartSubtotal(lines)
  const count = cartCount(lines)
  const pre = lines.some((l) => l.isPreorder)
  const freeOver = shipping.free_over
  const toFree = freeOver && subtotal < freeOver ? freeOver - subtotal : 0
  const freeNow = !!freeOver && subtotal >= freeOver
  const progress = freeOver ? Math.min(100, Math.round((subtotal / freeOver) * 100)) : 0

  const remove = (line: CartLine) => { cart.remove(line.variantId); setRemoved(line) }
  const undo = () => { if (!removed) return; const { qty, ...line } = removed; cart.add(line, qty); setRemoved(null) }
  const undoBar = removed ? <div className="ck-undo" role="status"><span>Đã xóa <b>{removed.name}</b> khỏi giỏ.</span><button type="button" onClick={undo}><Undo2 size={15} aria-hidden="true" />Hoàn tác</button></div> : null

  if (!lines.length) return <div className="flex flex-col gap-5">
    {undoBar}
    <div className="shop-empty"><span className="shop-empty-icon"><ShoppingBag size={29} strokeWidth={1.5} aria-hidden="true" /></span><h2>Chưa có mảnh ghép nào trong giỏ</h2><p>Khám phá sản phẩm mới và chọn những món dành riêng cho bộ sưu tập của bạn.</p><Link href="/san-pham" className="btn btn-primary mt-2">Bắt đầu khám phá<ArrowRight size={16} aria-hidden="true" /></Link></div>
  </div>

  return <div className="shop-checkout-layout ck-layout">
    <div className="ck-main">
      <section className="shop-surface-card ck-card ck-cart" aria-labelledby="ck-cart-title">
        <div className="ck-cart-head">
          <h2 id="ck-cart-title">{count} sản phẩm trong giỏ</h2>
          {pre ? <span className="ck-item-badge">Giỏ hàng đặt trước</span> : <span className="ck-cart-stock">Hàng có sẵn</span>}
        </div>
        {undoBar}
        <ul className="ck-cart-list">
          {lines.map((l) => <li key={l.variantId} className="ck-cart-item">
            <Link href={`/san-pham/${l.slug}`} className="ck-cart-image" tabIndex={-1} aria-hidden="true"><ProductImage src={l.image} alt="" sizes="120px" /></Link>
            <div className="ck-cart-info">
              <Link href={`/san-pham/${l.slug}`} className="ck-cart-name">{l.name}</Link>
              <div className="ck-cart-meta">
                {l.variantTitle ? <span>{l.variantTitle}</span> : null}
                {l.isPreorder ? <span className="ck-item-badge">Đặt trước</span> : null}
                <span>{formatVND(l.price)} / sản phẩm</span>
              </div>
              <div className="ck-cart-actions">
                {l.max > 1 ? <div className="ck-qty" role="group" aria-label={`Số lượng ${l.name}`}>
                  <button type="button" aria-label={`Giảm số lượng ${l.name}`} disabled={l.qty <= 1} onClick={() => cart.setQty(l.variantId, l.qty - 1)}><Minus size={16} aria-hidden="true" /></button>
                  <input inputMode="numeric" aria-label={`Số lượng ${l.name}`} value={l.qty} onChange={(e) => cart.setQty(l.variantId, Number(e.target.value.replace(/\D/g, '')) || 1)} onFocus={(e) => e.target.select()} />
                  <button type="button" aria-label={`Tăng số lượng ${l.name}`} disabled={l.qty >= l.max} onClick={() => cart.setQty(l.variantId, l.qty + 1)}><Plus size={16} aria-hidden="true" /></button>
                </div> : <span className="ck-cart-single">Số lượng: 1</span>}
                {l.max > 1 && l.qty >= l.max ? <span className="ck-cart-limit">Tối đa {l.max} sản phẩm</span> : null}
                <button type="button" className="ck-remove" onClick={() => remove(l)} aria-label={`Xóa ${l.name} khỏi giỏ`}><Trash2 size={16} aria-hidden="true" /><span>Xóa</span></button>
              </div>
            </div>
            <strong className="ck-cart-total">{formatVND(l.price * l.qty)}</strong>
          </li>)}
        </ul>
      </section>
      <Link href="/san-pham" className="shop-section-link"><ArrowLeft size={15} aria-hidden="true" />Tiếp tục khám phá sản phẩm</Link>
    </div>

    <aside className="shop-summary ck-summary" aria-labelledby="ck-cart-summary">
      <div className="ck-summary-head"><div><h2 id="ck-cart-summary">Tóm tắt đơn hàng</h2><p>{count} sản phẩm</p></div></div>
      {freeOver ? <div className="ck-freebar">
        <p>{toFree ? <>Mua thêm <b>{formatVND(toFree)}</b> để được miễn phí giao hàng</> : <><b>Đơn của bạn được miễn phí giao hàng</b></>}</p>
        <span className="ck-freebar-track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></span>
      </div> : null}
      <dl className="ck-totals">
        <div><dt>Tạm tính ({count} sản phẩm)</dt><dd>{formatVND(subtotal)}</dd></div>
        <div><dt>Phí vận chuyển<small>Chọn cách nhận ở bước tiếp theo</small></dt><dd className="ck-muted">Tính sau</dd></div>
      </dl>
      <ul className="ck-ship-list" aria-label="Phí vận chuyển tham khảo">
        <li><Truck size={16} aria-hidden="true" /><span>Nội thành TP. Hồ Chí Minh</span><b>{freeNow || !shipping.hcm ? 'Miễn phí' : formatVND(shipping.hcm)}</b></li>
        <li><Truck size={16} aria-hidden="true" /><span>Tỉnh, thành khác</span><b>{freeNow || !shipping.other ? 'Miễn phí' : formatVND(shipping.other)}</b></li>
        <li><Store size={16} aria-hidden="true" /><span>Nhận tại cửa hàng</span><b>{shipping.pickup ? formatVND(shipping.pickup) : 'Miễn phí'}</b></li>
      </ul>
      <dl className="ck-totals"><div className="ck-grand"><dt>Tạm tính</dt><dd>{formatVND(subtotal)}</dd></div></dl>
      {pre ? <p className="rounded-xl bg-brand-subtle p-3 text-sm leading-relaxed text-brand-ink">Đơn đặt trước chỉ cần chuyển tiền cọc. Số tiền cụ thể hiển thị sau khi bạn tạo đơn.</p> : null}
      <Link href="/thanh-toan" className="btn btn-primary btn-lg w-full ck-submit">Tiếp tục đặt hàng<ArrowRight size={17} aria-hidden="true" /></Link>
      <p className="ck-safe"><ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />Chưa thu tiền ở bước này. Bạn sẽ nhận mã VietQR sau khi xác nhận đơn.</p>
    </aside>
  </div>
}
