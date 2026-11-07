import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Trade-in page motion. V14.25: no Lenis of its own any more. The shop shell already smooths the wheel on desktop,
 * so the page used to run two Lenis instances fighting over the same scroll, which showed as jitter.
 */
export function mountTradeinMotion(root:HTMLElement) {
  gsap.registerPlugin(ScrollTrigger)
  const media=gsap.matchMedia()
  media.add('(prefers-reduced-motion: no-preference)',()=>{
    const stages=root.querySelectorAll<HTMLElement>('[data-tradein-step]')
    gsap.from(stages,{opacity:0,y:14,duration:.5,stagger:.09,ease:'power2.out'})
    const cards=root.querySelectorAll<HTMLElement>('[data-tradein-section]')
    cards.forEach(card=>gsap.from(card,{y:18,opacity:.25,duration:.5,ease:'power2.out',scrollTrigger:{trigger:card,start:'top 93%',once:true}}))
    const line=root.querySelector('[data-tradein-line]')
    if(line)gsap.fromTo(line,{scaleX:0},{scaleX:1,transformOrigin:'left center',ease:'none',scrollTrigger:{trigger:root,start:'top top',end:'bottom bottom',scrub:.3}})
  },root)
  let refreshFrame=0
  const observer=new ResizeObserver(()=>{cancelAnimationFrame(refreshFrame);refreshFrame=requestAnimationFrame(()=>ScrollTrigger.refresh())})
  observer.observe(root)
  return()=>{cancelAnimationFrame(refreshFrame);observer.disconnect();media.revert()}
}
