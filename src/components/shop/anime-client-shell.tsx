'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Shop shell. Mouse and trackpad scrolling is smoothed with Lenis; touch-first devices keep the browser's own scrolling.
 * V14.25: Lenis listens to touchstart/touchmove with passive: false, which forced every finger scroll to wait for the
 * main thread (measured: SCROLL_MAIN_THREAD on every frame), so any busy moment showed as a stutter on phones.
 * Without it the phone scrolls on the compositor thread and never waits for JavaScript. It also skips loading GSAP and Lenis there.
 */
const SMOOTH_WHEEL = '(hover: hover) and (pointer: fine)'

export function AnimeClientShell({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = root.current
    if (!element) return
    if (!window.matchMedia(SMOOTH_WHEEL).matches) { element.dataset.homeScroll = 'native'; return }
    let disposed = false
    let cleanup: (() => void) | undefined
    void import('@/features/home/animation/smooth-scroll').then(({ mountHomeSmoothScroll }) => {
      if (!disposed) cleanup = mountHomeSmoothScroll(element, true)
    }).catch(() => {
      if (!disposed) element.dataset.homeScroll = 'native'
    })
    return () => { disposed = true; cleanup?.() }
  }, [])
  return <div ref={root} className="shop-ui shop-v13">{children}</div>
}
