import Link from 'next/link'
import { AlertTriangle, ArrowRight, ArrowUpRight, CalendarDays, Clock3, CreditCard, PackageCheck, Plus, Receipt, Repeat2, Store, Wallet } from 'lucide-react'
import { PageHeader, Pill, Section } from '@/components/admin/ui'
import { RevenueChart } from '@/components/admin/revenue-chart'
import { getDashboard, listRecentOrders } from '@/lib/admin-data'
import { getSettings } from '@/lib/catalog'
import { canManage, requireStaff } from '@/lib/auth'
import { ORDER_STATUS } from '@/lib/labels'
import { formatDateTime, formatVND } from '@/lib/utils'
export const metadata={title:'Tổng quan'}
export default async function DashboardPage() {
  const [d,recent,me,settings]=await Promise.all([getDashboard(),listRecentOrders(),requireStaff(),getSettings()])
  const date=new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date())
  const tasks=[
    {n:d.pending_payment,label:'Chờ thanh toán',sub:'Kiểm tra tiền về trước khi duyệt',href:'/admin/don-hang?status=pending_payment',icon:Clock3},
    {n:d.to_pack,label:'Cần đóng gói',sub:'Đơn đã thanh toán, sẵn sàng xử lý',href:'/admin/don-hang?status=paid',icon:PackageCheck},
    ...(settings.modules.tradein ? [{n:d.tradein_new,label:'Thu mua mới',sub:'Xem hàng và gửi báo giá cho khách',href:'/admin/thu-mua?status=new',icon:Repeat2}] : []),
    {n:d.low_stock,label:'Sắp hết hàng',sub:'Kiểm tra và bổ sung hàng vào kho',href:'/admin/san-pham?low=1',icon:AlertTriangle}
  ]
  return <><PageHeader title="Tổng quan cửa hàng" subtitle="Theo dõi bán hàng và bắt đầu từ những việc cần xử lý." actions={<><span className="btn btn-secondary pointer-events-none !text-xs"><CalendarDays size={16} aria-hidden="true" />{date}</span>{canManage(me) ? <Link href="/admin/san-pham/moi" className="btn btn-primary"><Plus size={17} aria-hidden="true" />Thêm sản phẩm</Link> : null}</>} />
    <div className="admin-stat-grid">{[
      {label:'Doanh thu hôm nay',value:formatVND(d.revenue_today),sub:'Đơn đã thanh toán, theo ngày tạo',icon:Wallet,primary:true},
      {label:'Đơn hàng hôm nay',value:d.orders_today.toLocaleString('vi-VN'),sub:'Từ 00:00 đến hiện tại · giờ Việt Nam',icon:Receipt},
      {label:'Chờ thanh toán',value:d.pending_payment.toLocaleString('vi-VN'),sub:'Toàn bộ đơn đang chờ xác nhận tiền',icon:CreditCard},
      {label:'Chờ đóng gói',value:d.to_pack.toLocaleString('vi-VN'),sub:'Đơn đã thanh toán cần chuẩn bị',icon:PackageCheck}
    ].map((s) => <div key={s.label} className={`card admin-stat ${s.primary ? 'admin-stat-primary' : ''}`}><span className="admin-stat-label">{s.label}<s.icon size={19} strokeWidth={1.6} aria-hidden="true" /></span><strong>{s.value}</strong><small>{s.sub}</small></div>)}</div>
    <Section title="Cần xử lý" action={<span className="text-xs text-muted">Ưu tiên công việc đang chờ</span>} bodyClass="admin-task-grid">{tasks.map((t) => <Link href={t.href} key={t.label} className="admin-task"><div className="flex items-center justify-between"><t.icon size={18} strokeWidth={1.6} className="text-muted" aria-hidden="true" /><ArrowUpRight size={15} className="text-muted" aria-hidden="true" /></div><strong>{t.n}</strong><span>{t.label}</span><small>{t.sub}</small></Link>)}</Section>
    <Section title="Doanh thu 7 ngày" action={<span className="text-xs text-muted">Giờ Việt Nam · VND</span>}><RevenueChart data={d.revenue_7d} /></Section>
    <Section title="Đơn hàng gần đây" action={<Link href="/admin/don-hang" className="btn btn-ghost btn-sm text-brand-ink">Xem tất cả<ArrowRight size={15} aria-hidden="true" /></Link>} bodyClass="">
      {recent.length ? <><div className="admin-desktop-only table-wrap"><table className="tbl"><caption className="sr-only">Sáu đơn hàng mới nhất</caption><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Thời gian</th><th>Trạng thái</th><th className="num">Tổng tiền</th><th><span className="sr-only">Mở đơn</span></th></tr></thead><tbody>{recent.map((o) => <tr key={o.id}><td><Link className="font-mono text-xs font-semibold text-brand-ink" href={`/admin/don-hang/${o.code}`}>{o.code}</Link></td><td><b className="font-medium">{o.customer_name}</b><span className="mt-1 block text-[11px] text-muted">{o.phone}</span></td><td className="text-xs text-muted">{formatDateTime(o.created_at)}</td><td><Pill tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Pill></td><td className="num font-semibold">{formatVND(o.total)}</td><td><Link className="btn btn-ghost btn-icon" href={`/admin/don-hang/${o.code}`} aria-label={`Xem đơn ${o.code}`}><ArrowUpRight size={16} aria-hidden="true" /></Link></td></tr>)}</tbody></table></div><ul className="admin-mobile-only divide-y divide-line">{recent.map((o) => <li key={o.id}><Link href={`/admin/don-hang/${o.code}`} className="flex flex-col gap-3 p-4"><span className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-semibold text-brand-ink">{o.code}</span><Pill tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Pill></span><span className="flex flex-wrap justify-between gap-2 text-sm"><span>{o.customer_name}</span><b className="tabular-nums">{formatVND(o.total)}</b></span><span className="text-xs text-muted">{formatDateTime(o.created_at)}</span></Link></li>)}</ul></> : <p className="p-6 text-sm text-muted">Chưa có đơn hàng nào.</p>}
    </Section>
    <nav className="admin-quicklinks" aria-label="Thao tác nhanh">{settings.modules.pos ? <Link href="/pos" className="btn btn-secondary"><Store size={16} aria-hidden="true" />Mở bán tại quầy</Link> : null}<Link href="/admin/khach-hang" className="btn btn-secondary">Tra lịch sử khách hàng<ArrowUpRight size={15} aria-hidden="true" /></Link></nav>
  </>
}
