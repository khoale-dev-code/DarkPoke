import Lenis from 'lenis'
import { gsap } from 'gsap'
import { publishHomeScroll } from './scroll-events'
import 'lenis/dist/lenis.css'

/**
 * Wheel smoothing for the shop (V14.8).
 * - Keeps the 1.1 s ease-out curve: measured against lerp 0.06–0.12 and other curves, none was steadier,
 *   and lerp 0.12 pulsed more between wheel notches.
 * - `force` (used by the shop shell) keeps smoothing on even when the OS asks for reduced motion: many Windows
 *   machines report that setting by default, which silently turned Lenis off in V14.8.
 * - While the page moves, html[data-scrolling] switches off hover hit-testing, so image zooms and card lifts
 *   do not start under the cursor mid-scroll. Those repaints were the occasional hitches.
 * - V14.25: only mounted for mouse/trackpad devices (see AnimeClientShell). `prevent` tests each node of the event
 *   path with matches(); Lenis already walks every ancestor, so closest() repeated that walk on every wheel event.
 */
const PREVENT = '[role="dialog"],dialog,input,textarea,select,[contenteditable],[data-lenis-prevent]'
const SETTLE_MS = 140

export function mountHomeSmoothScroll(root: HTMLElement, force = false) {
  const headerHeight = document.querySelector('.shop-header')?.getBoundingClientRect().height ?? 64
  const lenis = new Lenis({
    smoothWheel: true, syncTouch: false, autoRaf: false,
    lerp: 0, duration: 1.1, easing: value => 1 - Math.pow(1 - value, 3), wheelMultiplier: 1, touchMultiplier: 1,
    respectReducedMotion: !force, stopInertiaOnNavigate: true,
    anchors: { offset: -headerHeight - 16 },
    virtualScroll: ({ event }) => !event.shiftKey && !event.ctrlKey,
    prevent: node => node.matches(PREVENT)
  })
  const html = document.documentElement
  const hoverDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  let disposed = false
  let observer: MutationObserver | undefined
  let settle = 0
  const tick = () => lenis.raf(performance.now())
  const lock = () => {
    if (html.style.overflow === 'hidden' || document.body.style.overflow === 'hidden') lenis.stop()
    else lenis.start()
  }
  const onScroll = () => {
    if (!hoverDevice) return
    if (!html.hasAttribute('data-scrolling')) html.setAttribute('data-scrolling', '')
    window.clearTimeout(settle)
    settle = window.setTimeout(() => html.removeAttribute('data-scrolling'), SETTLE_MS)
  }
  const destroy = () => {
    if (disposed) return
    disposed = true
    observer?.disconnect()
    window.removeEventListener('scroll', onScroll)
    window.clearTimeout(settle)
    html.removeAttribute('data-scrolling')
    gsap.ticker.remove(tick)
    lenis.off('scroll', publishHomeScroll)
    lenis.destroy()
    delete root.dataset.homeScroll
  }
  try {
    observer = new MutationObserver(lock)
    observer.observe(html, { attributes: true, attributeFilter: ['style'] })
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] })
    lock()
    lenis.on('scroll', publishHomeScroll)
    window.addEventListener('scroll', onScroll, { passive: true })
    gsap.ticker.add(tick)
    root.dataset.homeScroll = 'ready'
    return destroy
  } catch (error) { destroy(); throw error }
}
