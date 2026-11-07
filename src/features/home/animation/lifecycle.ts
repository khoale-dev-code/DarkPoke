/** Lazy motion can finish loading after a route change; only the current mount owns it. */
export function createMotionLifecycle(load: () => Promise<() => (() => void)>, onError?: (error: unknown) => void) {
  let generation = 0
  let disposed = false
  let cleanup: (() => void) | undefined
  return {
    async configure(enabled: boolean) {
      const current = ++generation
      cleanup?.(); cleanup = undefined
      if (!enabled || disposed) return
      try {
        const mount = await load()
        if (!disposed && current === generation) cleanup = mount()
      } catch (error) {
        if (!disposed && current === generation) onError?.(error)
        // All content and native scrolling work when animation cannot load.
        if (process.env.NODE_ENV === 'development') console.warn('Homepage motion could not start:', error)
      }
    },
    destroy() {
      disposed = true; generation++
      cleanup?.(); cleanup = undefined
    }
  }
}
