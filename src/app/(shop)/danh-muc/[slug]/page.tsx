import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CatalogView } from '@/components/shop/catalog-view'
import { getCatalogMeta } from '@/lib/catalog'
import { parseProductQuery } from '@/lib/query'

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const meta = await getCatalogMeta()
  const c = meta.categories.find((x) => x.slug === slug)
  return c ? { title: c.name, alternates: { canonical: `/danh-muc/${slug}` } } : {}
}

export default async function CategoryPage({ params, searchParams }: Params) {
  const [{ slug }, sp, meta] = await Promise.all([params, searchParams, getCatalogMeta()])
  const cat = meta.categories.find((c) => c.slug === slug && c.visible)
  if (!cat) notFound()
  const parent = cat.parent_id ? meta.categories.find((c) => c.id === cat.parent_id) : undefined
  const children = meta.categories.filter((c) => c.parent_id === cat.id && c.visible)
  const query = { ...parseProductQuery(sp), category: slug }
  return (
    <CatalogView
      basePath={`/danh-muc/${slug}`}
      query={query}
      title={cat.name}
      crumbs={
        <div className="flex flex-col gap-3">
          <nav className="shop-breadcrumb" aria-label="Đường dẫn">
            <Link href="/" className="hover:text-ink">Trang chủ</Link>/
            {parent ? (<><Link href={`/danh-muc/${parent.slug}`} className="hover:text-ink">{parent.name}</Link>/</>) : null}
            <span className="text-ink">{cat.name}</span>
          </nav>
          {children.length ? (
            <div className="scroll-x -mx-4 px-4 sm:mx-0 sm:px-0">
              {children.map((c) => (
                <Link key={c.id} href={`/danh-muc/${c.slug}`} className="chip">{c.name}</Link>
              ))}
            </div>
          ) : null}
        </div>
      }
    />
  )
}
