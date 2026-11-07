import 'server-only'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { Query } from '@tcgdex/sdk'
import { z } from 'zod'
import { CARD_ID, PAGE_SIZE, cardImageUrl, serieFromLogo, type CardLanguage, type LibraryCard, type LibraryDetail, type LibraryPage, type LibraryQuery, type LibrarySet } from '../domain'
import { createCardSdk } from './sdk'
import { briefSchema, detailSchema, setSchema } from './schema'
import { parseTcgdexPricing } from './tcgdex-pricing'

export function buildCardQuery(query:LibraryQuery,page=query.page,size=PAGE_SIZE) {
  const filter=Query.create().paginate(page,size)
  if(query.q)filter.contains('name',`like:${query.q}`)
  if(query.set)filter.equal('set.id',query.set)
  const field=query.sort==='name_asc'?'name':query.sort==='number_asc'?'localId':'id'
  return filter.sort(field,query.sort==='id_desc'?'DESC':'ASC')
}
function toBrief(input:z.infer<typeof briefSchema>):LibraryCard {
  const separator=input.id.lastIndexOf('-')
  return {id:input.id,name:input.name,localId:input.localId,image:cardImageUrl(input.image,'low'),setId:separator>0?input.id.slice(0,separator):''}
}
class MissingCard extends Error {}
const cardCached=unstable_cache(async(lang:CardLanguage,id:string):Promise<LibraryDetail>=>{
  const card=await createCardSdk(lang).card.get(id)
  if(!card)throw new MissingCard('TCGDEX_CARD_NOT_FOUND')
  const {pricing,...parsed}=detailSchema.parse(card)
  return {...parsed,imageLow:cardImageUrl(parsed.image,'low'),imageHigh:cardImageUrl(parsed.image,'high'),market:parseTcgdexPricing(pricing)}
},['tcgdex-v6-card'],{revalidate:3600,tags:['tcgdex-cards','tcgdex-prices']})
export const getLibraryCard=cache(async(lang:CardLanguage,id:string):Promise<LibraryDetail|null>=>{
  if(!CARD_ID.test(id))return null
  try{return await cardCached(lang,id)}catch(error){if(error instanceof MissingCard)return null;throw error}
})
export const getLibrarySets=unstable_cache(async(lang:CardLanguage):Promise<LibrarySet[]>=>{
  const sdk=createCardSdk(lang)
  const data=await sdk.set.list(Query.create().sort('releaseDate','DESC').paginate(1,500))
  return z.array(setSchema).max(500).parse(data).map(s=>({id:s.id,name:s.name,serie:serieFromLogo(s.logo,s.id)}))
},['tcgdex-v5-sets'],{revalidate:86400,tags:['tcgdex-sets']})
export const getLibraryPage=unstable_cache(async(query:LibraryQuery):Promise<LibraryPage>=>{
  if(query.by==='id'&&query.q){
    const card=await getLibraryCard(query.lang,query.q)
    const items=card&&(!query.set||card.set.id===query.set)?[toBrief(card)]:[]
    return {items,page:1,hasNext:false}
  }
  const sdk=createCardSdk(query.lang)
  // One bounded page + one lookahead record; never fetch the full card database.
  const [data,next]=await Promise.all([
    sdk.card.list(buildCardQuery(query)),
    sdk.card.list(buildCardQuery(query,query.page*PAGE_SIZE+1,1))
  ])
  const rows=z.array(briefSchema).max(PAGE_SIZE).parse(data)
  const sentinel=z.array(briefSchema).max(1).parse(next)
  const items=[...new Map(rows.map(c=>[c.id,toBrief(c)])).values()]
  return {items,page:query.page,hasNext:sentinel.length>0&&query.page<5000}
},['tcgdex-v4-page'],{revalidate:600,tags:['tcgdex-cards']})
