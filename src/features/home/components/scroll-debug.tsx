'use client'

export type ScrollMode = 'auto' | 'smooth' | 'native'
export type ScrollStatus = 'loading' | 'ready' | 'native' | 'reduced-motion' | 'error'
const LABELS: Record<ScrollStatus, string> = { loading: 'Đang bật…', ready: 'Lenis đang chạy', native: 'Cuộn gốc', 'reduced-motion': 'Máy đang bật giảm chuyển động', error: 'Đang dùng cuộn gốc · xem Console' }

/** A development-only A/B control, omitted from the production page. */
export function HomeScrollDebug({ mode, status, change }: { mode: ScrollMode; status: ScrollStatus; change: (mode: ScrollMode) => void }) {
  return <aside data-lenis-prevent className="home-scroll-debug" aria-label="Kiểm tra cuộn trong development">
    <p>Thử cuộn bằng chuột / touchpad</p>
    <div>{([['auto', 'Theo máy'], ['smooth', 'Mượt'], ['native', 'Gốc']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => change(value)}>{label}</button>)}</div>
    <small role="status">{LABELS[status]}</small>
  </aside>
}
