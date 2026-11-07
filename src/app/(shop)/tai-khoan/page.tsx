import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, BookOpen, Check, LogOut, Package, QrCode, Repeat2, ShoppingBag, Sparkles, Timer } from 'lucide-react'
import { redirect } from 'next/navigation'
import { DEMO_ORDERS } from '@/lib/demo'
import { isDemo } from '@/lib/env'
import { ORDER_STATUS, TRADEIN_STATUS } from '@/lib/labels'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime, formatVND } from '@/lib/utils'
import type { OrderStatus, TradeinStatus } from '@/lib/types'
import '@/components/shop/account-v14.css'

export const metadata: Metadata = { title: 'Tài khoản', robots: { index: false } }

type Row = { code: string; access_token: string; status: OrderStatus; kind: string; fulfillment: string | null; total: number; amount_due: number; created_at: string }
type Tradein = { code: string; status: TradeinStatus; quoted_total: number | null; created_at: string }

const SPENT: OrderStatus[] = ['paid', 'packing', 'shipping', 'ready_pickup', 'completed']
const STEPS = (pickup: boolean) => [
  { key: 'pending_payment', label: 'Đặt hàng' },
  { key: 'paid', label: 'Đã thanh toán' },
  { key: 'packing', label: 'Đóng gói' },
  { key: pickup ? 'ready_pickup' : 'shipping', label: pickup ? 'Chờ nhận' : 'Đang giao' },
  { key: 'completed', label: 'Hoàn tất' }
] as const
const ORDER_FLOW: OrderStatus[] = ['pending_payment', 'paid', 'packing', 'shipping', 'completed']

