import { TradeinAttachments } from '@/features/tradein/components/admin-attachments'
import { conditionLabel } from '@/features/tradein/domain'
import { Empty, PageHeader, Pager, Pill, Section, Tabs } from '@/components/admin/ui'
import { TradeinEditor } from '@/components/admin/tradein-editor'
import { ADMIN_PAGE, listTradeins } from '@/lib/admin-data'
import { TRADEIN_STATUS } from '@/lib/labels'
import { formatDateTime, formatVND } from '@/lib/utils'
import { adminPage } from '@/lib/admin-query'
import type { TradeinStatus } from '@/lib/types'

export const metadata = { title: 'Thu mua' }

export default async function TradeinAdminPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const sp = await searchParams
  const status = sp.status && Object.hasOwn(TRADEIN_STATUS,sp.status) ? (sp.status as TradeinStatus) : undefined
  const page = adminPage(sp.page)
  const { rows,count } = await listTradeins(status,page)
  return (
    <>
      <PageHeader title="Thu mua và trade-in" subtitle={`${count} yêu cầu · báo giá, nhận hàng và thanh toán cho khách bán thẻ`} />
      <Tabs items={[{ href: '/admin/thu-mua', label: 'Tất cả', on: !status }, ...(Object.keys(TRADEIN_STATUS) as TradeinStatus[]).map((s) => ({ href: `/admin/thu-mua?status=${s}`, label: TRADEIN_STATUS[s].label, on: status === s }))]} />
      {rows.length === 0 ? <Section><Empty title="Chưa có yêu cầu phù hợp" text="Chọn một trạng thái khác để xem yêu cầu thu mua." /></Section> : rows.map((t) => (
        <Section key={t.id} title={`${t.code} · ${t.customer_name}`} action={<Pill tone={TRADEIN_STATUS[t.status].tone}>{TRADEIN_STATUS[t.status].label}</Pill>}>
          <p className="text-sm text-muted">{t.phone}{t.email ? ` · ${t.email}` : ''} · {formatDateTime(t.created_at)} · {t.method === 'store' ? 'Mang tới shop' : 'Gửi bưu điện'} · nhận {t.payout === 'cash' ? 'tiền' : 'tín dụng'}</p>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {t.items.map((i, k) => (
              <li key={k} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                <b className="flex-1">{i.name}</b>
                {i.condition ? <Pill tone="neu">{conditionLabel(i.condition)}</Pill> : null}
                {i.condition_note ? <p className="basis-full break-words text-sm text-muted">Tình trạng khách mô tả: {i.condition_note}</p> : null}
                <span className="text-muted">SL {i.qty ?? 1}</span>
                {i.expected ? <span className="text-muted">Khách mong {formatVND(i.expected)}</span> : null}
              </li>
            ))}
          </ul>
          {t.note ? <p className="text-sm">Ghi chú khách: {t.note}</p> : null}
          <TradeinAttachments photos={t.photos} />
          <TradeinEditor t={t} />
        </Section>
      ))}
      <Pager count={count} page={page} pages={Math.ceil(count/ADMIN_PAGE)} href={(p)=>`/admin/thu-mua?page=${p}${status ? `&status=${status}` : ''}`} />
    </>
  )
}
