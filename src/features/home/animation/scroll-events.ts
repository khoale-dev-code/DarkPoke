const listeners = new Set<() => void>()
export function subscribeHomeScroll(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
export function publishHomeScroll() {
  for (const listener of listeners) {
    try { listener() } catch (error) { if (process.env.NODE_ENV === 'development') console.warn('Scroll effect could not update:', error) }
  }
}
