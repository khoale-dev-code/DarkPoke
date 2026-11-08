import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
const inter=localFont({src:'../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',variable:'--font-inter',weight:'400 750',display:'swap',adjustFontFallback:false})
const interVi=localFont({src:'../../node_modules/@fontsource-variable/inter/files/inter-vietnamese-wght-normal.woff2',variable:'--font-inter-vi',weight:'400 750',display:'swap',adjustFontFallback:false})
const display=localFont({src:'../../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2',variable:'--font-bricolage',weight:'400 800',display:'swap',adjustFontFallback:false,preload:false})
const displayVi=localFont({src:'../../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-vietnamese-wght-normal.woff2',variable:'--font-bricolage-vi',weight:'400 800',display:'swap',adjustFontFallback:false,preload:false})
const mono=localFont({src:'../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',variable:'--font-jetbrains',weight:'400 600',display:'swap',adjustFontFallback:false,preload:false})
import './globals.css'
import { Providers } from '@/components/providers'
import { SITE_URL } from '@/lib/env'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Dark Poke · Thẻ bài TCG chính hãng', template: '%s · Dark Poke' },
  description: 'Dark Poke: săn thẻ, trao đổi, sưu tầm. Booster box, thẻ lẻ, thẻ grading Pokémon TCG, One Piece TCG, Riftbound. Pre-order có đặt cọc, thu mua thẻ.',
  applicationName: 'Dark Poke',
  icons: { icon: '/brand/icon-192.png', apple: '/brand/apple-touch-icon.png' },
  openGraph: { type: 'website', siteName: 'Dark Poke', locale: 'vi_VN', images: ['/brand/og.png'] }
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} ${interVi.variable} ${display.variable} ${displayVi.variable} ${mono.variable}`}>
        <Providers>{children}</Providers>
        {process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' ? <><Analytics /><SpeedInsights /></> : null}
      </body>
    </html>
  )
}