/** Gọn cho ô thống kê trên thẻ: 5,54 tr · 540 k. */
function compactVND(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tr`
  if (value >= 1_000) return `${Math.round(value / 1_000)} k`
  return String(value)
}

function stepIndex(status: OrderStatus) {
  if (status === 'ready_pickup') return 3
  return ORDER_FLOW.indexOf(status)
}

/** V14.31: tài khoản dạng "thẻ Trainer": thẻ hồ sơ có viền holo, số liệu sưu tầm, lối tắt, đơn hàng có thanh tiến trình. */
export default async function AccountPage() {
  let email = 'khach@demo.vn'
  let name = ''
  let avatar = ''
  let userId = 'demo0000'
  let orders: Row[] = DEMO_ORDERS.filter((o) => o.channel === 'online') as unknown as Row[]
  let tradeins: Tradein[] = []
  if (!isDemo) {
    const user = await getCurrentUser()
    if (!user) redirect('/dang-nhap')
    email = user.email
    userId = user.id
    const sb = await createClient()
    const [o, t, claims] = await Promise.all([
      sb.from('orders').select('code,access_token,status,kind,fulfillment,total,amount_due,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      sb.from('tradein_requests').select('code,status,quoted_total,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      sb.auth.getClaims()
    ])
    orders = (o.data ?? []) as Row[]
    tradeins = (t.data ?? []) as Tradein[]
    const meta = (claims.data?.claims?.user_metadata ?? {}) as Record<string, unknown>
    name = String(meta.full_name ?? meta.name ?? '').trim()
    const picture = String(meta.avatar_url ?? meta.picture ?? '')
    avatar = /^https:\/\//.test(picture) ? picture : ''
  }

  const handle = email.split('@')[0] ?? ''
  const display = name || (handle ? handle.charAt(0).toUpperCase() + handle.slice(1) : 'Trainer')
  const first = name ? name.split(/\s+/).slice(-1)[0] : display
  const initials = (name ? name.split(/\s+/).filter(Boolean).slice(-2).map((p) => p[0]).join('') : display.slice(0, 2)).toUpperCase()
  const trainerId = `DP-${userId.replace(/-/g, '').slice(0, 6).toUpperCase()}`
  const active = orders.filter((o) => o.status !== 'cancelled')
  const spent = orders.filter((o) => SPENT.includes(o.status)).reduce((sum, o) => sum + Number(o.total || 0), 0)
  const waiting = orders.filter((o) => o.status === 'pending_payment')

  return (
    <div className="ac-page">
      <section className="ac-hero" aria-labelledby="ac-title">
        <div className="ac-hero-bg" aria-hidden="true"><i /><i /><i /></div>
        <div className="shop-container ac-hero-inner">
          <div className="ac-card-wrap">
            <article className="ac-card" aria-label="Thẻ thành viên Dark Poke">
              <div className="ac-card-face">
                <div className="ac-card-top"><span>Trainer</span><span className="ac-card-id">{trainerId}</span></div>
                <div className="ac-card-portrait">
                  {avatar
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={avatar} alt="" referrerPolicy="no-referrer" width={96} height={96} />
                    : <span aria-hidden="true">{initials}</span>}
                </div>
                <div className="ac-card-name"><b>{display}</b><small>{email}</small></div>
                <dl className="ac-card-stats">
                  <div><dt>Đơn hàng</dt><dd>{active.length}</dd></div>
                  <div><dt>Thu mua</dt><dd>{tradeins.length}</dd></div>
                  <div><dt>Đã mua</dt><dd title={formatVND(spent)}>{compactVND(spent)}<small>₫</small></dd></div>
                </dl>
                <div className="ac-card-foot"><span>Dark Poke</span><span>Hunt · Trade · Collect</span></div>
              </div>
            </article>
          </div>

          <div className="ac-hero-copy">
            <span className="shop-eyebrow">Hồ sơ của bạn</span>
            <h1 id="ac-title" className="ac-title">Chào {first},<br /><em>hôm nay săn gì?</em></h1>
            <p className="ac-lead">{waiting.length
              ? <>Bạn có <b>{waiting.length} đơn chờ thanh toán</b>. Quét mã VietQR trong đơn để shop giữ hàng cho bạn.</>
              : active.length ? 'Theo dõi đơn hàng, yêu cầu thu mua và tiếp tục hoàn thiện bộ sưu tập.' : 'Bộ sưu tập của bạn bắt đầu từ đây. Chọn một hộp mới, đặt trước bộ sắp ra hoặc gửi thẻ để thu mua.'}</p>
            <nav className="ac-quick" aria-label="Lối tắt">
              <Link href="/san-pham" className="ac-quick-item"><ShoppingBag size={19} aria-hidden="true" /><span><b>Mua sắm</b><small>Sealed, thẻ lẻ, grading</small></span></Link>
              <Link href="/pre-order" className="ac-quick-item"><Timer size={19} aria-hidden="true" /><span><b>Pre-order</b><small>Giữ suất bộ sắp ra</small></span></Link>
              <Link href="/thu-mua" className="ac-quick-item"><Repeat2 size={19} aria-hidden="true" /><span><b>Thu mua thẻ</b><small>Gửi ảnh, nhận báo giá</small></span></Link>
              <Link href="/thu-vien-the" className="ac-quick-item"><BookOpen size={19} aria-hidden="true" /><span><b>Thư viện thẻ</b><small>Tra cứu và xem giá</small></span></Link>
            </nav>
            <form action="/auth/signout" method="post" className="ac-signout">
              <button type="submit"><LogOut size={15} aria-hidden="true" />Đăng xuất</button>
            </form>
          </div>
        </div>
      </section>

      <div className="shop-container ac-body">
        <section aria-labelledby="ac-orders">
          <div className="ac-section-head">
            <h2 id="ac-orders"><Package size={20} aria-hidden="true" />Đơn hàng của bạn{orders.length ? <span>{orders.length}</span> : null}</h2>
            <Link href="/san-pham" className="shop-section-link">Khám phá thêm<ArrowUpRight size={15} aria-hidden="true" /></Link>
          </div>
          {orders.length ? <ul className="ac-orders">
            {orders.map((o) => {
              const s = ORDER_STATUS[o.status]
              const href = `/don-hang/${o.code}?t=${o.access_token}`
              const steps = STEPS(o.fulfillment === 'pickup')
              const at = stepIndex(o.status)
              return <li key={o.code} className={`ac-order ${o.status === 'pending_payment' ? 'is-due' : ''}`}>
                <div className="ac-order-top">
                  <div className="ac-order-id"><b>{o.code}</b><small>{formatDateTime(o.created_at)}</small></div>
                  <div className="ac-order-tags">
                    <span className={`pill pill-${s.tone}`}>{s.label}</span>
                    {o.kind === 'preorder' ? <span className="pill pill-brand">Pre-order</span> : null}
                  </div>
                  <strong className="ac-order-total">{formatVND(o.total)}</strong>
                </div>
                {o.status === 'cancelled' ? null : <ol className="ac-track" aria-label={`Tiến trình đơn ${o.code}: ${s.label}`}>
                  {steps.map((step, i) => <li key={step.key} className={i < at ? 'is-done' : i === at ? 'is-now' : ''}>
                    <span aria-hidden="true">{i < at ? <Check size={12} strokeWidth={3} /> : null}</span><small>{step.label}</small>
                  </li>)}
                </ol>}
                <div className="ac-order-actions">
                  {o.status === 'pending_payment'
                    ? <Link href={href} className="btn btn-primary"><QrCode size={16} aria-hidden="true" />Thanh toán {formatVND(o.amount_due || o.total)}</Link>
                    : null}
                  <Link href={href} className={o.status === 'pending_payment' ? 'ac-link' : 'btn btn-secondary'}>Xem chi tiết<ArrowRight size={15} aria-hidden="true" /></Link>
                </div>
              </li>
            })}
          </ul> : <div className="ac-empty">
            <div className="ac-empty-art" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/art/box1.svg" alt="" /><img src="/art/pack1.svg" alt="" /><img src="/art/card1.svg" alt="" />
            </div>
            <div><h3>Chưa có đơn hàng nào</h3><p>Hộp đầu tiên luôn đáng nhớ. Xem hàng mới về hoặc đặt trước bộ sắp phát hành.</p></div>
            <div className="ac-empty-actions"><Link href="/san-pham" className="btn btn-primary"><Sparkles size={16} aria-hidden="true" />Mua sắm ngay</Link><Link href="/pre-order" className="btn btn-secondary">Xem pre-order</Link></div>
          </div>}
        </section>

        <section aria-labelledby="ac-tradeins">
          <div className="ac-section-head">
            <h2 id="ac-tradeins"><Repeat2 size={20} aria-hidden="true" />Yêu cầu thu mua{tradeins.length ? <span>{tradeins.length}</span> : null}</h2>
          </div>
          {tradeins.length ? <ul className="ac-orders">
            {tradeins.map((t) => <li key={t.code} className="ac-order">
              <div className="ac-order-top">
                <div className="ac-order-id"><b>{t.code}</b><small>{formatDateTime(t.created_at)}</small></div>
                <div className="ac-order-tags"><span className={`pill pill-${TRADEIN_STATUS[t.status].tone}`}>{TRADEIN_STATUS[t.status].label}</span></div>
                <strong className="ac-order-total">{t.quoted_total ? formatVND(t.quoted_total) : <span className="ac-muted">Chờ báo giá</span>}</strong>
              </div>
            </li>)}
          </ul> : <div className="ac-empty ac-empty-trade">
            <div className="ac-empty-art" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/art/card2.svg" alt="" /><img src="/art/slab1.svg" alt="" /><img src="/art/card3.svg" alt="" />
            </div>
            <div><h3>Có thẻ muốn bán hoặc đổi?</h3><p>Gửi ảnh và tình trạng thẻ, Dark Poke báo giá cho bạn.</p></div>
            <div className="ac-empty-actions"><Link href="/thu-mua" className="btn btn-primary"><Repeat2 size={16} aria-hidden="true" />Gửi yêu cầu thu mua</Link></div>
          </div>}
        </section>
      </div>
    </div>
  )
}
