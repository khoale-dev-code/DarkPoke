'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ActionButton } from '@/components/admin/action-button'
import { deleteStaff, inviteStaff, updateStaff } from '@/lib/actions/admin'
import { ROLE_LABEL } from '@/lib/labels'
import type { Staff, StaffRole } from '@/lib/types'

export function StaffRowActions({ s, isMe }: { s: Staff; isMe: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [err, setErr] = useState<string | null>(null)
  const run = (patch: Parameters<typeof updateStaff>[1]) => start(async () => { const r = await updateStaff(s.id, patch); setErr(r.ok ? null : r.error); if (r.ok) router.refresh() })
  return (
    <span className="flex flex-wrap items-center gap-2">
      <select className="input min-h-9 w-auto py-0 text-sm" value={s.role} disabled={pending || isMe} aria-label={`Vai trò của ${s.email}`} onChange={(e) => run({ role: e.target.value as StaffRole })}>
        {(Object.keys(ROLE_LABEL) as StaffRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
      </select>
      <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => run({ allow_google: !s.allow_google })}>{s.allow_google ? 'Tắt Google' : 'Cho Google'}</button>
      {!isMe ? <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => run({ active: !s.active })}>{s.active ? 'Khóa' : 'Mở khóa'}</button> : null}
      {!isMe ? (
        <ActionButton action={deleteStaff.bind(null, s.id)} className="btn btn-ghost btn-sm text-bad" confirm={{ title: `Xóa nhân viên ${s.email}?`, text: 'Người này sẽ không vào được trang quản trị. Lịch sử đơn vẫn giữ.', confirmLabel: 'Xóa nhân viên', danger: true }}>Xóa</ActionButton>
      ) : null}
      {pending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
      {err ? <span role="alert" className="text-sm text-bad">{err}</span> : null}
    </span>
  )
}

export function InviteStaffForm() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [f, setF] = useState({ email: '', full_name: '', role: 'cashier' as StaffRole, allow_google: true, send_invite: true })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <form
      className="card flex flex-col gap-4 p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const r = await inviteStaff(f)
          setMsg(r.ok ? { ok: true, text: r.message ?? 'Đã thêm' } : { ok: false, text: r.error })
          if (r.ok) { setF({ ...f, email: '', full_name: '' }); router.refresh() }
        })
      }}
    >
      <h2 className="font-display text-lg font-bold">Mời nhân viên</h2>
      <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <label className="flex flex-col gap-1.5"><span className="label">Email *</span><input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="flex flex-col gap-1.5"><span className="label">Họ tên</span><input className="input" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></label>
        <label className="flex flex-col gap-1.5"><span className="label">Vai trò</span>
          <select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as StaffRole })}>
            {(Object.keys(ROLE_LABEL) as StaffRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select></label>
      </div>
      <label className="flex items-center justify-between gap-4"><span className="flex flex-col"><span className="label">Cho đăng nhập bằng Google</span><span className="hint">Đúng email này trên Google</span></span><input type="checkbox" className="switch" checked={f.allow_google} onChange={(e) => setF({ ...f, allow_google: e.target.checked })} /></label>
      <label className="flex items-center justify-between gap-4"><span className="flex flex-col"><span className="label">Gửi email mời đặt mật khẩu</span><span className="hint">Gửi hướng dẫn đặt mật khẩu đến đúng email đã nhập</span></span><input type="checkbox" className="switch" checked={f.send_invite} onChange={(e) => setF({ ...f, send_invite: e.target.checked })} /></label>
      {msg ? <p role="status" className={`text-sm ${msg.ok ? 'text-ok' : 'text-bad'}`}>{msg.text}</p> : null}
      <button type="submit" className="btn btn-primary self-start" disabled={pending}>{pending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}Thêm nhân viên</button>
    </form>
  )
}
