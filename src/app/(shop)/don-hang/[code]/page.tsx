import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check, Clock, PackageCheck } from 'lucide-react'
import { CopyButton } from '@/components/shop/copy-button'
import { Countdown } from '@/components/shop/countdown'
import { ConfirmTransferButton, ProofUpload } from '@/components/shop/payment-actions'
import { ProductImage } from '@/components/shop/product-image'
import { getSettings } from '@/lib/catalog'
import { DEMO_ORDERS } from '@/lib/demo'
import { isDemo } from '@/lib/env'
import { ORDER_STATUS } from '@/lib/labels'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime, formatVND, transferContent, isPlaceholder } from '@/lib/utils'
import { vietQrUrl } from '@/lib/vietqr'
import type { PublicOrder } from '@/lib/types'

export const metadata: Metadata = { title: 'Chờ thanh toán', robots: { index: false, follow: false } }

type Params = { params: Promise<{ code: string }>; searchParams: Promise<{ t?: string }> }

async function loadOrder(code: string, token: string): Promise<PublicOrder | null> {
  if (isDemo) {
    const o = DEMO_ORDERS.find((x) => x.code === code) ?? DEMO_ORDERS[0]
    return o ? ({ ...o, has_proof: false } as unknown as PublicOrder) : null
  }
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null
  const sb = await createClient()
  const { data } = await sb.rpc('get_order_public', { p_code: code, p_token: token })
  return (data as PublicOrder | null) ?? null
}

const STEPS = [
  { key: 'placed', label: 'Đã đặt hàng' },
  { key: 'pay', label: 'Thanh toán' },
  { key: 'pack', label: 'Đóng gói' },
  { key: 'ship', label: 'Giao hàng' },
  { key: 'done', label: 'Hoàn tất' }
]
const STEP_INDEX: Record<string, number> = { pending_payment: 1, paid: 2, packing: 2, shipping: 3, ready_pickup: 3, completed: 4, cancelled: -1 }

