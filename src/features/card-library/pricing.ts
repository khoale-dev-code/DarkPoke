/** Market-price shapes shared by server loaders and UI. All prices are reference values, never shop prices. */

export interface TcgplayerVariant { key: string; label: string; low: number | null; mid: number | null; high: number | null; market: number | null; directLow: number | null }
export interface TcgplayerPricing { updated: string | null; currency: string; variants: TcgplayerVariant[] }
export interface CardmarketRow { label: string; avg: number | null; low: number | null; trend: number | null; avg1: number | null; avg7: number | null; avg30: number | null }
export interface CardmarketPricing { updated: string | null; currency: string; rows: CardmarketRow[] }
export interface CardMarket { tcgplayer: TcgplayerPricing | null; cardmarket: CardmarketPricing | null }

export type TrendKey = 'days_1' | 'days_7' | 'days_14' | 'days_30' | 'days_90' | 'days_180'
export type Trends = Partial<Record<TrendKey, { change: number; percent: number }>>
export interface RawPrice { condition: string; low: number | null; market: number | null; currency: string; trends: Trends; flags: string[] }
export interface GradedPrice { company: string; grade: string; low: number | null; mid: number | null; high: number | null; market: number | null; currency: string; trends: Trends; flags: string[] }
export interface PopReport { company: string; total: number; grades: { grade: string; count: number }[] }
export interface ScrydexVariant { name: string; label: string; raw: RawPrice[]; graded: GradedPrice[]; pop: PopReport[] }
export interface ScrydexCard { id: string; expansionId: string; expansionName: string; variants: ScrydexVariant[] }
export interface HistoryPoint { date: string; market: number; low: number | null }
export interface PriceHistory { variant: string; condition: string; currency: string; points: HistoryPoint[] }

/** VND per unit of each currency. Reference rates only: a live daily feed, or overrides from server env. */
export interface ExchangeRates { USD: number | null; EUR: number | null; JPY: number | null; source: 'env' | 'exchangerate-api' | 'mixed' | null; updated: string | null }
export const NO_RATES: ExchangeRates = { USD: null, EUR: null, JPY: null, source: null, updated: null }

const VARIANT_LABELS: Record<string, string> = {
  normal: 'Thường', holo: 'Holo', holofoil: 'Holo', reverse: 'Reverse Holo', 'reverse-holofoil': 'Reverse Holo', reverseholofoil: 'Reverse Holo',
  '1st-edition': '1st Edition', '1steditionnormal': '1st Edition', '1st-edition-holofoil': '1st Edition Holo', '1steditionholofoil': '1st Edition Holo',
  unlimited: 'Unlimited', unlimitedholofoil: 'Unlimited Holo', firstedition: '1st Edition', wpromo: 'W Promo',
  pokeball: 'Poké Ball', masterball: 'Master Ball', pokeballreverseholofoil: 'Poké Ball Reverse', masterballreverseholofoil: 'Master Ball Reverse'
}

/** "reverseHolofoil", "reverse-holofoil" and "reverse" all read as "Reverse Holo". */
export function variantLabel(key: string) {
  const compact = key.replace(/[\s_]/g, '').toLowerCase()
  const known = VARIANT_LABELS[key.toLowerCase()] ?? VARIANT_LABELS[compact] ?? VARIANT_LABELS[compact.replace(/-/g, '')]
  if (known) return known
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export const CONDITION_LABELS: Record<string, string> = { NM: 'Near Mint', LP: 'Lightly Played', MP: 'Moderately Played', HP: 'Heavily Played', DM: 'Damaged' }
const CONDITION_ORDER = ['NM', 'LP', 'MP', 'HP', 'DM']
export const conditionRank = (condition: string) => { const index = CONDITION_ORDER.indexOf(condition); return index < 0 ? 99 : index }

const money = new Map<string, Intl.NumberFormat>()
export function formatMoney(value: number | null | undefined, currency: string) {
  if (value == null || !Number.isFinite(value)) return '—'
  const key = currency.toUpperCase()
  let format = money.get(key)
  if (!format) {
    try { format = new Intl.NumberFormat(key === 'EUR' ? 'de-DE' : key === 'JPY' ? 'ja-JP' : 'en-US', { style: 'currency', currency: key, maximumFractionDigits: key === 'JPY' ? 0 : 2 }) }
    catch { format = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }) }
    money.set(key, format)
  }
  return format.format(value)
}

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
export function rateFor(currency: string, rates: ExchangeRates) {
  const key = currency.toUpperCase()
  const rate = key === 'USD' ? rates.USD : key === 'EUR' ? rates.EUR : key === 'JPY' ? rates.JPY : null
  return rate && Number.isFinite(rate) && rate > 0 ? rate : null
}
/** Converted amount in VND, rounded to the nearest 1,000 ₫ (100 ₫ under 10,000 ₫): the rate is only a reference. */
export function toVnd(value: number | null | undefined, currency: string, rates: ExchangeRates) {
  const rate = rateFor(currency, rates)
  if (value == null || !rate || !Number.isFinite(value)) return null
  const amount = value * rate
  const step = amount < 10_000 ? 100 : 1000
  return Math.round(amount / step) * step
}
export function formatVnd(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? '—' : vnd.format(value)
}
export function approxVnd(value: number | null | undefined, currency: string, rates: ExchangeRates) {
  const converted = toVnd(value, currency, rates)
  return converted == null ? null : `≈ ${vnd.format(converted)}`
}

export function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—'
  const rounded = Math.round(value * 10) / 10
  return `${rounded > 0 ? '+' : ''}${rounded.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`
}

export function formatUpdated(value: string | null) {
  if (!value) return null
  const date = new Date(value.replace(/\//g, '-'))
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(date)
}

/** TCGplayer search link: TCGdex does not expose product ids, so we never fabricate a product URL. */
export function tcgplayerSearchUrl(name: string, setName?: string) {
  const q = [name, setName].filter(Boolean).join(' ')
  return `https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=${encodeURIComponent(q)}`
}
export function cardmarketSearchUrl(name: string) {
  return `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(name)}`
}
