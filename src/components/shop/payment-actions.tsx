'use client'
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload } from 'lucide-react'
import { confirmTransfer, uploadProof } from '@/lib/actions/checkout'

export function ConfirmTransferButton({ code, token, confirmed }: { code: string; token: string; confirmed: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  if (confirmed) {
    return <p className="rounded-lg bg-brand-subtle p-3 text-center text-sm font-semibold text-brand-ink">Bạn đã báo chuyển khoản. Shop đang đối soát.</p>
  }
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="btn btn-primary btn-lg w-full"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await confirmTransfer(code, token)
            setMsg(r.ok ? { ok: true, text: r.message ?? 'Đã ghi nhận' } : { ok: false, text: r.error })
            if (r.ok) router.refresh()
          })
        }
      >
        {pending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}
        Tôi đã chuyển khoản
      </button>
      {msg ? <p role="status" className={`text-sm ${msg.ok ? 'text-ok' : 'text-bad'}`}>{msg.text}</p> : null}
    </div>
  )
}

export function ProofUpload({ code, token, hasProof }: { code: string; token: string; hasProof: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(hasProof ? { ok: true, text: 'Shop đã nhận ảnh chuyển khoản của bạn.' } : null)
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-[1_1_260px] flex-col">
        <span className="font-semibold">Ảnh chuyển khoản</span>
        <span className="text-sm text-muted">Tải lên ảnh chụp màn hình để shop xác minh nhanh hơn. Không bắt buộc.</span>
        {msg ? <span role="status" className={`mt-1 text-sm ${msg.ok ? 'text-ok' : 'text-bad'}`}>{msg.text}</span> : null}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="sr-only"
        aria-label="Chọn ảnh chuyển khoản"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const fd = new FormData()
          fd.set('code', code)
          fd.set('token', token)
          fd.set('file', file)
          start(async () => {
            const r = await uploadProof(fd)
            setMsg(r.ok ? { ok: true, text: r.message ?? 'Đã tải lên' } : { ok: false, text: r.error })
          })
        }}
      />
      <button type="button" className="btn btn-secondary" disabled={pending} onClick={() => input.current?.click()}>
        {pending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Upload size={18} aria-hidden="true" />}
        Tải ảnh lên
      </button>
    </div>
  )
}