export default async function OrderPayPage({ params, searchParams }: Params) {
  const [{ code }, { t = '' }, settings] = await Promise.all([params, searchParams, getSettings()])
  const order = await loadOrder(code.toUpperCase(), t)
  if (!order) notFound()

  const bank = settings.bank
  const content = transferContent(bank.transfer_template, order.code, order.customer_name)
  const due = Math.max(order.amount_due - order.paid_amount, 0)
  const qr = vietQrUrl(bank, due, content)
  const pending = order.status === 'pending_payment'
  const cancelled = order.status === 'cancelled'
  const cur = STEP_INDEX[order.status] ?? 1
  const st = ORDER_STATUS[order.status]

  return (
    <div className="shop-container shop-page">
      <div className="shop-payment-layout">
        <div className="flex min-w-0 flex-col gap-5">
          {/* Trạng thái */}
          <section className="shop-surface-card flex flex-col gap-4">
            <div className={`flex flex-wrap items-start gap-3 rounded-xl p-4 ${pending ? 'bg-warn-bg' : cancelled ? 'bg-bad-bg' : 'bg-ok-bg'}`}>
              {pending ? <Clock size={28} className="flex-none text-warn" aria-hidden="true" /> : <PackageCheck size={28} className={`flex-none ${cancelled ? 'text-bad' : 'text-ok'}`} aria-hidden="true" />}
              <div className="flex min-w-0 flex-[1_1_220px] flex-col">
                <h1 className="font-display text-xl font-bold">{pending ? (order.kind === 'preorder' ? 'Chờ chuyển tiền cọc' : 'Chờ thanh toán') : st.label}</h1>
                <span className="flex items-center gap-1">Đơn hàng <b className="code">{order.code}</b><CopyButton value={order.code} label="mã đơn hàng" /></span>
              </div>
              {pending && order.expires_at ? (
                <div className="flex flex-col items-end">
                  <span className="text-xs">Giữ đơn trong</span>
                  <Countdown until={order.expires_at} />
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-4 py-3">
              <span className="flex size-8 flex-none items-center justify-center rounded-full bg-ink text-white"><Check size={18} aria-hidden="true" /></span>
              <b>{cancelled ? 'Đơn hàng đã hủy' : 'Đã tiếp nhận đơn hàng'}</b>
              <span className="ml-auto text-sm text-muted">{formatDateTime(order.created_at)}</span>
            </div>
            {pending ? (
              <p className="text-sm text-muted">
                Đơn sẽ tự hủy nếu chưa chuyển khoản sau {settings.rules.unpaid_cancel_hours} giờ. Sau khi nhận tiền, shop đối soát trong giờ làm việc và báo cho bạn qua điện thoại hoặc email.
              </p>
            ) : null}
          </section>

          {!cancelled ? (
            <section className="card p-4 sm:p-5" aria-label="Tiến trình đơn hàng">
              <ol className="stepper" style={{ ['--steps' as string]: 5 }}>
                {STEPS.map((s, i) => (
                  <li key={s.key} className={i < cur ? 'done' : i === cur ? 'cur' : ''}>
                    <span className="pr-1 text-[11px] leading-tight sm:text-sm">{s.label}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* Thanh toán */}
          {pending ? (
            <section className="shop-surface-card flex flex-col gap-4">
              <span className="pill pill-warn self-start">{order.kind === 'preorder' ? `Cọc ${order.deposit_pct ?? settings.rules.preorder_deposit_pct}%` : 'Chờ thanh toán'}</span>
              <dl className="flex flex-col">
                <Row k="Tổng đơn" v={formatVND(order.total)} />
                <Row k="Cần thanh toán" v={formatVND(due)} strong />
                <Row k="Phương thức" v="Chuyển khoản ngân hàng" last />
              </dl>
              <div className="shop-payment-bank">
                <div className="order-1 flex flex-col items-center justify-center gap-2 rounded-xl border border-line p-4 lg:order-2">
                  {qr ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qr} alt={`Mã VietQR chuyển ${formatVND(due)} cho đơn ${order.code}`} width={200} height={200} className="size-48 object-contain md:size-44" />
                  ) : (
                    <div className="flex size-44 items-center justify-center rounded-lg bg-surface p-4 text-center text-xs text-muted">
                      Thông tin chuyển khoản đang cập nhật. Vui lòng liên hệ cửa hàng trước khi chuyển tiền.
                    </div>
                  )}
                  <span className="text-center text-xs text-muted">Mở app ngân hàng và quét mã</span>
                </div>
                <div className="order-2 rounded-xl bg-surface px-4 py-2 lg:order-1">
                  <h2 className="py-2 text-sm font-semibold text-muted">Nội dung chuyển khoản</h2>
                  <dl className="flex flex-col">
                    <Row k="Chủ tài khoản" v={bank.account_name} />
                    <Row k="Ngân hàng" v={bank.bank_name} />
                    <Row k="Số tài khoản" v={bank.account_no} copy mono />
                    <Row k="Nội dung" v={content} copy mono />
                    <Row k="Số tiền" v={formatVND(due)} copyValue={String(due)} copy strong last />
                  </dl>
                </div>
              </div>
              <p className="text-sm text-muted">Nhập đúng nội dung chuyển khoản để shop đối soát nhanh. Chuyển thiếu hoặc sai nội dung, shop sẽ liên hệ bạn.</p>
              <ConfirmTransferButton code={order.code} token={t} confirmed={!!order.customer_confirmed_at} />
              <hr className="border-line" />
              <ProofUpload code={order.code} token={t} hasProof={order.has_proof} />
            </section>
          ) : null}

          <section className="shop-surface-card flex flex-col gap-3">
            <h2 className="h-card">Giao nhận</h2>
            <span className="pill pill-neu self-start">{order.fulfillment === 'pickup' ? 'Nhận tại cửa hàng' : 'Giao tận nơi'}</span>
            <div className="flex flex-col gap-0.5">
              <b>{order.customer_name} <span className="font-normal text-muted">· {order.phone}</span></b>
              {order.email ? <span className="text-sm text-muted">{order.email}</span> : null}
              {order.fulfillment === 'delivery' ? <span className="text-sm">{[order.address, order.province].filter(Boolean).join(', ')}</span> : <span className="text-sm">{settings.shop.address}</span>}
              {order.note ? <span className="text-sm text-muted">Ghi chú: {order.note}</span> : null}
            </div>
          </section>
        </div>

        <aside className="shop-payment-sidebar">
          <section className="shop-surface-card flex flex-col gap-4">
            <h2 className="h-card">Sản phẩm</h2>
            <ul className="flex flex-col gap-3">
              {order.items.map((i) => (
                <li key={i.sku} className="flex items-start gap-3">
                  <span className="w-14 flex-none overflow-hidden rounded-lg border border-line"><ProductImage src={i.image_url} alt={i.name} sizes="56px" /></span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="line-clamp-2 text-sm font-semibold">{i.name}</span>
                    <span className="text-xs text-muted">{i.variant_title && i.variant_title !== 'Mặc định' ? `${i.variant_title} · ` : ''}SL {i.qty}</span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{formatVND(i.line_total)}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="shop-summary !static !gap-3 text-sm">
            <h2 className="h-card mb-1">Tóm tắt đơn hàng</h2>
            <div className="flex justify-between"><span className="text-muted">Tổng tiền hàng</span><span className="tabular-nums">{formatVND(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Phí vận chuyển</span><span className="tabular-nums">{order.shipping_fee ? formatVND(order.shipping_fee) : 'Miễn phí'}</span></div>
            {order.discount ? <div className="flex justify-between"><span className="text-muted">Giảm giá</span><span className="tabular-nums">-{formatVND(order.discount)}</span></div> : null}
            <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3"><span className="font-semibold">Tổng thanh toán</span><span className="font-sans text-2xl font-bold tabular-nums">{formatVND(order.total)}</span></div>
            {order.paid_amount ? <div className="flex justify-between text-ok"><span>Đã thanh toán</span><span className="tabular-nums">{formatVND(order.paid_amount)}</span></div> : null}
          </section>
          <div className="flex flex-wrap gap-3">
            <Link href="/san-pham" className="btn btn-secondary">Tiếp tục mua sắm</Link>
            <Link href="/tai-khoan" className="btn btn-ghost">Đơn hàng của tôi</Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Row({ k, v, copy, copyValue, strong, mono, last }: { k: string; v: string; copy?: boolean; copyValue?: string; strong?: boolean; mono?: boolean; last?: boolean }) {
  return (
    <div className={`flex min-h-11 items-center justify-between gap-3 ${last ? '' : 'border-b border-dashed border-line'}`}>
      <dt className="text-sm text-muted">{k}</dt>
      <dd className="flex min-w-0 items-center gap-1 text-right">
        <span className={`${mono ? 'code' : ''} ${strong ? 'text-lg font-bold' : 'font-semibold'} break-words tabular-nums`}>{isPlaceholder(v)?'Đang cập nhật':v}</span>
        {copy && !isPlaceholder(v) ? <CopyButton value={copyValue ?? v} label={k.toLowerCase()} /> : null}
      </dd>
    </div>
  )
}
