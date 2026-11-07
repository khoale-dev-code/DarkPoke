'use client'

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { canAutoRotate, carouselReducer, initialCarousel, mountedSlides, nextCandidate } from './model'
import { HERO_INTERVAL, HERO_SLIDES } from './slides'

export function useHeroCarousel() {
  const [state, dispatch] = useReducer(carouselReducer, HERO_SLIDES.length, initialCarousel)
  const stage = useRef<HTMLDivElement>(null)
  const [wanted, setWanted] = useState(true)
  const [focusStopped, setFocusStopped] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const visibility = () => setPageVisible(document.visibilityState === 'visible')
    visibility()
    document.addEventListener('visibilitychange', visibility)
    const element = stage.current
    const observer = element && 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      setInView(entries.some(entry => entry.isIntersecting))
    }, { threshold: 0 }) : null
    if (element) observer?.observe(element)
    return () => { document.removeEventListener('visibilitychange', visibility); observer?.disconnect() }
  }, [])

  // Reduced motion is handled by CSS: keep the requested rotation, without a fade.
  const rotationEnabled = wanted && !focusStopped
  const running = canAutoRotate(state, rotationEnabled && pageVisible && inView)
  const next = nextCandidate(state)
  useEffect(() => {
    if (!running || next === null) return
    const timer = window.setTimeout(() => dispatch({ type: 'request', index: next }), HERO_INTERVAL)
    return () => window.clearTimeout(timer)
  }, [running, next, state.index])

  const step = useCallback((delta: number) => dispatch({ type: 'step', delta }), [])
  const ready = useCallback((index: number) => dispatch({ type: 'ready', index }), [])
  const fail = useCallback((index: number) => dispatch({ type: 'failed', index }), [])
  const toggle = () => {
    if (rotationEnabled) setWanted(false)
    else { setWanted(true); setFocusStopped(false) }
  }
  const preload = state.ready.includes(state.index) || state.failed.includes(state.index)
  return { state, stage, rotationEnabled, running, ready, fail, step, toggle,
    mounted: mountedSlides(state, preload), stopForFocus: () => setFocusStopped(true) }
}
