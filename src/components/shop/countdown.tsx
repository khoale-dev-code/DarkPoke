'use client'
import { useEffect, useState } from 'react'

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return [h, m, ss].map((n) => String(n).padStart(2, '0')).join(':')
}

/** Đồng hồ giữ đơn. Render rỗng ở server để không lệch giờ khi hydrate. */
export function Countdown({ until }: { until: string }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const first = setTimeout(tick, 0)
    const t = setInterval(tick, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(t)
    }
  }, [])
  const left = now === null ? null : new Date(until).getTime() - now
  return (
    <span className="price tabular-nums" role="timer" aria-live="off">
      {left === null ? '--:--:--' : left <= 0 ? 'Hết hạn' : fmt(left)}
    </span>
  )
}
