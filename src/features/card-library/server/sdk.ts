import 'server-only'
import TCGdex from '@tcgdex/sdk'
import type { CardLanguage } from '../domain'

/** The SDK's documented fetch hook is confined to TCGdex; global fetch is unchanged. */
TCGdex.fetch=async(input,init)=>{
  const url=new URL(input instanceof Request?input.url:String(input))
  if(url.protocol!=='https:'||url.hostname!=='api.tcgdex.net'||!url.pathname.startsWith('/v2/'))throw new Error('TCGDEX_ENDPOINT')
  const response=await fetch(input,{...init,signal:AbortSignal.timeout(8000),cache:'no-store'})
  if(response.status!==200&&response.status!==404)throw new Error(`TCGDEX_HTTP_${response.status}`)
  return response
}
export function createCardSdk(lang:CardLanguage) {return new TCGdex(lang)}
