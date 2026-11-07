'use client'
import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

/**
 * V14.24: the Google Maps embed (about 1 MB of scripts) is only created once the footer map is close to the screen,
 * instead of the browser's lazy distance of a few screens. Until then a light placeholder keeps the same size.
 */
export function FooterMap({ src, title }: { src: string; title: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  useEffect(() => {
    const el = box.current
    if (!el || show) return
    if (!('IntersectionObserver' in window)) { const timer = setTimeout(() => setShow(true)); return () => clearTimeout(timer) }
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { setShow(true); io.disconnect() } }, { rootMargin: '240px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [show])
  return <div ref={box} className="dpf-map">
    {show ? <iframe src={src} title={title} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      : <span className="dpf-map-wait"><MapPin size={22} aria-hidden="true" />Đang tải bản đồ…</span>}
  </div>
}
