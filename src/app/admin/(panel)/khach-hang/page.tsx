import Link from 'next/link'
import { adminPage } from '@/lib/admin-query'
import { Users, ArrowUpRight } from 'lucide-react'
import { Empty, PageHeader, Pager, Pill, SearchForm, Section } from '@/components/admin/ui'
import { ADMIN_PAGE, listCustomers } from '@/lib/admin-data'
import { formatDateTime, formatVND } from '@/lib/utils'

export const metadata = { title: 'Khách hàng' }

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams
  const page = adminPage(sp.page)
  const { rows, count } = await listCustomers(sp.q, page)
  return (
    <>
      <PageHeader title="Khách hàng" subtitle={`${count} khách hàng · tra lịch sử mua hàng bằng tên hoặc số điện thoại`} />
      <SearchForm placeholder="Tên, số điện thoại, email" defaultValue={sp.q} />
      <Section title="Danh bạ khách hàng" action={<Users size={18} className="text-muted" aria-hidden="true" />} bodyClass="">
        {rows.length === 0 ? <Empty title="Chưa có khách hàng" /> : (
          <>
            <ul className="divide-y divide-line">
              {rows.map((c) => (
                <li key={c.phone}>
                  <Link href={`/admin/don-hang?q=${encodeURIComponent(c.phone)}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface sm:px-5">
                    <span className="admin-avatar" aria-hidden="true">{c.customer_name.slice(0,1)}</span><span className="flex min-w-0 flex-[1_1_180px] flex-col"><b className="break-words">{c.customer_name}</b><span className="text-xs break-words text-muted">{c.phone}{c.email ? ` · ${c.email}` : ''}</span></span>
                    {c.has_account ? <Pill tone="brand">Có tài khoản Google</Pill> : <Pill tone="neu">Khách vãng lai</Pill>}
                    <span className="text-sm text-muted">{c.order_count} đơn · gần nhất {formatDateTime(c.last_order_at)}</span>
                    <span className="ml-auto font-bold tabular-nums">{formatVND(c.total_spent)}</span><ArrowUpRight size={16} className="text-muted" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <Pager count={count} page={page} pages={Math.ceil(count / ADMIN_PAGE)} href={(p) => `/admin/khach-hang?page=${p}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ''}`} />
          </>
        )}
      </Section>
    </>
  )
}
