import 'server-only'
import { getCatalogMeta, getSettings, listProducts } from '@/lib/catalog'
import type { ProductCard } from '@/lib/types'

function unique(items: ProductCard[]) {
  return [...new Map(items.map(product => [product.id, product])).values()]
}

/** Bounded, cached reads only: three short lists, never the full catalogue. */
export async function getHomeData() {
  const [meta, settings] = await Promise.all([getCatalogMeta(), getSettings()])
  const [featured, recent, preorders] = await Promise.all([
    listProducts({ featured: true, limit: 12 }),
    listProducts({ limit: 24 }),
    settings.modules.preorder ? listProducts({ preorder: true, limit: 10 }) : Promise.resolve({ items: [] })
  ])
  const products = unique(featured.items.length ? featured.items : recent.items).slice(0, 12)
  const ids = new Set(products.map(product => product.id))
  const types = [...new Map(meta.types.filter(type => type.code !== 'hang-thuong').map(type => [type.id, type])).values()].slice(0, 4)
  return {
    settings, types, products,
    typeNames: Object.fromEntries(meta.types.map(type => [type.id, type.name])),
    preorders: unique(preorders.items).slice(0, 10),
    latest: unique(recent.items).filter(product => !ids.has(product.id)).slice(0, 12),
    accessoriesHref: meta.types.some(type => type.code === 'phu-kien') ? '/san-pham?type=phu-kien' : '/san-pham'
  }
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>
