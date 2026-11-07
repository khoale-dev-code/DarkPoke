import Link from 'next/link'
import Form from 'next/form'
import { adminPage } from '@/lib/admin-query'
import { ChevronRight } from 'lucide-react'
import { Empty, PageHeader, Pager, Pill, SearchForm, Section, Tabs } from '@/components/admin/ui'
import { ADMIN_PAGE, listOrders } from '@/lib/admin-data'
import { ORDER_STATUS } from '@/lib/labels'
import { formatDateTime, formatVND } from '@/lib/utils'
import type { OrderStatus } from '@/lib/types'

export const metadata = { title: 'Đơn hàng' }

type SP = Promise<{ status?: string; q?: string; page?: string; channel?: string; sort?: string }>

export default async function OrdersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const status = (sp.status && Object.hasOwn(ORDER_STATUS,sp.status) ? sp.status : 'all') as OrderStatus | 'all'
  const channel = sp.channel === 'pos' || sp.channel === 'online' ? sp.channel : undefined
  const page = adminPage(sp.page)
  const sort = sp.sort === 'oldest' || sp.sort === 'total-desc' ? sp.sort : 'newest'
  const { rows, count, counts } = await listOrders({ status, q: sp.q, page, channel, sort })
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const m = { status: status === 'all' ? undefined : status, q: sp.q, channel, sort, ...patch }
    for (const [k, v] of Object.entries(m)) if (v) p.set(k, v)
    const s = p.toString()
    return s ? `/admin/don-hang?${s}` : '/admin/don-hang'
  }
  return (
    <>
      <PageHeader title="Đơn hàng" subtitle={`${counts.all ?? 0} đơn hàng · xử lý thanh toán, đóng gói và giao nhận`} />
      <Tabs items={[
        { href: link({ status: undefined, page: undefined }), label: 'Tất cả', count: counts.all, on: status === 'all' },
        ...(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => ({ href: link({ status: s, page: undefined }), label: ORDER_STATUS[s].label, count: counts[s] ?? 0, on: status === s }))
      ]} />
      <div className="admin-filterbar">
        <SearchForm placeholder="Mã đơn, số điện thoại, tên khách" defaultValue={sp.q} hidden={{ ...(status !== 'all' ? {status} : {}), ...(channel ? {channel} : {}), sort }} />
        <div className="scroll-x max-w-full">
          <Link href={link({ channel: undefined, page: undefined })} className={`chip ${!channel ? 'is-on' : ''}`}>Mọi kênh</Link>
          <Link href={link({ channel: 'online', page: undefined })} className={`chip ${channel === 'online' ? 'is-on' : ''}`}>Online</Link>
          <Link href={link({ channel: 'pos', page: undefined })} className={`chip ${channel === 'pos' ? 'is-on' : ''}`}>Tại quầy</Link>
        </div>
      </div>
      <Form action="" className="flex flex-wrap items-center gap-2">
        {Object.entries({q:sp.q,status:status === 'all' ? undefined : status,channel}).filter(([,v]) => v).map(([k,v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <label htmlFor="order-sort" className="text-xs text-muted">Sắp xếp</label>
        <select id="order-sort" name="sort" defaultValue={sort} className="input !w-auto !text-sm"><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="total-desc">Giá trị cao nhất</option></select>
        <button className="btn btn-secondary btn-sm" type="submit">Áp dụng</button>
        {sp.q || status !== 'all' || channel ? <Link href="/admin/don-hang" className="btn btn-ghost btn-sm">Xóa bộ lọc</Link> : null}
      </Form>
      <Section title="Danh sách đơn hàng" bodyClass="">
        {rows.length === 0 ? (
          <Empty title="Chưa có đơn phù hợp" text="Thử đổi trạng thái hoặc từ khóa tìm kiếm." />
        ) : (
          <>
            {/* Máy tính: bảng */}
            <div className="table-wrap admin-desktop-only">
              <table className="tbl">
                <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Thời gian</th><th>Trạng thái</th><th className="num">Tổng tiền</th><th /></tr></thead>
                <tbody>
                  {rows.map((o) => (
                    <tr key={o.id} className="hover:bg-surface">
                      <td><Link href={`/admin/don-hang/${o.code}`} className="code font-bold hover:underline">{o.code}</Link>{o.kind === 'preorder' ? <span className="ml-2"><Pill tone="brand">Pre-order</Pill></span> : null}</td>
                      <td><span className="font-semibold">{o.customer_name}</span><br /><span className="text-muted">{o.phone}</span></td>
                      <td className="text-muted">{formatDateTime(o.created_at)}</td>
                      <td><span className="flex flex-wrap gap-1"><Pill tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Pill>{o.customer_confirmed_at && o.status === 'pending_payment' ? <Pill tone="brand">Khách báo đã chuyển</Pill> : null}{o.channel === 'pos' ? <Pill tone="neu">Tại quầy</Pill> : null}</span></td>
                      <td className="num font-semibold">{formatVND(o.total)}</td>
                      <td className="num"><Link href={`/admin/don-hang/${o.code}`} className="btn btn-ghost btn-sm">Xem</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Điện thoại: thẻ dễ chạm */}
            <ul className="divide-y divide-line admin-mobile-only">
              {rows.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/don-hang/${o.code}`} className="flex items-center gap-3 p-4 active:bg-surface">
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-center justify-between gap-2"><span className="code font-bold">{o.code}</span><span className="text-xs text-muted">{formatDateTime(o.created_at)}</span></span>
                      <span className="flex items-center justify-between gap-2"><span className="truncate font-semibold">{o.customer_name}</span><span className="font-bold tabular-nums">{formatVND(o.total)}</span></span>
                      <span className="flex flex-wrap gap-1"><Pill tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Pill>{o.kind === 'preorder' ? <Pill tone="brand">Pre-order</Pill> : null}</span>
                    </span>
                    <ChevronRight size={20} className="text-muted" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <Pager count={count} page={page} pages={Math.ceil(count / ADMIN_PAGE)} href={(p) => link({ page: String(p) })} />
          </>
        )}
      </Section>
    </>
  )
}
