export interface CarouselState {
  count: number
  index: number
  previous: number | null
  pending: number | null
  ready: number[]
  failed: number[]
  attempts: number[]
}
export type CarouselAction = { type: 'request' | 'ready' | 'failed'; index: number } | { type: 'step'; delta: number }

export function initialCarousel(count: number): CarouselState {
  return { count, index: 0, previous: null, pending: null, ready: [], failed: [], attempts: Array(count).fill(0) as number[] }
}
export function wrapSlide(index: number, count: number) {
  return count > 0 && Number.isSafeInteger(index) ? ((index % count) + count) % count : 0
}
function commit(state: CarouselState, index: number): CarouselState {
  return { ...state, index, previous: index === state.index ? state.previous : state.index, pending: null }
}
function request(state: CarouselState, index: number): CarouselState {
  index = wrapSlide(index, state.count)
  if (state.ready.includes(index)) return commit(state, index)
  const retry = state.failed.includes(index)
  return { ...state, pending: index, failed: state.failed.filter(value => value !== index), attempts: state.attempts.map((value, i) => i === index && retry ? value + 1 : value) }
}
export function carouselReducer(state: CarouselState, action: CarouselAction): CarouselState {
  if (action.type === 'step') return request(state, (state.pending ?? state.index) + action.delta)
  if (action.type === 'request') return request(state, action.index)
  if (action.index < 0 || action.index >= state.count) return state
  if (action.type === 'ready') {
    const next = { ...state, ready: [...new Set([...state.ready, action.index])], failed: state.failed.filter(index => index !== action.index) }
    return state.pending === action.index || (state.pending === null && state.failed.includes(state.index)) ? commit(next, action.index) : next
  }
  return { ...state, ready: state.ready.filter(index => index !== action.index), failed: [...new Set([...state.failed, action.index])], pending: state.pending === action.index ? null : state.pending }
}
export function nextCandidate(state: CarouselState): number | null {
  for (let offset = 1; offset < state.count; offset++) {
    const index = wrapSlide(state.index + offset, state.count)
    if (!state.failed.includes(index)) return index
  }
  return null
}
export function mountedSlides(state: CarouselState, preload: boolean): number[] {
  // Retain decoded slides after their first visit; looping never reveals an unmounted image.
  return [...new Set([state.index, ...state.ready, state.previous, state.pending, preload ? nextCandidate(state) : null].filter((index): index is number => index !== null))]
}
export function canAutoRotate(state: CarouselState, enabled: boolean) {
  const next = nextCandidate(state)
  return enabled && state.pending === null && next !== null && state.ready.includes(state.index) && state.ready.includes(next)
}

export function swipeDirection(dx: number, dy: number): -1 | 0 | 1 {
  return Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.3 ? dx < 0 ? 1 : -1 : 0
}
