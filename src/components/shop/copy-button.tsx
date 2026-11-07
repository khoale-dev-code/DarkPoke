'use client'
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon flex-none text-brand"
      aria-label={done ? `Đã sao chép ${label}` : `Sao chép ${label}`}
      title={done ? 'Đã sao chép' : 'Sao chép'}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
        } catch {
          const t = document.createElement('textarea')
          t.value = value
          document.body.appendChild(t)
          t.select()
          document.execCommand('copy')
          t.remove()
        }
        setDone(true)
        setTimeout(() => setDone(false), 1500)
      }}
    >
      {done ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
    </button>
  )
}
