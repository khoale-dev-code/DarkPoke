'use client'

import { useSyncExternalStore } from 'react'

export interface RecentProduct { id: string; slug: string; name: string; thumbnail: string | null; price: number; min_price: number | null; max_price: number | null }

const KEY = 'dp-recent-v1'
const LIMIT = 10
const EMPTY: RecentProduct[] = []
let items: RecentProduct[] = EMPTY
let loaded = false
const listeners = new Set<() => void>()

function isRecent(value: unknown): value is RecentProduct {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<RecentProduct>
  return typeof item.id === 'string' && typeof item.slug === 'string' && /^[a-z0-9-]{2,120}$/.test(item.slug)
    && typeof item.name === 'string' && typeof item.price === 'number'
}

function load() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '[]')
    items = Array.isArray(parsed) ? parsed.filter(isRecent).slice(0, LIMIT) : EMPTY
  } catch { items = EMPTY }
}

function subscribe(listener: () => void) {
  load()
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => { if (event.key === KEY) { loaded = false; load(); listener() } }
  window.addEventListener('storage', onStorage)
  return () => { listeners.delete(listener); window.removeEventListener('storage', onStorage) }
}

/** Device-only history; nothing is sent to the server. */
export function rememberProduct(product: RecentProduct) {
  load()
  items = [product, ...items.filter((item) => item.id !== product.id)].slice(0, LIMIT)
  try { window.localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* Private mode: keep the in-memory list. */ }
  listeners.forEach((listener) => listener())
}

export function clearRecentProducts() {
  items = EMPTY
  try { window.localStorage.removeItem(KEY) } catch { /* ignore */ }
  listeners.forEach((listener) => listener())
}

export function useRecentProducts() {
  return useSyncExternalStore(subscribe, () => { load(); return items }, () => EMPTY)
}
