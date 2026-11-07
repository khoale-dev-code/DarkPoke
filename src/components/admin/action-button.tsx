'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { ActionResult } from '@/lib/types'
interface Props { action: () => Promise<ActionResult<unknown>>; children: React.ReactNode; className?: string; confirm?: { title: string; text: string; confirmLabel: string; danger?: boolean }; ariaLabel?: string; onDone?: () => void }
export function ActionButton({ action, children, className = 'btn btn-secondary', confirm, ariaLabel, onDone }: Props) {
  const router = useRouter()
  const [open,setOpen] = useState(false)
  const [pending,start] = useTransition()
  const [msg,setMsg] = useState<string | null>(null)
  const run = () => start(async () => {
    setMsg(null)
    try { const r = await action(); if (!r.ok) { setMsg(r.error); return }; setOpen(false); onDone?.(); router.refresh() }
    catch { setMsg('Chưa kết nối được máy chủ. Kiểm tra mạng rồi thử lại.') }
  })
  return <><button type="button" className={className} disabled={pending} aria-busy={pending} aria-label={ariaLabel} onClick={() => confirm ? (setMsg(null), setOpen(true)) : run()}>{pending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}{children}</button>{msg && !confirm ? <span role="alert" className="text-sm text-bad">{msg}</span> : null}{confirm ? <Dialog open={open} onOpenChange={(v) => { if (!pending) setOpen(v) }}><DialogContent><span className={`mb-4 flex size-11 items-center justify-center rounded-xl ${confirm.danger ? 'bg-bad-bg text-bad' : 'bg-brand-subtle text-brand'}`}><AlertTriangle size={22} aria-hidden="true" /></span><DialogTitle className="pr-5 text-lg font-semibold">{confirm.title}</DialogTitle><DialogDescription className="mt-3 text-sm leading-relaxed text-muted">{confirm.text}</DialogDescription>{msg ? <p role="alert" className="mt-4 rounded-lg bg-bad-bg p-3 text-sm text-bad">{msg}</p> : null}<div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" className="btn btn-secondary" disabled={pending} onClick={() => setOpen(false)}>Quay lại</button><button type="button" className={`btn ${confirm.danger ? 'btn-danger' : 'btn-primary'}`} disabled={pending} onClick={run}>{pending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}{confirm.confirmLabel}</button></div></DialogContent></Dialog> : null}</>
}
