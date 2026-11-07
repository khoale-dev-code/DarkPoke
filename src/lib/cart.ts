'use client'
import { useSyncExternalStore } from 'react'

export interface CartLine {
  variantId: string
  productId: string
  slug: string
  name: string
  variantTitle: string
  price: number
  image: string | null
  qty: number
  max: number
  isPreorder: boolean
}

const KEY = 'dp-cart-v1'
const EMPTY: CartLine[] = []
let lines: CartLine[] = EMPTY
let loaded = false
const listeners = new Set<() => void>()

function load() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : []
    lines = Array.isArray(parsed) ? parsed.filter((l) => l && typeof l.variantId === 'string' && l.qty > 0) : []
  } catch {
    lines = []
  }
}

function save(next: CartLine[]) {
  lines = next
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {}
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  load()
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false
      load()
      cb()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

export const cart = {
  add(line: Omit<CartLine, 'qty'>, qty = 1) {
    load()
    const found = lines.find((l) => l.variantId === line.variantId)
    if (found) {
      save(lines.map((l) => (l.variantId === line.variantId ? { ...l, ...line, qty: Math.min(l.qty + qty, line.max) } : l)))
    } else {
      // Hàng pre-order đặt riêng: thêm pre-order thì bỏ hàng có sẵn và ngược lại.
      const kept = lines.filter((l) => l.isPreorder === line.isPreorder)
      save([...kept, { ...line, qty: Math.min(qty, line.max) }])
    }
  },
  setQty(variantId: string, qty: number) {
    load()
    save(lines.map((l) => (l.variantId === variantId ? { ...l, qty: Math.max(1, Math.min(qty, l.max)) } : l)))
  },
  remove(variantId: string) {
    load()
    save(lines.filter((l) => l.variantId !== variantId))
  },
  clear() {
    save([])
  }
}

export function useCart() {
  return useSyncExternalStore(
    subscribe,
    () => {
      load()
      return lines
    },
    () => EMPTY
  )
}

export function cartCount(l: CartLine[]) {
  return l.reduce((s, x) => s + x.qty, 0)
}
export function cartSubtotal(l: CartLine[]) {
  return l.reduce((s, x) => s + x.qty * x.price, 0)
}
