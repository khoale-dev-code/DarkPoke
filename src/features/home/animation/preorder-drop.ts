import { gsap } from 'gsap'

export function mountPreorderDropMotion(root: HTMLElement) {
  const section = root.querySelector<HTMLElement>('[data-preorder-drop]')
  if (!section) return () => {}
  const media = gsap.matchMedia()
  try {
    media.add('(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const stage = section.querySelector('[data-preorder-stage]')
      const art = section.querySelector('[data-preorder-art]')
      const cards = section.querySelectorAll('[data-preorder-card]')
      if (art) gsap.fromTo(art, { rotation: -5, y: 20 }, { rotation: -1, y: -12, ease: 'none', scrollTrigger: { trigger: stage ?? section, start: 'top 92%', end: 'bottom 38%', scrub: .8 } })
      if (cards.length) gsap.fromTo(cards, { y: 28 }, { y: 0, duration: .7, stagger: .1, ease: 'power2.out', clearProps: 'transform', scrollTrigger: { trigger: stage ?? section, start: 'top 87%', once: true } })
    }, section)
    return () => media.revert()
  } catch (error) { media.revert(); throw error }
}
