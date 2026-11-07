'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DRAG_THRESHOLD = 6
const FLING_MS = 260

/**
 * Click-and-drag with the mouse (V14.12). Touch, pen and trackpads keep native scrolling.
 * Snap is paused while dragging, then the list glides to the nearest card and snap resumes.
 * A drag never opens the card under the cursor; a plain click still does.
 */
function enableMouseDrag(list: HTMLElement) {
  let drag: { id: number; x: number; left: number; moved: boolean; lastX: number; lastT: number; v: number } | null = null
  let suppressClick = false
  let resume = 0
  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const step = () => {
    const first = list.firstElementChild as HTMLElement | null
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0
    return first ? first.getBoundingClientRect().width + gap : list.clientWidth
  }
  const settle = (velocity: number) => {
    const size = step()
    const max = list.scrollWidth - list.clientWidth
    const projected = list.scrollLeft - (reduce() ? 0 : velocity * FLING_MS)
    const target = Math.max(0, Math.min(max, Math.round(projected / size) * size))
    list.scrollTo({ left: target, behavior: reduce() ? 'auto' : 'smooth' })
    window.clearTimeout(resume)
    resume = window.setTimeout(() => { delete list.dataset.dragging }, reduce() ? 0 : 520)
  }
  const down = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    window.clearTimeout(resume)
    drag = { id: event.pointerId, x: event.clientX, left: list.scrollLeft, moved: false, lastX: event.clientX, lastT: event.timeStamp, v: 0 }
  }
  const move = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return
    const dx = event.clientX - drag.x
    if (!drag.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return
      drag.moved = true
      list.dataset.dragging = 'true'
      list.setPointerCapture(event.pointerId)
    }
    event.preventDefault()
    list.scrollLeft = drag.left - dx
    const dt = event.timeStamp - drag.lastT
    if (dt > 0) drag.v = drag.v * 0.4 + ((event.clientX - drag.lastX) / dt) * 0.6
    drag.lastX = event.clientX; drag.lastT = event.timeStamp
  }
  const up = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return
    const { moved, v, lastT } = drag
    drag = null
    if (!moved) return
    if (list.hasPointerCapture(event.pointerId)) list.releasePointerCapture(event.pointerId)
    suppressClick = true
    window.setTimeout(() => { suppressClick = false }, 0)
    // A pause before release means the user stopped: no fling.
    settle(event.timeStamp - lastT > 80 ? 0 : v)
  }
  const click = (event: MouseEvent) => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false } }
  const dragStart = (event: DragEvent) => event.preventDefault()
  list.addEventListener('pointerdown', down)
  list.addEventListener('pointermove', move)
  list.addEventListener('pointerup', up)
  list.addEventListener('pointercancel', up)
  list.addEventListener('click', click, true)
  list.addEventListener('dragstart', dragStart)
  return () => {
    window.clearTimeout(resume)
    delete list.dataset.dragging
    list.removeEventListener('pointerdown', down)
    list.removeEventListener('pointermove', move)
    list.removeEventListener('pointerup', up)
    list.removeEventListener('pointercancel', up)
    list.removeEventListener('click', click, true)
    list.removeEventListener('dragstart', dragStart)
  }
}

/** Previous/next for a horizontal scroll-snap list, plus mouse drag; touch and trackpad keep native scrolling. */
export function RailControls({ target, label }: { target: string; label: string }) {
  const [edges, setEdges] = useState({ start: true, end: false })
  useEffect(() => {
    const list = document.getElementById(target)
    if (!list) return
    let frame = 0
    const measure = () => {
      frame = 0
      const max = list.scrollWidth - list.clientWidth - 2
      setEdges({ start: list.scrollLeft <= 2, end: list.scrollLeft >= max })
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure) }
    schedule()
    list.addEventListener('scroll', schedule, { passive: true })
    const observer = new ResizeObserver(schedule)
    observer.observe(list)
    const stopDrag = enableMouseDrag(list)
    return () => { cancelAnimationFrame(frame); list.removeEventListener('scroll', schedule); observer.disconnect(); stopDrag() }
  }, [target])

  const move = (direction: -1 | 1) => {
    const list = document.getElementById(target)
    if (!list) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollBy({ left: direction * list.clientWidth * 0.9, behavior: reduce ? 'auto' : 'smooth' })
  }

  if (edges.start && edges.end) return null
  return <div className="hp-rail-controls" role="group" aria-label={`Cuộn ${label}`}>
    <button type="button" aria-controls={target} aria-label="Xem các sản phẩm trước" disabled={edges.start} onClick={() => move(-1)}><ChevronLeft size={18} aria-hidden="true" /></button>
    <button type="button" aria-controls={target} aria-label="Xem thêm sản phẩm" disabled={edges.end} onClick={() => move(1)}><ChevronRight size={18} aria-hidden="true" /></button>
  </div>
}
