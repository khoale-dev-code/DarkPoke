import '@/components/shop/anime-client-v13.css'
import { AnimeClientShell } from '@/components/shop/anime-client-shell'
import '@/components/shop/shop.css'
import { SiteHeader } from '@/components/shop/header'
import { SiteFooter } from '@/components/shop/footer'
import { MobileTabs } from '@/components/shop/mobile-tabs'
import { getCatalogMeta,getSettings } from '@/lib/catalog'
export default async function ShopLayout({children}:{children:React.ReactNode}) {const [meta,settings]=await Promise.all([getCatalogMeta(),getSettings()]);return <AnimeClientShell><a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-brand focus:px-4 focus:py-3 focus:text-white">Đến nội dung chính</a><SiteHeader categories={meta.categories} modules={settings.modules}/><main id="main">{children}</main><SiteFooter settings={settings} categories={meta.categories}/><MobileTabs/></AnimeClientShell>}
