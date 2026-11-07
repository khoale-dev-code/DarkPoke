'use client'

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import { formatMoney, formatUpdated, formatVnd, rateFor, toVnd, type ExchangeRates } from '../pricing'

/** Display currency for market prices: the source currency (USD/EUR/JPY) or Vietnamese đồng. */
export type DisplayMode = 'original' | 'vnd'
const KEY = 'dp-card-price-currency'
const listeners = new Set<() => void>()
let memory: DisplayMode | null = null

// The choice is a per-viewer convenience: remembered in localStorage when available, in memory otherwise.
function read(): DisplayMode {
  if (memory) return memory
  try { return window.localStorage.getItem(KEY) === 'vnd' ? 'vnd' : 'original' } catch { return 'original' }
}
function write(mode: DisplayMode) {
  memory = mode
  try { window.localStorage.setItem(KEY, mode) } catch { /* storage blocked: keep the in-memory choice */ }
  listeners.forEach((listener) => listener())
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => { if (event.key === KEY) { memory = null; listener() } }
  window.addEventListener('storage', onStorage)
  return () => { listeners.delete(listener); window.removeEventListener('storage', onStorage) }
}

const RatesContext = createContext<ExchangeRates | null>(null)

export function CurrencyProvider({ rates, children }: { rates: ExchangeRates; children: ReactNode }) {
  return <RatesContext.Provider value={rates}>{children}</RatesContext.Provider>
}

export function useCurrency() {
  const rates = useContext(RatesContext)
  const stored = useSyncExternalStore(subscribe, read, () => 'original' as DisplayMode)
  const available = !!rates && (rates.USD != null || rates.EUR != null || rates.JPY != null)
  return { rates, available, mode: available ? stored : 'original' as DisplayMode, setMode: write }
}

/** Formats one price in the chosen display currency; falls back to the source currency when no rate exists. */
export function Money({ value, currency, className }: { value: number | null | undefined; currency: string; className?: string }) {
  const { rates, mode } = useCurrency()
  const converted = mode === 'vnd' && rates ? toVnd(value, currency, rates) : null
  const text = converted != null ? formatVnd(converted) : formatMoney(value, currency)
  return <span className={className} title={converted != null ? formatMoney(value, currency) : undefined}>{text}</span>
}

/** Secondary line under a headline price: the "other" currency, so both are always visible. */
export function MoneyCounterpart({ value, currency }: { value: number | null | undefined; currency: string }) {
  const { rates, mode, available } = useCurrency()
  if (!available || !rates || value == null) return null
  if (mode === 'vnd') return <span className="dx-price-vnd">= {formatMoney(value, currency)}</span>
  const converted = toVnd(value, currency, rates)
  return converted == null ? null : <span className="dx-price-vnd">≈ {formatVnd(converted)}</span>
}

export function CurrencyToggle({ currency }: { currency?: string }) {
  const { rates, available, mode, setMode } = useCurrency()
  if (!available || !rates) return null
  const label = currency && rateFor(currency, rates) ? currency.toUpperCase() : 'Gốc'
  return <div className="dx-currency" role="group" aria-label="Đơn vị tiền hiển thị">
    <button type="button" aria-pressed={mode === 'original'} onClick={() => setMode('original')}>{label}</button>
    <button type="button" aria-pressed={mode === 'vnd'} onClick={() => setMode('vnd')}>VND</button>
  </div>
}

/** One line describing the rate in use, with the attribution ExchangeRate-API requires. */
export function RateNote({ currency }: { currency: string }) {
  const { rates, available, mode } = useCurrency()
  if (!available || !rates) return null
  const rate = rateFor(currency, rates)
  const updated = formatUpdated(rates.updated)
  return <p className="dx-rate-note" data-active={mode === 'vnd' || undefined}>
    {rate ? <>1 {currency.toUpperCase()} ≈ {formatVnd(Math.round(rate))}</> : <>Chưa có tỷ giá {currency.toUpperCase()}</>}
    {rates.source !== 'env' ? <> · <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer">Rates By Exchange Rate API</a>{updated ? `, ${updated}` : ''}</> : ' · tỷ giá do cửa hàng cài đặt'}
  </p>
}
