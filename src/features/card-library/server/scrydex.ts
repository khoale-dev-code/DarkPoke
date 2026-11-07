import 'server-only'
import { unstable_cache } from 'next/cache'
import { conditionRank, variantLabel, type GradedPrice, type HistoryPoint, type PopReport, type PriceHistory, type RawPrice, type ScrydexCard, type ScrydexVariant, type TrendKey, type Trends } from '../pricing'

/**
 * Optional Scrydex integration (https://scrydex.com/docs): condition and graded prices, trends,
 * price history and pop reports. Enabled only when SCRYDEX_API_KEY and SCRYDEX_TEAM_ID are set.
 * Every request costs API credits, so responses are cached and refreshed by the Scrydex webhook.
 */
const API = 'https://api.scrydex.com/pokemon/v1'
const TIMEOUT_MS = 8000
export const SCRYDEX_TAG = 'scrydex'
export const scrydexExpansionTag = (expansionId: string) => `scrydex-exp-${expansionId.toLowerCase()}`
export const EXPANSION_ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,49}$/
const CARD_ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/

export function scrydexEnabled() {
  return !!process.env.SCRYDEX_API_KEY?.trim() && !!process.env.SCRYDEX_TEAM_ID?.trim()
}

class ScrydexHttpError extends Error { constructor(readonly status: number) { super(`SCRYDEX_HTTP_${status}`) } }

async function request(path: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(`${API}${path}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  const response = await fetch(url, {
    headers: { 'X-Api-Key': process.env.SCRYDEX_API_KEY!.trim(), 'X-Team-ID': process.env.SCRYDEX_TEAM_ID!.trim(), Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store'
  })
  if (response.status === 404) return null
  if (!response.ok) throw new ScrydexHttpError(response.status)
  return response.json()
}

// --- defensive readers ------------------------------------------------------
type Obj = Record<string, unknown>
const obj = (value: unknown): Obj | null => (value && typeof value === 'object' && !Array.isArray(value) ? value as Obj : null)
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
const num = (value: unknown) => { const n = typeof value === 'string' ? Number(value) : value; return typeof n === 'number' && Number.isFinite(n) ? n : null }
const text = (value: unknown, max = 80) => (typeof value === 'string' && value.length <= max ? value : typeof value === 'number' ? String(value) : '')
const TREND_KEYS: TrendKey[] = ['days_1', 'days_7', 'days_14', 'days_30', 'days_90', 'days_180']

function trends(value: unknown): Trends {
  const source = obj(value); const result: Trends = {}
  if (!source) return result
  for (const key of TREND_KEYS) {
    const row = obj(source[key]); const change = num(row?.price_change); const percent = num(row?.percent_change)
    if (change != null && percent != null) result[key] = { change, percent }
  }
  return result
}
const flags = (row: Obj) => [row.is_perfect === true && 'Perfect', row.is_signed === true && 'Có chữ ký', row.is_error === true && 'Lỗi in'].filter((flag): flag is string => !!flag)
const gradeValue = (grade: string) => { const n = Number(grade); return Number.isFinite(n) ? n : -1 }

function variant(input: unknown): ScrydexVariant | null {
  const row = obj(input); const name = text(row?.name, 60)
  if (!row || !name) return null
  const raw: RawPrice[] = []; const graded: GradedPrice[] = []
  for (const item of arr(row.prices).slice(0, 200)) {
    const price = obj(item); if (!price) continue
    const currency = text(price.currency, 4) || 'USD'
    if (price.type === 'graded') {
      const company = text(price.company, 20); const grade = text(price.grade, 10)
      if (company && grade) graded.push({ company, grade, low: num(price.low), mid: num(price.mid), high: num(price.high), market: num(price.market), currency, trends: trends(price.trends), flags: flags(price) })
    } else {
      const condition = text(price.condition, 4) || 'NM'
      raw.push({ condition, low: num(price.low), market: num(price.market), currency, trends: trends(price.trends), flags: flags(price) })
    }
  }
  const pop: PopReport[] = arr(row.pop_reports).slice(0, 10).flatMap((item) => {
    const report = obj(item); const company = text(report?.company, 20)
    if (!report || !company) return []
    const grades = arr(report.grades).flatMap((g) => { const gr = obj(g); const count = num(gr?.count); const grade = text(gr?.grade, 10); return gr && grade && count != null ? [{ grade, count }] : [] })
    return [{ company, total: num(report.total) ?? grades.reduce((sum, g) => sum + g.count, 0), grades: grades.sort((a, b) => gradeValue(b.grade) - gradeValue(a.grade)) }]
  })
  raw.sort((a, b) => conditionRank(a.condition) - conditionRank(b.condition) || a.flags.length - b.flags.length)
  graded.sort((a, b) => a.company.localeCompare(b.company) || gradeValue(b.grade) - gradeValue(a.grade) || a.flags.length - b.flags.length)
  if (!raw.length && !graded.length && !pop.length) return null
  return { name, label: variantLabel(name), raw, graded, pop }
}

// --- matching a TCGdex card to a Scrydex card --------------------------------
export interface MatchInput { name: string; localId: string; setName: string; official?: number }
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const quote = (value: string) => `"${value.replace(/["\\]/g, ' ').trim()}"`

