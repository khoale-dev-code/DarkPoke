import { gsap } from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

/** The server component stays visible without JS; this module only owns its motion. */
export function mountLibraryPortalMotion(root: HTMLElement) {
  const portal = root.querySelector<HTMLElement>('[data-library-portal]')
  if (!portal) return () => {}
  gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin)
  const media = gsap.matchMedia()
  try {
    media.add('(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const art = portal.querySelector<HTMLElement>('[data-library-art]')
      const orbit = portal.querySelector<SVGSVGElement>('[data-library-orbit]')
      const path = portal.querySelector<SVGPathElement>('[data-library-path]')
      const marker = portal.querySelector<SVGCircleElement>('[data-library-marker]')
      if (art) gsap.fromTo(art, { rotation: -1.8, scale: .97 }, {
        rotation: 0, scale: 1, ease: 'none',
        scrollTrigger: { trigger: art, start: 'top 92%', end: 'center 50%', scrub: .7 }
      })
      if (orbit && path && marker) {
        const timeline = gsap.timeline({ scrollTrigger: { trigger: art ?? portal, start: 'top 92%', end: 'bottom 45%', scrub: .7 } })
        timeline.fromTo(path, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1, ease: 'none' }, 0)
        timeline.to(marker, { motionPath: { path, align: path, alignOrigin: [.5, .5] }, duration: 1, ease: 'none' }, 0)
        timeline.fromTo(orbit, { rotation: -8 }, { rotation: 16, duration: 1, ease: 'none' }, 0)
      }
    }, portal)
    return () => media.revert()
  } catch (error) {
    media.revert()
    throw error
  }
}
