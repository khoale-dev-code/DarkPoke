import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight,LogOut,Package,Repeat2,User } from 'lucide-react'
import { redirect } from 'next/navigation'
import { DEMO_ORDERS } from '@/lib/demo'
import { isDemo } from '@/lib/env'
import { ORDER_STATUS, TRADEIN_STATUS } from '@/lib/labels'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime, formatVND } from '@/lib/utils'
import type { OrderStatus, TradeinStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'Tài khoản', robots: { index: false } }

type Row = { code: string; access_token: string; status: OrderStatus; kind: string; total: number; amount_due: number; created_at: string }

export default async function AccountPage() {
  let email = 'khach@demo.vn'
  let orders: Row[] = DEMO_ORDERS.filter((o) => o.channel === 'online')
  let tradeins: { code: string; status: TradeinStatus; quoted_total: number | null; created_at: string }[] = []
  if (!isDemo) {
    const user = await getCurrentUser()
    if (!user) redirect('/dang-nhap')
    email = user.email
    const sb = await createClient()
    const [o, t] = await Promise.all([
      sb.from('orders').select('code,access_token,status,kind,total,amount_due,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      sb.from('tradein_requests').select('code,status,quoted_total,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
    ])
    orders = (o.data ?? []) as Row[]
    tradeins = (t.data ?? []) as typeof tradeins
  }
  return (
    <div className="shop-container shop-page flex flex-col gap-8">
      <div className="shop-account-hero">
        <span className="shop-account-avatar"><User size={27} strokeWidth={1.5} aria-hidden="true" /></span><div className="flex-1">
          <span className="shop-eyebrow mb-2">Cùng Dark Poke</span><h1 className="h-page">Xin chào bạn</h1>
          <p className="mt-2 text-xs break-all text-muted">{email}</p>
        </div>
        <form action="/auth/signout" method="post">
          <button className="btn btn-secondary" type="submit"><LogOut size={15} aria-hidden="true"/>Đăng xuất</button>
        </form>
      </div>

      <section className="flex flex-col gap-3">
        <div className="shop-section-top !mb-2"><h2 className="h-card flex items-center gap-2"><Package size={19} className="text-brand" aria-hidden="true"/>Đơn hàng của bạn</h2><Link href="/san-pham" className="shop-section-link">Khám phá thêm<ArrowUpRight size={15} aria-hidden="true"/></Link></div>
        {orders.length ? (
          <ul className="card divide-y divide-line">
            {orders.map((o) => {
              const s = ORDER_STATUS[o.status]
              return (
                <li key={o.code}>
                  <Link href={`/don-hang/${o.code}?t=${o.access_token}`} className="shop-account-order">
                    <span className="shop-account-order-code"><b>{o.code}</b><small>{formatDateTime(o.created_at)}</small></span>
                    <span className={`pill pill-${s.tone}`}>{s.label}</span>
                    {o.kind === 'preorder' ? <span className="pill pill-brand">Pre-order</span> : null}
                    <span className="ml-auto text-sm font-semibold tabular-nums">{formatVND(o.total)}</span><ArrowUpRight size={17} className="text-muted" aria-hidden="true"/>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="rounded-2xl border border-line bg-surface p-6 text-sm leading-relaxed text-muted">Bạn chưa có đơn hàng nào. <Link href="/san-pham" className="font-semibold text-brand-ink">Mua sắm ngay</Link></p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="h-card mb-3 flex items-center gap-2"><Repeat2 size={19} className="text-brand" aria-hidden="true"/>Yêu cầu thu mua</h2>
        {tradeins.length ? (
          <ul className="card divide-y divide-line">
            {tradeins.map((t) => (
              <li key={t.code} className="shop-account-order">
                <span className="code font-bold">{t.code}</span>
                <span className={`pill pill-${TRADEIN_STATUS[t.status].tone}`}>{TRADEIN_STATUS[t.status].label}</span>
                <span className="text-sm text-muted">{formatDateTime(t.created_at)}</span>
                {t.quoted_total ? <span className="ml-auto font-bold tabular-nums">{formatVND(t.quoted_total)}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-line bg-surface p-6 text-sm leading-relaxed text-muted">Chưa có yêu cầu. <Link href="/thu-mua" className="font-semibold text-brand-ink">Gửi yêu cầu thu mua</Link></p>
        )}
      </section>
    </div>
  )
}
