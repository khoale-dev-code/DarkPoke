import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CatalogView } from '@/components/shop/catalog-view'
import { getSettings } from '@/lib/catalog'
import { parseProductQuery } from '@/lib/query'

export const metadata: Metadata = { title: 'Pre-order', description: 'Đặt trước hàng sắp phát hành, cọc một phần, trả phần còn lại khi hàng về.' }

export default async function PreorderPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [sp, settings] = await Promise.all([searchParams, getSettings()])
  if(!settings.modules.preorder)notFound()
  const r = settings.rules
  return (
    <CatalogView
      basePath="/pre-order"
      query={{ ...parseProductQuery(sp), preorder: true }}
      title="Pre-order"
      subtitle={`Đặt cọc theo tỷ lệ của từng sản phẩm (mặc định ${r.preorder_deposit_pct}%) để giữ suất. Khi hàng về, thanh toán phần còn lại trong ${r.preorder_balance_days} ngày.`}
    />
  )
}
