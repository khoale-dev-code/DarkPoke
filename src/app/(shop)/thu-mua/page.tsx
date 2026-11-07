import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TradeinForm } from '@/components/shop/tradein-form'
import { getSettings } from '@/lib/catalog'
export const metadata: Metadata = { title: 'Thu mua thẻ & vật phẩm', description: 'Gửi tình trạng và ảnh thực tế của vật phẩm để Dark Poke xem và báo giá thu mua.' }
export default async function TradeinPage() {
  const settings = await getSettings()
  if (!settings.modules.tradein) notFound()
  return <TradeinForm quoteHours={settings.rules.tradein_quote_hours}/>
}
