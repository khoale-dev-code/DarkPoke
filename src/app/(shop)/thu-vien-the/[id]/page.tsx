import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CARD_ID, parseLibraryQuery, backHref, type LibraryDetail } from '@/features/card-library/domain'
import { getLibraryCard } from '@/features/card-library/server/data'
import { LibraryCardDetail } from '@/features/card-library/components/card-detail'
import { RefreshLibrary } from '@/features/card-library/components/refresh-button'
import { getExchangeRates } from '@/features/card-library/server/rates'
import '@/features/card-library/library.css'
interface Props {params:Promise<{id:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}
export async function generateMetadata({params,searchParams}:Props):Promise<Metadata> {
  const [{id},sp]=await Promise.all([params,searchParams]);const {lang}=parseLibraryQuery(sp)
  const card=CARD_ID.test(id)?await getLibraryCard(lang,id).catch(()=>null):null
  const market=card?.market.tcgplayer?.variants[0]?.market
  return {title:card?`${card.name} · ${card.set.name} · Thư viện thẻ`:'Chi tiết thẻ Pokémon',description:card?`${card.name} (${card.set.name} #${card.localId})${market!=null?`: giá TCGplayer tham khảo $${market.toFixed(2)}`:''}. Thông tin chi tiết, chiêu thức và giá thị trường.`:undefined,robots:{index:false,follow:true}}
}
export default async function CardDetailPage({params,searchParams}:Props) {
  const [{id},sp]=await Promise.all([params,searchParams]);if(!CARD_ID.test(id))notFound()
  const {lang}=parseLibraryQuery(sp);const from=Array.isArray(sp.from)?sp.from[0]:sp.from
  let card:LibraryDetail|null
  try {card=await getLibraryCard(lang,id)}
  catch {return <div className="shop-container dex-page"><section className="dex-empty"><h1>Chưa tải được thông tin thẻ</h1><p>TCGdex đang phản hồi chậm. Bạn có thể thử lại hoặc quay về danh sách.</p><div><RefreshLibrary/><Link href={backHref(from,lang)} className="btn btn-ghost">Quay lại thư viện</Link></div></section></div>}
  if(!card)notFound()
  return <LibraryCardDetail card={card} lang={lang} from={from} rates={await getExchangeRates()}/>
}