async function findMatch(input: MatchInput): Promise<{ id: string; expansionId: string } | null> {
  const number = input.localId.replace(/^0+(?=\d)/, '')
  const body = obj(await request('/cards', { q: `name:${quote(input.name)} number:${quote(number)}`, page_size: '25', select: 'id,name,number,language_code,expansion' }))
  const candidates = arr(body?.data).flatMap((item) => {
    const card = obj(item); const expansion = obj(card?.expansion)
    const id = text(card?.id); const expansionId = text(expansion?.id, 50)
    if (!card || !CARD_ID.test(id) || !EXPANSION_ID.test(expansionId)) return []
    if (text(card.language_code, 4) && text(card.language_code, 4).toUpperCase() !== 'EN') return []
    return [{ id, expansionId, expansionName: normalize(text(expansion?.name, 120)), printedTotal: num(expansion?.printed_total) }]
  })
  const setName = normalize(input.setName)
  const best = candidates.find((c) => c.expansionName === setName)
    ?? candidates.find((c) => !!setName && (c.expansionName.includes(setName) || setName.includes(c.expansionName)) && (!input.official || c.printedTotal === input.official))
    ?? (input.official ? candidates.filter((c) => c.printedTotal === input.official) : []).at(0)
    ?? (candidates.length === 1 ? candidates[0] : undefined)
  return best ? { id: best.id, expansionId: best.expansionId } : null
}

const matchCached = unstable_cache(findMatch, ['scrydex-match-v1'], { revalidate: 7 * 86400, tags: [SCRYDEX_TAG, 'scrydex-match'] })

async function fetchCard(id: string): Promise<ScrydexCard | null> {
  let body: Obj | null
  try { body = obj(await request(`/cards/${encodeURIComponent(id)}`, { include: 'prices,pop_reports' })) }
  catch (error) {
    // Fall back to prices only if the combined include is rejected.
    if (!(error instanceof ScrydexHttpError) || error.status !== 400) throw error
    body = obj(await request(`/cards/${encodeURIComponent(id)}`, { include: 'prices' }))
  }
  const card = obj(body?.data) ?? body
  if (!card) return null
  const expansion = obj(card.expansion)
  return {
    id, expansionId: text(expansion?.id, 50), expansionName: text(expansion?.name, 120),
    variants: arr(card.variants).slice(0, 12).map(variant).filter((v): v is ScrydexVariant => !!v)
  }
}

async function fetchHistory(id: string, variantName: string): Promise<PriceHistory | null> {
  const body = obj(await request(`/cards/${encodeURIComponent(id)}/price_history`, { days: '90', variant: variantName, condition: 'NM', page_size: '100' }))
  let currency = 'USD'
  const points: HistoryPoint[] = arr(body?.data).flatMap((day) => {
    const row = obj(day); const date = text(row?.date, 10)
    if (!row || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return []
    const price = arr(row.prices).map(obj).find((p) => p && (p.type ?? 'raw') === 'raw' && (p.condition ?? 'NM') === 'NM' && (!p.variant || p.variant === variantName) && p.is_perfect !== true && p.is_signed !== true && p.is_error !== true)
    const market = num(price?.market)
    if (!price || market == null) return []
    currency = text(price.currency, 4) || currency
    return [{ date, market, low: num(price.low) }]
  }).sort((a, b) => a.date.localeCompare(b.date))
  return points.length >= 2 ? { variant: variantName, condition: 'NM', currency, points } : null
}

export type ScrydexResult =
  | { status: 'disabled' }
  | { status: 'unmatched' }
  | { status: 'error' }
  | { status: 'ok'; card: ScrydexCard; history: PriceHistory | null }

/** Scrydex covers English prints here; TCGdex names in other languages cannot be matched reliably. */
export async function getScrydexMarket(input: MatchInput, lang: string): Promise<ScrydexResult> {
  if (!scrydexEnabled() || lang !== 'en') return { status: 'disabled' }
  try {
    const match = await matchCached(input)
    if (!match) return { status: 'unmatched' }
    // Per-expansion tags let the webhook refresh exactly the expansions whose prices changed.
    const tags = [SCRYDEX_TAG, 'scrydex-prices', scrydexExpansionTag(match.expansionId)]
    const card = await unstable_cache(fetchCard, ['scrydex-card-v1'], { revalidate: 12 * 3600, tags })(match.id)
    if (!card || !card.variants.length) return { status: 'unmatched' }
    const primary = card.variants.find((v) => v.raw.some((p) => p.condition === 'NM' && p.market != null)) ?? card.variants[0]!
    const history = await unstable_cache(fetchHistory, ['scrydex-history-v1'], { revalidate: 12 * 3600, tags })(match.id, primary.name).catch(() => null)
    return { status: 'ok', card, history }
  } catch {
    return { status: 'error' }
  }
}
