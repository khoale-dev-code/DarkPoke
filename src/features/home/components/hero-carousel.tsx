'use client'

import { getImageProps } from 'next/image'
import Link from 'next/link'
import { useCallback, useRef, type CSSProperties, type PointerEvent } from 'react'
import { ImageOff, Pause, Play } from 'lucide-react'
import { HERO_INTERVAL, HERO_SLIDES, type HeroSlide } from '../carousel/slides'
import { swipeDirection } from '../carousel/model'
import { useHeroCarousel } from '../carousel/use-hero-carousel'
import '../hero-carousel.css'

interface ArtProps { slide: HeroSlide; index: number; first: boolean; urgent: boolean; ready: (index: number) => void; fail: (index: number) => void }

/** Art direction: wide banner on tablet/desktop, portrait banner on phones. */
function HeroArt({ slide, index, first, urgent, ready, fail }: ArtProps) {
  const shared = { alt: slide.alt, sizes: '100vw' }
  const { props: { srcSet: wide } } = getImageProps({ ...shared, src: slide.src, width: 1920, height: 784 })
  const { props: { srcSet: narrow, ...img } } = getImageProps({
    ...shared, src: slide.mobile.src, width: slide.mobile.width, height: slide.mobile.height,
    loading: 'eager', fetchPriority: first || urgent ? 'high' : 'low'
  })
  // A cached image can finish before hydration attaches onLoad.
  const markIfComplete = useCallback((element: HTMLImageElement | null) => {
    if (element?.complete && element.naturalWidth > 0) ready(index)
  }, [ready, index])
  return <picture>
    <source media="(min-width: 768px)" srcSet={wide} sizes="100vw" />
    <source srcSet={narrow} sizes="100vw" />
    {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
    <img {...img} ref={markIfComplete} className="hp-hero-img" onLoad={() => ready(index)} onError={() => fail(index)} />
  </picture>
}

export function HomeHeroCarousel() {
  // Destructured: the hook also returns a ref, which must not be read during render.
  const { state, stage, rotationEnabled, running, mounted, ready, fail, step, toggle, stopForFocus } = useHeroCarousel()
  const gesture = useRef<{ x: number; y: number } | null>(null)
  const suppressClick = useRef(false)
  const current = HERO_SLIDES[state.index] ?? HERO_SLIDES[0]!
  const target = state.pending ?? state.index

  const finishSwipe = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current; gesture.current = null
    if (!start) return
    const direction = swipeDirection(event.clientX - start.x, event.clientY - start.y)
    if (direction) { suppressClick.current = true; step(direction) }
  }

  return <section className="hp-hero" data-home-hero aria-roledescription="trình chiếu" aria-label="Sản phẩm nổi bật tại Dark Poke"
    onFocusCapture={(event) => { if (event.target.matches(':focus-visible') && !event.target.closest('.hp-hero-bar')) stopForFocus() }}>
    <div ref={stage} className="hp-hero-stage" aria-busy={state.pending !== null}
      onKeyDown={(event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1) } }}
      onPointerDown={(event) => { suppressClick.current = false; gesture.current = event.pointerType === 'touch' && event.isPrimary ? { x: event.clientX, y: event.clientY } : null }}
      onPointerUp={finishSwipe} onPointerCancel={() => { gesture.current = null }}
      onClickCapture={(event) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false } }}>
      <div className="hp-hero-frame" aria-hidden="true" />
      {mounted.map((index) => {
        const slide = HERO_SLIDES[index]
        if (!slide) return null
        const active = index === state.index
        return <div key={slide.id} className={`hp-hero-slide ${active ? 'is-active' : ''}`} role="group" aria-roledescription="ảnh" aria-label={`${index + 1} trên ${HERO_SLIDES.length}: ${slide.name}`} aria-hidden={!active} inert={!active}>
          <div className="hp-hero-backdrop" style={{ '--hp-bd': `url("${slide.backdrop}")`, '--hp-bd-m': `url("${slide.mobile.backdrop}")` } as CSSProperties} />
          <Link prefetch={false} href={slide.href} className="hp-hero-link" tabIndex={active ? 0 : -1} aria-label={slide.action}>
            {state.failed.includes(index)
              ? <span className="hp-hero-fallback"><ImageOff size={26} aria-hidden="true" />Ảnh tạm chưa tải được · Khám phá {slide.name}</span>
              : <HeroArt key={`${slide.id}:${state.attempts[index]}`} slide={slide} index={index} first={index === 0 && state.previous === null} urgent={state.pending === index} ready={ready} fail={fail} />}
          </Link>
        </div>
      })}
      <div className="hp-hero-scrim" aria-hidden="true" />

      <div className="hp-hero-bar" data-running={running}>
        <p className="hp-hero-caption" aria-hidden="true"><span>{String(state.index + 1).padStart(2, '0')}</span>{current.name}</p>
        <div className="hp-hero-dots" role="group" aria-label="Chọn ảnh">
          {HERO_SLIDES.map((slide, index) => <button key={slide.id} type="button" className="hp-hero-dot" aria-label={`Ảnh ${index + 1}: ${slide.name}`} aria-current={index === target ? 'true' : undefined}
            onClick={() => { if (index !== target) step(index - target) }}>
            <span className="hp-hero-track"><span key={`${state.index}:${running}`} className="hp-hero-fill" style={{ '--hp-duration': `${HERO_INTERVAL}ms` } as CSSProperties} /></span>
          </button>)}
        </div>
        <button type="button" className="hp-hero-toggle" onClick={toggle} aria-label={rotationEnabled ? 'Tạm dừng tự chuyển ảnh' : 'Bật tự chuyển ảnh'}>
          {rotationEnabled ? <Pause size={14} aria-hidden="true" fill="currentColor" /> : <Play size={14} aria-hidden="true" fill="currentColor" />}
        </button>
      </div>
    </div>
    <p className="sr-only" aria-live={running ? 'off' : 'polite'} aria-atomic="true">Ảnh {state.index + 1} trên {HERO_SLIDES.length}: {current.name}</p>
  </section>
}
