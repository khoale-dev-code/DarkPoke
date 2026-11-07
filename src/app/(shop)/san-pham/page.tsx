import type { Metadata } from 'next'
import { CatalogView } from '@/components/shop/catalog-view'
import { parseProductQuery } from '@/lib/query'

export const metadata: Metadata = { title: 'Tất cả sản phẩm', alternates: { canonical: '/san-pham' } }

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const query = parseProductQuery(sp)
  const title = query.q ? `Kết quả cho “${query.q}”` : 'Tất cả sản phẩm'
  return <CatalogView basePath="/san-pham" query={query} title={title} autoFocus={sp.focus === 'search'} />
}
