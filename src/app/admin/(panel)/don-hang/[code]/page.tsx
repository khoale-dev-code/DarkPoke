import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink, Phone } from 'lucide-react'
import { ActionButton } from '@/components/admin/action-button'
import { PageHeader, Pill, Section } from '@/components/admin/ui'
import { ProductImage } from '@/components/shop/product-image'
import { getOrder } from '@/lib/admin-data'
import { setOrderStatus } from '@/lib/actions/admin'
import { NEXT_STATUS, ORDER_STATUS } from '@/lib/labels'
import { formatDateTime, formatVND } from '@/lib/utils'

export const metadata = { title: 'Chi tiết đơn' }

export default async function OrderDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const o = await getOrder(code.toUpperCase())
  if (!o) notFound()
  const st = ORDER_STATUS[o.status]
  const next = NEXT_STATUS[o.status] ?? []
  const canCancel = !['completed', 'cancelled'].includes(o.status)
  const due = Math.max(o.amount_due - o.paid_amount, 0)

  const actions = (
    <>
      {canCancel ? (
        <ActionButton
          action={setOrderStatus.bind(null, o.id, 'cancelled', 'Shop hủy đơn')}
          className="btn btn-danger-outline"
          confirm={{ title: `Hủy đơn ${o.code}?`, text: 'Hàng trong đơn sẽ được hoàn lại kho. Thao tác này không hoàn tác được.', confirmLabel: 'Hủy đơn', danger: true }}
        >
          Hủy đơn
        </ActionButton>
      ) : null}
      {next.map((n) => (
        <ActionButton
          key={n.to}
          action={setOrderStatus.bind(null, o.id, n.to, n.label)}
          className="btn btn-primary"
          confirm={n.to === 'paid' ? { title: 'Xác nhận đã nhận tiền?', text: `Kiểm tra sao kê có khoản ${formatVND(due)} với nội dung chứa ${o.code}.`, confirmLabel: 'Đã nhận tiền' } : undefined}
        >
          {n.label}
        </ActionButton>
      ))}
    </>
  )

  return (
    <>
      <PageHeader
        back={{ href: '/admin/don-hang', label: 'Đơn hàng' }}
        title={`Đơn ${o.code}`}
        subtitle={<span className="flex flex-wrap items-center gap-2">{formatDateTime(o.created_at)}<Pill tone={st.tone}>{st.label}</Pill>{o.kind === 'preorder' ? <Pill tone="brand">Pre-order</Pill> : null}{o.channel === 'pos' ? <Pill tone="neu">Tại quầy</Pill> : null}</span>}
        actions={<div className="hidden flex-wrap gap-2 lg:flex">{actions}</div>}
      />

      <Section title={`Sản phẩm (${o.items.length})`}>
        <ul className="flex flex-col gap-3">
          {o.items.map((i) => (
            <li key={i.sku} className="flex items-start gap-3">
              <span className="w-14 flex-none overflow-hidden rounded-lg border border-line"><ProductImage src={i.image_url} alt={i.name} sizes="56px" /></span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">{i.name}</span>
                <span className="text-sm text-muted">{i.variant_title !== 'Mặc định' ? `${i.variant_title} · ` : ''}SKU {i.sku} · {formatVND(i.unit_price)} × {i.qty}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{formatVND(i.line_total)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-1.5 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Tạm tính</dt><dd className="tabular-nums">{formatVND(o.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Phí vận chuyển</dt><dd className="tabular-nums">{formatVND(o.shipping_fee)}</dd></div>
          {o.discount ? <div className="flex justify-between"><dt className="text-muted">Giảm giá</dt><dd className="tabular-nums">-{formatVND(o.discount)}</dd></div> : null}
          <div className="flex justify-between text-base"><dt className="font-semibold">Tổng cộng</dt><dd className="price">{formatVND(o.total)}</dd></div>
          {o.kind === 'preorder' ? <div className="flex justify-between text-brand-ink"><dt>Tiền cọc</dt><dd className="font-semibold tabular-nums">{formatVND(o.amount_due)}</dd></div> : null}
          <div className="flex justify-between"><dt className="text-muted">Đã thanh toán</dt><dd className="font-semibold tabular-nums text-ok">{formatVND(o.paid_amount)}</dd></div>
        </dl>
      </Section>

      <Section title="Khách hàng và giao nhận">
        <div className="flex flex-col gap-1">
          <b>{o.customer_name}</b>
          <span className="text-sm text-muted">{o.phone}{o.email ? ` · ${o.email}` : ''}</span>
          <span className="text-sm">{o.fulfillment === 'pickup' ? 'Nhận tại cửa hàng' : [o.address, o.province].filter(Boolean).join(', ')}</span>
          {o.note ? <span className="text-sm text-muted">Ghi chú: {o.note}</span> : null}
        </div>
        {o.phone !== '-' ? <a href={`tel:${o.phone}`} className="btn btn-secondary self-start"><Phone size={16} aria-hidden="true" />Gọi khách</a> : null}
      </Section>

      <Section title="Thanh toán">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>{o.payment_method === 'bank_transfer' ? 'Chuyển khoản' : o.payment_method === 'cash' ? 'Tiền mặt' : 'Thẻ'}</span>
          {o.customer_confirmed_at ? <Pill tone="brand">Khách báo đã chuyển lúc {formatDateTime(o.customer_confirmed_at)}</Pill> : null}
          {o.status === 'pending_payment' && o.expires_at ? <span className="text-muted">Tự hủy lúc {formatDateTime(o.expires_at)}</span> : null}
        </div>
        {o.proof_url ? (
          <a href={o.proof_url} target="_blank" rel="noreferrer" className="btn btn-secondary self-start"><ExternalLink size={16} aria-hidden="true" />Xem ảnh chuyển khoản</a>
        ) : <span className="text-sm text-muted">Khách chưa tải ảnh chuyển khoản.</span>}
        <Link href={`/don-hang/${o.code}?t=${o.access_token}`} target="_blank" className="text-sm font-semibold text-brand-ink">Mở trang thanh toán của khách</Link>
      </Section>

      <Section title="Lịch sử">
        <ol className="flex flex-col gap-3 border-l-2 border-line pl-4">
          {[...o.events].reverse().map((e, i) => (
            <li key={i} className="flex flex-col">
              <span className="font-semibold">{e.message}</span>
              <span className="text-xs text-muted">{formatDateTime(e.created_at)}{e.actor ? ` · ${e.actor}` : ''}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* Thanh thao tác cố định trên điện thoại */}
      {canCancel || next.length ? (
        <div className="admin-savebar lg:hidden"><div className="admin-savebar-inner">{actions}</div></div>
      ) : null}
    </>
  )
}
