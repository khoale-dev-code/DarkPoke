'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ArrowRight, Landmark, Loader2, ShieldCheck, ShoppingBag } from 'lucide-react'
import { ProductImage } from '@/components/shop/product-image'
import { placeOrder } from '@/lib/actions/checkout'
import { cart, cartSubtotal, useCart } from '@/lib/cart'
import { PROVINCES } from '@/lib/labels'
import { formatVND, unaccent } from '@/lib/utils'
import type { ShopSettings } from '@/lib/types'

interface Props {
  settings: Pick<ShopSettings, 'shipping' | 'rules'>
  defaults: { name: string; email: string }
}

export function CheckoutForm({ settings, defaults }: Props) {
  const router = useRouter()
  const lines = useCart()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [f, setF] = useState({ name: defaults.name, phone: '', email: defaults.email, province: 'TP. Hồ Chí Minh', address: '', note: '' })
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery')
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const subtotal = cartSubtotal(lines)
  const pre = lines.some((l) => l.isPreorder)
  const isHcm = unaccent(f.province.toLowerCase()).includes('ho chi minh')
  let ship = fulfillment === 'pickup' ? settings.shipping.pickup : isHcm ? settings.shipping.hcm : settings.shipping.other
  if (settings.shipping.free_over && subtotal >= settings.shipping.free_over) ship = 0
  const total = subtotal + ship

  const errors = {
    name: f.name.trim().length < 2 ? 'Vui lòng nhập họ tên' : '',
    phone: /^(0|\+84)[0-9]{9,10}$/.test(f.phone.replace(/[\s.]/g, '')) ? '' : 'Số điện thoại chưa đúng, ví dụ 0901234567',
    email: f.email && !/^\S+@\S+\.\S+$/.test(f.email) ? 'Email chưa đúng' : '',
    address: fulfillment === 'delivery' && f.address.trim().length < 5 ? 'Vui lòng nhập số nhà, đường, phường' : ''
  }
  const show = (k: keyof typeof errors) => (touched[k] ? errors[k] : '')
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }))

  if (!lines.length) {
    return (
      <div className="shop-empty">
        <span className="shop-empty-icon"><ShoppingBag size={28} aria-hidden="true" /></span><h2>Giỏ hàng đang trống</h2><p>Thêm một vài sản phẩm trước khi bắt đầu đặt hàng.</p>
        <Link href="/san-pham" className="btn btn-primary">Xem sản phẩm</Link>
      </div>
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ name: true, phone: true, email: true, address: true })
    if (Object.values(errors).some(Boolean)) { const first=Object.keys(errors).find(k=>errors[k as keyof typeof errors]); document.getElementById(`checkout-${first}`)?.focus(); return }
    setError(null)
    start(async () => {
      try {
      const res = await placeOrder({
        items: lines.map((l) => ({ variant_id: l.variantId, qty: l.qty })),
        customer: { name: f.name.trim(), phone: f.phone.replace(/[\s.]/g, ''), email: f.email.trim(), province: fulfillment === 'delivery' ? f.province : '', address: fulfillment === 'delivery' ? f.address.trim() : '' },
        fulfillment,
        note: f.note
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      cart.clear()
      router.replace(res.data?.url ?? '/tai-khoan')
      } catch {setError('Chưa nhận được xác nhận. Giữ nguyên giỏ hàng, kiểm tra Đơn hàng của tôi trước khi thử lại để tránh tạo trùng đơn.')}
    })
  }

  return (
    <form onSubmit={submit} noValidate className="shop-checkout-layout">
      <div className="flex flex-col gap-6">
        <section className="shop-surface-card">
          <div className="shop-form-title"><span>1</span><h2>Thông tin liên hệ</h2></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Họ và tên" error={show('name')}>
              <input id="checkout-name" className="input" autoComplete="name" value={f.name} onChange={set('name')} onBlur={() => setTouched((t) => ({ ...t, name: true }))} aria-invalid={!!show('name')} />
            </Field>
            <Field label="Số điện thoại" hint="Shop gọi xác nhận đơn qua số này." error={show('phone')}>
              <input id="checkout-phone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="0901 234 567" value={f.phone} onChange={set('phone')} onBlur={() => setTouched((t) => ({ ...t, phone: true }))} aria-invalid={!!show('phone')} />
            </Field>
            <Field label="Email (không bắt buộc)" error={show('email')} className="sm:col-span-2">
              <input id="checkout-email" className="input" type="email" autoComplete="email" placeholder="ten@email.com" value={f.email} onChange={set('email')} onBlur={() => setTouched((t) => ({ ...t, email: true }))} />
            </Field>
          </div>
        </section>

        <section className="shop-surface-card">
          <div className="shop-form-title"><span>2</span><h2>Bạn muốn nhận hàng thế nào?</h2></div>
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            {([['delivery', 'Giao tận nơi', 'Nhận hàng tại địa chỉ bạn cung cấp'], ['pickup', 'Nhận tại cửa hàng', `${settings.shipping.pickup ? formatVND(settings.shipping.pickup) : 'Miễn phí'}, giữ hàng ${settings.shipping.pickup_hold_days} ngày`]] as const).map(([v, t, d]) => (
              <label key={v} className="shop-choice">
                <input type="radio" name="fulfillment" className="mt-1 size-5 accent-[var(--color-brand)]" checked={fulfillment === v} onChange={() => setFulfillment(v)} />
                <span><b>{t}</b><small>{d}</small></span>
              </label>
            ))}
          </div>
          {fulfillment === 'delivery' ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Tỉnh, thành phố">
                <select className="input" value={f.province} onChange={set('province')} autoComplete="address-level1">
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Địa chỉ" error={show('address')}>
                <input id="checkout-address" className="input" autoComplete="street-address" placeholder="Số nhà, đường, phường" value={f.address} onChange={set('address')} onBlur={() => setTouched((t) => ({ ...t, address: true }))} aria-invalid={!!show('address')} />
              </Field>
            </div>
          ) : null}
          <Field label="Ghi chú (không bắt buộc)">
            <textarea className="input" rows={2} value={f.note} onChange={set('note')} placeholder="Ví dụ: giao giờ hành chính" />
          </Field>
        </section>

        <section className="shop-surface-card">
          <div className="shop-form-title"><span>3</span><h2>Phương thức thanh toán</h2></div>
          <div className="flex gap-3 rounded-xl border border-[#b9cbfc] bg-[#f5f8ff] p-4">
            <Landmark size={22} className="mt-0.5 flex-none text-brand" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Chuyển khoản ngân hàng (VietQR)</span>
              <span className="text-sm text-muted">Sau khi đặt, bạn sẽ thấy mã QR và nội dung chuyển khoản. Đơn tự hủy nếu chưa chuyển sau {settings.rules.unpaid_cancel_hours} giờ.</span>
            </div>
          </div>
        </section>
      </div>

      <aside className="shop-summary">
        <h2 className="h-card">Đơn hàng của bạn</h2>
        <ul className="flex flex-col gap-3">
          {lines.map((l) => (
            <li key={l.variantId} className="shop-summary-item">
              <span className="w-11 overflow-hidden rounded-lg border border-line"><ProductImage src={l.image} alt={l.name} sizes="56px" /></span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="line-clamp-2 text-xs font-semibold">{l.name}</span>
                <span className="mt-1 text-[10px] text-muted">{l.variantTitle ? `${l.variantTitle} · ` : ''}SL {l.qty}</span>
                <span className="shop-summary-item-price">{formatVND(l.price * l.qty)}</span>
              </span>
            </li>
          ))}
        </ul>
        <hr className="border-line" />
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Tạm tính</dt><dd className="tabular-nums">{formatVND(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Phí vận chuyển</dt><dd className="tabular-nums">{ship ? formatVND(ship) : 'Miễn phí'}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-base"><dt className="font-semibold">Tổng cộng</dt><dd className="price">{formatVND(total)}</dd></div>
          {pre ? <div className="rounded-xl bg-brand-subtle p-3 text-xs leading-relaxed text-brand-ink">Đơn đặt trước: số tiền cọc được tính theo từng sản phẩm và hiển thị cùng mã VietQR sau khi tạo đơn.</div> : null}
        </dl>
        {error ? <p role="alert" className="rounded-lg bg-bad-bg p-3 text-sm text-bad">{error}</p> : null}
        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pending}>
          {pending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}
          {pending ? 'Đang tạo đơn…' : 'Xác nhận đặt hàng'}{!pending ? <ArrowRight size={16} aria-hidden="true"/> : null}
        </button>
        <p className="flex gap-2 text-[11px] leading-relaxed text-muted"><ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden="true"/>Bạn chưa phải chuyển tiền ở bước này. Mã VietQR sẽ xuất hiện sau khi tạo đơn.</p>
      </aside>
    </form>
  )
}

function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <span className="label">{label}</span>
      {children}
      {error ? <span className="text-sm text-bad">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </label>
  )
}
