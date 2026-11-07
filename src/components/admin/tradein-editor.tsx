'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { updateTradein } from '@/lib/actions/admin'
import { TRADEIN_STATUS } from '@/lib/labels'
import { formatDateTime } from '@/lib/utils'
import type { TradeinRequest, TradeinStatus } from '@/lib/types'

export function TradeinEditor({ t }: { t: TradeinRequest }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [status, setStatus] = useState<TradeinStatus>(t.status === 'new' ? 'quoted' : t.status)
  const [quote, setQuote] = useState(t.quoted_total ? String(t.quoted_total) : '')
  const [note, setNote] = useState(t.staff_note ?? '')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <form
      className="grid items-end gap-3 border-t border-line pt-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_2fr_auto]"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const r = await updateTradein(t.id, { status, quoted_total: quote ? Number(quote) : null, staff_note: note })
          setMsg(r.ok ? { ok: true, text: 'Đã cập nhật.' } : { ok: false, text: r.error })
          if (r.ok) router.refresh()
        })
      }}
    >
      <label className="flex flex-col gap-1.5"><span className="label">Báo giá</span><input className="input" inputMode="numeric" value={quote} onChange={(e) => setQuote(e.target.value.replace(/\D/g, ''))} placeholder="Tổng tiền ₫" /></label>
      <label className="flex flex-col gap-1.5"><span className="label">Trạng thái</span>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as TradeinStatus)}>
          {(Object.keys(TRADEIN_STATUS) as TradeinStatus[]).map((s) => <option key={s} value={s}>{TRADEIN_STATUS[s].label}</option>)}
        </select></label>
      <label className="flex flex-col gap-1.5"><span className="label">Ghi chú nội bộ</span><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tình trạng thực tế, lý do giá" /></label>
      <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}Lưu</button>
      {t.quote_expires_at ? <p className="text-sm text-muted sm:col-span-2 xl:col-span-4">Báo giá hiệu lực tới {formatDateTime(t.quote_expires_at)}</p> : null}
      {msg ? <p role="status" className={`text-sm sm:col-span-2 xl:col-span-4 ${msg.ok ? 'text-ok' : 'text-bad'}`}>{msg.text}</p> : null}
    </form>
  )
}
