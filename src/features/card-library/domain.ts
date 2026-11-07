import type { z } from 'zod'
import type { detailSchema } from './server/schema'
import type { CardMarket } from './pricing'

export const PAGE_SIZE = 24
export const CARD_ID = /^[a-zA-Z0-9](?:[a-zA-Z0-9._!?-]|%3[fF]){0,79}$/
export const SET_ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,49}$/
export const LANGUAGES = [
  {code:'en',label:'Tiếng Anh'}, {code:'ja',label:'Tiếng Nhật'},
  {code:'fr',label:'Tiếng Pháp'}, {code:'de',label:'Tiếng Đức'},
  {code:'es',label:'Tiếng Tây Ban Nha'}, {code:'it',label:'Tiếng Ý'},
  {code:'pt-br',label:'Tiếng Bồ Đào Nha (Brazil)'}, {code:'ko',label:'Tiếng Hàn'},
  {code:'zh-tw',label:'Tiếng Trung phồn thể'}, {code:'zh-cn',label:'Tiếng Trung giản thể'},
  {code:'id',label:'Tiếng Indonesia'}, {code:'th',label:'Tiếng Thái'}
] as const
export type CardLanguage = typeof LANGUAGES[number]['code']
export type LibraryQuery = {q:string;by:'name'|'id';lang:CardLanguage;set:string;sort:'id_desc'|'name_asc'|'number_asc';page:number}
type SP = Record<string,string|string[]|undefined>
export function parseLibraryQuery(input:SP|URLSearchParams):LibraryQuery {
  const get=(key:string)=>{const v=input instanceof URLSearchParams?input.get(key):input[key];return(Array.isArray(v)?v[0]:v)??''}
  const lang=get('lang');const sort=get('sort');const set=get('set');const page=Number(get('page'))
  const by=get('by')==='id'?'id':'name';const q=get('q').trim().slice(0,80)
  return {q,by,lang:LANGUAGES.some(l=>l.code===lang)?lang as CardLanguage:'en',set:SET_ID.test(set)?set:'',sort:sort==='name_asc'||sort==='number_asc'?sort:'id_desc',page:by==='id'&&q?1:Number.isSafeInteger(page)&&page>0&&page<=5000?page:1}
}
export function libraryParams(query:LibraryQuery) {
  const p=new URLSearchParams()
  if(query.q)p.set('q',query.q)
  if(query.by==='id')p.set('by','id')
  if(query.lang!=='en')p.set('lang',query.lang)
  if(query.set)p.set('set',query.set)
  if(query.sort!=='id_desc')p.set('sort',query.sort)
  if(query.page>1)p.set('page',String(query.page))
  return p
}
export function libraryHref(query:LibraryQuery) {const params=libraryParams(query).toString();return `/thu-vien-the${params?'?'+params:''}`}
export function cardHref(id:string,query:LibraryQuery) {
  const params=new URLSearchParams({lang:query.lang,from:libraryParams(query).toString()})
  return `/thu-vien-the/${encodeURIComponent(id)}?${params}`
}
export function backHref(from:string|undefined,lang:CardLanguage) {return libraryHref({...parseLibraryQuery(new URLSearchParams((from??'').slice(0,600))),lang})}
export function cardImageUrl(base:unknown,quality:'low'|'high') {
  if(typeof base!=='string')return null
  try{const url=new URL(base);if(url.protocol!=='https:'||url.hostname!=='assets.tcgdex.net'||url.port||url.search||url.hash||url.username||url.password)return null;return `${url.origin}${url.pathname.replace(/\/$/,'')}/${quality}.webp`}catch{return null}
}
export interface LibraryCard {id:string;name:string;localId:string;image:string|null;setId:string}
export interface LibrarySet {id:string;name:string;serie?:string|null}
export interface LibraryPage {items:LibraryCard[];page:number;hasNext:boolean}
export type LibraryDetail = Omit<z.infer<typeof detailSchema>,'pricing'> & {imageLow:string|null;imageHigh:string|null;market:CardMarket}
const TYPE_LABELS:Record<string,string>={Fire:'Lửa',Water:'Nước',Grass:'Cỏ',Lightning:'Điện',Electric:'Điện',Psychic:'Siêu linh',Fighting:'Đấu sĩ',Darkness:'Bóng tối',Metal:'Kim loại',Fairy:'Tiên',Dragon:'Rồng',Colorless:'Không màu'}
export const typeLabel=(value:string)=>TYPE_LABELS[value]??value
export const categoryLabel=(value:string|null|undefined)=>value==='Trainer'?'Huấn luyện viên':value==='Energy'?'Năng lượng':value??'Thẻ Pokémon TCG'

/** TCGdex logo URLs embed the serie: https://assets.tcgdex.net/en/<serie>/<set>/logo. */
export function serieFromLogo(logo:unknown,setId:string) {
  if(typeof logo!=='string')return null
  const match=/^https:\/\/assets\.tcgdex\.net\/[a-z-]+\/([a-z0-9.-]{1,30})\/([^/]{1,50})\/logo$/i.exec(logo)
  return match&&match[2]===setId?match[1]!:null
}

export interface ImageCandidate {src:string;note:string|null}
const LATIN_PRINTS=new Set<CardLanguage>(['en','fr','de','es','it','pt-br'])
/** Pokémon TCG API set ids differ from TCGdex for decimal sets: sv03.5 → sv3pt5, swsh4.5 → swsh45, sm11.5 → sm115. */
function ptcgSetId(setId:string) {
  const id=setId.toLowerCase()
  if(id==='swsh4.5')return 'swsh45'
  let m=/^(sv|swsh)0?(\d+)\.5$/.exec(id);if(m)return `${m[1]}${m[2]}pt5`
  m=/^sm(\d+)\.5$/.exec(id);if(m)return `sm${m[1]}5`
  m=/^sv0(\d)$/.exec(id);if(m)return `sv${m[1]}`
  return /^[a-z0-9]{2,12}$/.test(id)?id:null
}
/**
 * Image chain for one card: TCGdex in the chosen language, then the English print on TCGdex (same numbering
 * for Latin-alphabet languages), then the Pokémon TCG API scan. Each step is tried only if the previous fails.
 */
export function cardImageCandidates(input:{primary:string|null;localId:string;setId:string;lang:CardLanguage;serie?:string|null;quality:'low'|'high'}):ImageCandidate[] {
  const list:ImageCandidate[]=[]
  if(input.primary)list.push({src:input.primary,note:null})
  const latin=LATIN_PRINTS.has(input.lang)
  const local=encodeURIComponent(input.localId)
  if(latin&&input.lang!=='en'&&input.serie&&SET_ID.test(input.setId))
    list.push({src:`https://assets.tcgdex.net/en/${encodeURIComponent(input.serie)}/${encodeURIComponent(input.setId)}/${local}/${input.quality}.webp`,note:'Ảnh bản tiếng Anh'})
  const ptcgSet=latin?ptcgSetId(input.setId):null
  const number=/^\d+$/.test(input.localId)?String(Number(input.localId)):input.localId
  if(ptcgSet&&/^[a-zA-Z0-9-]{1,20}$/.test(number))
    list.push({src:`https://images.pokemontcg.io/${ptcgSet}/${encodeURIComponent(number)}${input.quality==='high'?'_hires':''}.png`,note:input.lang==='en'?'Ảnh tham khảo · Pokémon TCG API':'Ảnh bản tiếng Anh · Pokémon TCG API'})
  return [...new Map(list.map(c=>[c.src,c])).values()]
}
