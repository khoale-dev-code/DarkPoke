'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { ArrowRight, Landmark, Loader2, MapPin, PencilLine, ShieldCheck, ShoppingBag, Store, Truck } from 'lucide-react'
import { ProductImage } from '@/components/shop/product-image'
import { placeOrder } from '@/lib/actions/checkout'
import { cart, cartSubtotal, useCart } from '@/lib/cart'
import { PROVINCES } from '@/lib/labels'
import { formatVND, unaccent } from '@/lib/utils'
import type { ShopSettings } from '@/lib/types'
import { WardCombobox } from './ward-combobox'
import './checkout-v14.css'

type WardMap = Record<string, readonly string[]>
// 3.321 phường, xã (~16 KB nén) chỉ tải khi khách chọn giao tận nơi.
let wardCache: Promise<WardMap> | null = null
const loadWards = () => (wardCache ??= import('@/lib/vn-address/wards').then((m) => m.WARDS).catch((error) => { wardCache = null; throw error }))

interface Props {
  settings: Pick<ShopSettings, 'shipping' | 'rules'>
  defaults: { name: string; email: string }
}

export function CheckoutForm({ settings, defaults }: Props) {
  const router = useRouter()
  const lines = useCart()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [f, setF] = useState({ name: defaults.name, phone: '', email: defaults.email, province: 'TP. Hồ Chí Minh', ward: '', street: '', note: '' })
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [wards, setWards] = useState<WardMap | null>(null)
  const [wardsFailed, setWardsFailed] = useState(false)

  useEffect(() => {
    if (fulfillment !== 'delivery' || wards) return
    let live = true
    loadWards().then((map) => { if (live) setWards(map) }).catch(() => { if (live) setWardsFailed(true) })
    return () => { live = false }
  }, [fulfillment, wards])
  const wardOptions = wards?.[f.province] ?? null

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
    ward: fulfillment === 'delivery' && !wardsFailed && !f.ward ? 'Vui lòng chọn phường, xã' : '',
    street: fulfillment === 'delivery' && f.street.trim().length < (wardsFailed ? 5 : 3) ? (wardsFailed ? 'Vui lòng nhập số nhà, đường, phường' : 'Vui lòng nhập số nhà và tên đường') : ''
  }
  const address = [f.street.trim(), f.ward].filter(Boolean).join(', ')
  const destination = [address, f.province].filter(Boolean).join(', ')
  const count = lines.reduce((sum, line) => sum + line.qty, 0)
  const freeOver = settings.shipping.free_over
  const deliveryFee = freeOver && subtotal >= freeOver ? 0 : isHcm ? settings.shipping.hcm : settings.shipping.other
  const toFree = fulfillment === 'delivery' && freeOver && subtotal < freeOver ? freeOver - subtotal : 0
  const shipNote = fulfillment === 'pickup' ? 'Nhận tại cửa hàng' : !ship ? 'Đơn đủ điều kiện miễn phí' : isHcm ? 'Nội thành TP. Hồ Chí Minh' : 'Giao đến tỉnh, thành khác'
  const show = (k: keyof typeof errors) => (touched[k] ? errors[k] : '')
  const blur = (k: keyof typeof errors) => () => setTouched((t) => ({ ...t, [k]: true }))
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
    setTouched({ name: true, phone: true, email: true, ward: true, street: true })
    if (Object.values(errors).some(Boolean)) { const first=Object.keys(errors).find(k=>errors[k as keyof typeof errors]); document.getElementById(`checkout-${first}`)?.focus(); return }
    setError(null)
    start(async () => {
      try {
      const res = await placeOrder({
        items: lines.map((l) => ({ variant_id: l.variantId, qty: l.qty })),
        customer: { name: f.name.trim(), phone: f.phone.replace(/[\s.]/g, ''), email: f.email.trim(), province: fulfillment === 'delivery' ? f.province : '', address: fulfillment === 'delivery' ? address : '' },
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
    <form onSubmit={submit} noValidate className="shop-checkout-layout ck-layout">
      <div className="ck-main">
        <section className="shop-surface-card ck-card" aria-labelledby="ck-contact">
          <div className="ck-head"><span>1</span><div><h2 id="ck-contact">Thông tin liên hệ</h2><p>Shop dùng để xác nhận đơn hàng với bạn.</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Họ và tên" error={show('name')}>
              <input id="checkout-name" className="input" autoComplete="name" placeholder="Nguyễn Văn A" value={f.name} onChange={set('name')} onBlur={blur('name')} aria-invalid={!!show('name')} />
            </Field>
            <Field label="Số điện thoại" hint="Shop gọi xác nhận đơn qua số này." error={show('phone')}>
              <input id="checkout-phone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="0901 234 567" value={f.phone} onChange={set('phone')} onBlur={blur('phone')} aria-invalid={!!show('phone')} />
            </Field>
            <Field label="Email (không bắt buộc)" error={show('email')} className="sm:col-span-2">
              <input id="checkout-email" className="input" type="email" autoComplete="email" placeholder="ten@email.com" value={f.email} onChange={set('email')} onBlur={blur('email')} />
            </Field>
          </div>
        </section>

        <section className="shop-surface-card ck-card" aria-labelledby="ck-delivery">
          <div className="ck-head"><span>2</span><div><h2 id="ck-delivery">Bạn muốn nhận hàng thế nào?</h2><p>Chọn giao tận nơi hoặc ghé cửa hàng lấy hàng.</p></div></div>
          <div className="ck-options" role="radiogroup" aria-label="Cách nhận hàng">
            {([
              ['delivery', Truck, 'Giao tận nơi', 'Giao đến địa chỉ bạn chọn', deliveryFee ? formatVND(deliveryFee) : 'Miễn phí'],
              ['pickup', Store, 'Nhận tại cửa hàng', `Giữ hàng ${settings.shipping.pickup_hold_days} ngày`, settings.shipping.pickup ? formatVND(settings.shipping.pickup) : 'Miễn phí']
            ] as const).map(([v, Icon, t, d, price]) => (
              <label key={v} className="ck-option">
                <input type="radio" name="fulfillment" checked={fulfillment === v} onChange={() => setFulfillment(v)} />
                <span className="ck-option-icon" aria-hidden="true"><Icon size={20} strokeWidth={1.8} /></span>
                <span className="ck-option-text"><b>{t}</b><small>{d}</small></span>
                <span className="ck-option-price">{price}</span>
              </label>
            ))}
          </div>

          {fulfillment === 'delivery' ? <fieldset className="ck-address">
            <legend>Địa chỉ nhận hàng</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Tỉnh, thành phố">
                <select id="checkout-province" className="input" value={f.province} autoComplete="address-level1"
                  onChange={(e) => { const province = e.target.value; setF((s) => ({ ...s, province, ward: '' })) }}>
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
              {wardsFailed ? null : <div className="flex flex-col gap-1.5">
                <label className="label" htmlFor="checkout-ward">Phường, xã</label>
                <WardCombobox id="checkout-ward" options={wardOptions} value={f.ward} invalid={!!show('ward')} describedBy="checkout-ward-msg"
                  onChange={(ward) => setF((s) => ({ ...s, ward }))} onBlur={blur('ward')} />
                {show('ward') ? <span id="checkout-ward-msg" className="text-sm text-bad">{show('ward')}</span>
                  : <span id="checkout-ward-msg" className="hint">{wardOptions ? `${wardOptions.length} phường, xã · gõ để tìm nhanh` : 'Đang tải danh sách phường, xã…'}</span>}
              </div>}
              <Field label={wardsFailed ? 'Địa chỉ' : 'Số nhà, tên đường'} hint={wardsFailed ? 'Chưa tải được danh sách phường, xã. Nhập đủ số nhà, đường, phường.' : 'Ví dụ: 12 Nguyễn Huệ, hoặc lô B tòa Sunrise'} error={show('street')} className="sm:col-span-2">
                <input id="checkout-street" className="input" autoComplete="address-line1" placeholder={wardsFailed ? 'Số nhà, đường, phường' : 'Số nhà, tên đường, tòa nhà'} value={f.street} onChange={set('street')} onBlur={blur('street')} aria-invalid={!!show('street')} />
              </Field>
            </div>
            {f.street.trim() && (f.ward || wardsFailed) ? <p className="ck-destination"><MapPin size={16} aria-hidden="true" /><span>Giao đến <b>{destination}</b></span></p> : null}
          </fieldset> : <p className="ck-pickup"><Store size={18} aria-hidden="true" /><span>Shop giữ hàng {settings.shipping.pickup_hold_days} ngày tại cửa hàng. Không cần nhập địa chỉ.</span></p>}

          <Field label="Ghi chú cho shop (không bắt buộc)" className="mt-5">
            <textarea className="input" rows={2} value={f.note} onChange={set('note')} placeholder="Ví dụ: giao giờ hành chính, gọi trước khi giao" />
          </Field>
        </section>

        <section className="shop-surface-card ck-card" aria-labelledby="ck-pay">
          <div className="ck-head"><span>3</span><div><h2 id="ck-pay">Phương thức thanh toán</h2><p>Thanh toán sau khi đơn được tạo.</p></div></div>
          <div className="ck-pay">
            <span className="ck-option-icon" aria-hidden="true"><Landmark size={20} strokeWidth={1.8} /></span>
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Chuyển khoản ngân hàng (VietQR)</span>
              <span className="text-sm text-muted">Sau khi đặt, bạn sẽ thấy mã QR và nội dung chuyển khoản. Đơn tự hủy nếu chưa chuyển sau {settings.rules.unpaid_cancel_hours} giờ.</span>
            </div>
          </div>
        </section>
      </div>

      <aside className="shop-summary ck-summary" aria-labelledby="ck-summary-title">
        <div className="ck-summary-head">
          <div><h2 id="ck-summary-title">Đơn hàng của bạn</h2><p>{count} sản phẩm</p></div>
          <Link href="/gio-hang" className="ck-edit"><PencilLine size={15} aria-hidden="true" />Sửa giỏ hàng</Link>
        </div>
        <ul className="ck-items">
          {lines.map((l) => (
            <li key={l.variantId} className="ck-item">
              <Link href={`/san-pham/${l.slug}`} className="ck-item-image" tabIndex={-1} aria-hidden="true">
                <ProductImage src={l.image} alt="" sizes="88px" />
                {l.qty > 1 ? <span className="ck-item-qty">{l.qty}</span> : null}
              </Link>
              <div className="ck-item-body">
                <Link href={`/san-pham/${l.slug}`} className="ck-item-name">{l.name}</Link>
                {l.variantTitle ? <span className="ck-item-variant">{l.variantTitle}</span> : null}
                {l.isPreorder ? <span className="ck-item-badge">Đặt trước</span> : null}
                <span className="ck-item-unit">{formatVND(l.price)} × {l.qty}</span>
              </div>
              <span className="ck-item-total">{formatVND(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>

        <div className="ck-ship-to">
          {fulfillment === 'pickup' ? <><Store size={17} aria-hidden="true" /><span><b>Nhận tại cửa hàng</b>Giữ hàng {settings.shipping.pickup_hold_days} ngày</span></>
            : <><Truck size={17} aria-hidden="true" /><span><b>Giao đến</b>{address ? destination : <em>Chưa có địa chỉ · {f.province}</em>}</span></>}
        </div>

        <dl className="ck-totals">
          <div><dt>Tạm tính ({count} sản phẩm)</dt><dd>{formatVND(subtotal)}</dd></div>
          <div><dt>Phí vận chuyển<small>{shipNote}</small></dt><dd>{ship ? formatVND(ship) : 'Miễn phí'}</dd></div>
          {toFree ? <p className="ck-free">Mua thêm <b>{formatVND(toFree)}</b> để được miễn phí vận chuyển.</p> : null}
          <div className="ck-grand"><dt>Tổng cộng</dt><dd>{formatVND(total)}</dd></div>
        </dl>
        {pre ? <div className="rounded-xl bg-brand-subtle p-3 text-sm leading-relaxed text-brand-ink">Đơn đặt trước: số tiền cọc được tính theo từng sản phẩm và hiển thị cùng mã VietQR sau khi tạo đơn.</div> : null}
        {error ? <p role="alert" className="rounded-lg bg-bad-bg p-3 text-sm text-bad">{error}</p> : null}
        <button type="submit" className="btn btn-primary btn-lg w-full ck-submit" disabled={pending}>
          {pending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}
          {pending ? 'Đang tạo đơn…' : `Xác nhận đặt hàng · ${formatVND(total)}`}{!pending ? <ArrowRight size={16} aria-hidden="true"/> : null}
        </button>
        <p className="ck-safe"><ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true"/>Bạn chưa phải chuyển tiền ở bước này. Mã VietQR sẽ xuất hiện sau khi tạo đơn.</p>
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
