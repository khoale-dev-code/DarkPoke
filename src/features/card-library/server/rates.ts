import 'server-only'
import { unstable_cache } from 'next/cache'
import { NO_RATES, type ExchangeRates } from '../pricing'

/**
 * VND reference rates for card prices.
 * 1. CARD_PRICE_USD_VND / CARD_PRICE_EUR_VND / CARD_PRICE_JPY_VND in env win (the shop's own rate, e.g. 26300).
 * 2. Otherwise the free ExchangeRate-API open endpoint (updates once a day, no key; attribution shown on the page).
 * The feed is cached for 12 hours, well inside its "at most once per hour" guidance.
 */
const FEED = 'https://open.er-api.com/v6/latest/USD'

function envRate(name: string) {
  const value = Number(process.env[name]?.replace(/[_\s.,]/g, ''))
  return Number.isFinite(value) && value > 0 && value < 1_000_000 ? value : null
}

interface Feed { USD: number; EUR: number | null; JPY: number | null; updated: string | null }

const loadFeed = unstable_cache(async (): Promise<Feed | null> => {
  const response = await fetch(FEED, { signal: AbortSignal.timeout(6000), cache: 'no-store', headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`FX_HTTP_${response.status}`)
  const body = await response.json() as { result?: unknown; rates?: Record<string, unknown>; time_last_update_unix?: unknown }
  const rates = body.rates ?? {}
  const vnd = Number(rates.VND); const eur = Number(rates.EUR); const jpy = Number(rates.JPY)
  // Sanity bounds keep a malformed feed from showing absurd prices.
  if (body.result !== 'success' || !(vnd > 1000 && vnd < 1_000_000)) return null
  const updated = typeof body.time_last_update_unix === 'number' ? new Date(body.time_last_update_unix * 1000).toISOString() : null
  return { USD: vnd, EUR: eur > 0 ? vnd / eur : null, JPY: jpy > 0 ? vnd / jpy : null, updated }
}, ['fx-usd-vnd-v1'], { revalidate: 12 * 3600, tags: ['fx-rates'] })

export async function getExchangeRates(): Promise<ExchangeRates> {
  const env = { USD: envRate('CARD_PRICE_USD_VND'), EUR: envRate('CARD_PRICE_EUR_VND'), JPY: envRate('CARD_PRICE_JPY_VND') }
  const needFeed = env.USD == null || env.EUR == null || env.JPY == null
  const feed = needFeed ? await loadFeed().catch(() => null) : null
  const result = { USD: env.USD ?? feed?.USD ?? null, EUR: env.EUR ?? feed?.EUR ?? null, JPY: env.JPY ?? feed?.JPY ?? null }
  if (result.USD == null && result.EUR == null && result.JPY == null) return NO_RATES
  const usedEnv = env.USD != null || env.EUR != null || env.JPY != null
  const usedFeed = !!feed && ((env.USD == null && feed.USD != null) || (env.EUR == null && feed.EUR != null) || (env.JPY == null && feed.JPY != null))
  return { ...result, source: usedEnv && usedFeed ? 'mixed' : usedFeed ? 'exchangerate-api' : 'env', updated: usedFeed ? feed!.updated : null }
}
