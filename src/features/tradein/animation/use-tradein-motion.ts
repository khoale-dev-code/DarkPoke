'use client'
import { useEffect, type RefObject } from 'react'
/** No animation library enters the initial render or form state module. */
export function useTradeinMotion(ref:RefObject<HTMLElement|null>) {
  useEffect(()=>{let active=true;let destroy:(()=>void)|undefined
    if(!ref.current||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return
    void import('./controller').then(({mountTradeinMotion})=>{if(active&&ref.current)destroy=mountTradeinMotion(ref.current)}).catch(()=>{/* Native scrolling and the complete form remain available. */})
    return()=>{active=false;destroy?.()}
  },[ref])
}
