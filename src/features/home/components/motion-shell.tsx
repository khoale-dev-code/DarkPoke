'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { createMotionLifecycle } from '../animation/lifecycle'

export function HomeMotionShell({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = root.current
    if (!element) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const lifecycle = createMotionLifecycle(async () => {
      const { mountHomeMotion } = await import('../animation/controller')
      return () => mountHomeMotion(element)
    }, () => { element.dataset.homeMotion = 'error' })
    const configure = () => { void lifecycle.configure(!preference.matches) }
    preference.addEventListener('change', configure)
    configure()
    return () => { preference.removeEventListener('change', configure); lifecycle.destroy() }
  }, [])
  return <div ref={root} className="dp-home">{children}</div>
}
