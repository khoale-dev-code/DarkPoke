import 'server-only'
import { variantLabel, type CardMarket, type CardmarketRow, type TcgplayerVariant } from '../pricing'

/**
 * TCGdex embeds marketplace data in each card under `pricing` (TCGplayer in USD, Cardmarket in EUR).
 * The shape is parsed defensively: unknown keys are ignored and a malformed block simply hides that panel.
 */
const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null)
const str = (value: unknown) => (typeof value === 'string' && value.length <= 40 ? value : null)
const record = (value: unknown): Record<string, unknown> | null => (value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null)

const TCGPLAYER_ORDER = ['normal', 'holofoil', 'holo', 'reverse-holofoil', 'reverseHolofoil', 'reverse', '1st-edition', '1stEditionNormal', '1st-edition-holofoil', '1stEditionHolofoil', 'unlimited', 'unlimitedHolofoil']

function tcgplayer(input: unknown): CardMarket['tcgplayer'] {
  const block = record(input)
  if (!block) return null
  const variants: TcgplayerVariant[] = []
  for (const [key, value] of Object.entries(block)) {
    const row = record(value)
    if (!row || variants.length >= 12 || !/^[a-zA-Z0-9-]{1,40}$/.test(key)) continue
    const variant = { key, label: variantLabel(key), low: num(row.lowPrice), mid: num(row.midPrice), high: num(row.highPrice), market: num(row.marketPrice), directLow: num(row.directLowPrice) }
    if ([variant.low, variant.mid, variant.high, variant.market, variant.directLow].some((price) => price != null)) variants.push(variant)
  }
  if (!variants.length) return null
  const rank = (key: string) => { const index = TCGPLAYER_ORDER.indexOf(key); return index < 0 ? 99 : index }
  variants.sort((a, b) => rank(a.key) - rank(b.key))
  return { updated: str(block.updated), currency: str(block.unit) ?? 'USD', variants }
}

function cardmarket(input: unknown): CardMarket['cardmarket'] {
  const block = record(input)
  if (!block) return null
  const pick = (suffix: string, label: string): CardmarketRow => ({
    label, avg: num(block[`avg${suffix}`]), low: num(block[`low${suffix}`]), trend: num(block[`trend${suffix}`]),
    avg1: num(block[`avg1${suffix}`]), avg7: num(block[`avg7${suffix}`]), avg30: num(block[`avg30${suffix}`])
  })
  const filled = (row: CardmarketRow) => [row.avg, row.low, row.trend, row.avg1, row.avg7, row.avg30].some((value) => value != null)
  const rows = [pick('', 'Thường'), pick('-holo', 'Holo / Reverse')].filter(filled)
  if (!rows.length) return null
  return { updated: str(block.updated), currency: str(block.unit) ?? 'EUR', rows }
}

export function parseTcgdexPricing(input: unknown): CardMarket {
  const block = record(input)
  return { tcgplayer: tcgplayer(block?.tcgplayer), cardmarket: cardmarket(block?.cardmarket) }
}
