import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { mountLibraryPortalMotion } from './library-portal'
import { mountPreorderDropMotion } from './preorder-drop'
import { subscribeHomeScroll } from './scroll-events'

export function mountHomeMotion(root: HTMLElement) {
  gsap.registerPlugin(ScrollTrigger)
  let disposed = false
  let unmountLibraryPortal: (() => void) | undefined
  let unmountPreorderDrop: (() => void) | undefined
  const unsubscribeScroll = subscribeHomeScroll(() => ScrollTrigger.update())
  const context = gsap.context(() => {}, root)
  const destroy = () => {
    if (disposed) return
    disposed = true
    unsubscribeScroll()
    unmountPreorderDrop?.()
    unmountLibraryPortal?.()
    context.revert()
    delete root.dataset.homeMotion
  }
  try {
    context.add(() => {
      root.querySelectorAll<HTMLElement>('[data-home-reveal]').forEach(element => {
        if (element.getBoundingClientRect().top < window.innerHeight * .9) return
        gsap.fromTo(element, { y: 26, opacity: .15 }, {
          y: 0, opacity: 1, duration: .75, ease: 'power2.out', clearProps: 'transform,opacity',
          scrollTrigger: { trigger: element, start: 'top 92%', once: true }
        })
      })
      const desktop = window.matchMedia('(min-width: 900px) and (pointer: fine)').matches
      if (desktop) {
        root.querySelectorAll<HTMLElement>('[data-home-parallax]').forEach(element => {
          gsap.fromTo(element, { yPercent: -3 }, {
            yPercent: 3, ease: 'none',
            scrollTrigger: { trigger: element.parentElement, start: 'top bottom', end: 'bottom top', scrub: .7 }
          })
        })
      }
      const stamp = root.querySelector('[data-home-stamp]')
      const hero = root.querySelector('[data-home-hero]')
      if (stamp && hero) gsap.to(stamp, { rotation: 32, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .8 } })

      unmountLibraryPortal = mountLibraryPortalMotion(root)
      unmountPreorderDrop = mountPreorderDropMotion(root)
    })
    const refresh = () => { if (!disposed) ScrollTrigger.refresh() }
    void document.fonts?.ready.then(refresh)
    refresh()
    root.dataset.homeMotion = 'ready'
    return destroy
  } catch (error) {
    destroy()
    throw error
  }
}
