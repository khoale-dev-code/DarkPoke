import type { ReactNode } from 'react'
import Link from 'next/link'
import { Filters } from '@/components/shop/filters'
import { ProductGrid } from '@/components/shop/product-grid'
import { getCatalogMeta, getSettings, listProducts, type ProductQuery } from '@/lib/catalog'
import { queryString } from '@/lib/query'
import '@/components/shop/catalog-v14.css'

interface Props { basePath: string; query: ProductQuery; title: string; subtitle?: string; showTypes?: boolean; autoFocus?: boolean; crumbs?: ReactNode }

/** V14.21 catalog page (Tất cả sản phẩm, danh mục, pre-order), design option A: compact light header, one toolbar, underlined tabs. */
export async function CatalogView({ basePath, query, title, subtitle, showTypes, autoFocus, crumbs }: Props) {
  const [meta, settings, first] = await Promise.all([getCatalogMeta(), getSettings(), listProducts({ ...query, limit: 12 })])
  const names = Object.fromEntries(meta.types.map((t) => [t.id, t.name]))
  const qs = queryString(query)
  const count = first.nextCursor ? `${first.items.length}+` : String(first.items.length)

  return <div className="shop-container ct">
    <div className="ct-crumbs">{crumbs ?? <nav className="shop-breadcrumb" aria-label="Đường dẫn"><Link href="/">Trang chủ</Link><span aria-hidden="true">/</span><span aria-current="page">{title}</span></nav>}</div>
    <header className="ct-head">
      <div className="ct-copy">
        <h1 className="ct-title">{title}</h1>
        <p className="ct-sub">{subtitle ?? 'Sealed, thẻ lẻ, thẻ grading và phụ kiện cho bộ sưu tập của bạn.'}</p>
      </div>
      <p className="ct-count"><b>{count}</b> sản phẩm</p>
    </header>
    <Filters key={`filters:${qs}`} basePath={basePath} query={query} types={meta.types} attributes={meta.attributes} showTypes={showTypes} autoFocus={autoFocus} preorderLink={settings.modules.preorder && !query.preorder} />
    <ProductGrid key={`products:${qs}`} query={qs} initial={first} typeNames={names} />
  </div>
}
