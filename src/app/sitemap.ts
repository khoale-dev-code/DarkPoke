import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/env'
import { getCatalogMeta, getFeaturedSlugs } from '@/lib/catalog'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [meta, slugs] = await Promise.all([getCatalogMeta(), getFeaturedSlugs(5000)])
  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/san-pham`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/pre-order`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/thu-mua`, changeFrequency: 'monthly', priority: 0.5 },
    ...meta.categories.filter((c) => c.visible).map((c) => ({ url: `${SITE_URL}/danh-muc/${c.slug}`, changeFrequency: 'daily' as const, priority: 0.8 })),
    ...slugs.map((s) => ({ url: `${SITE_URL}/san-pham/${s}`, changeFrequency: 'weekly' as const, priority: 0.7 }))
  ]
}
