'use client'
import { useActionState, useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { adminLogin } from '@/lib/actions/auth'

export function AdminLoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(adminLogin, null)
  const [show, setShow] = useState(false)
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-1.5">
        <span className="label">Email</span>
        <input name="email" type="email" required autoComplete="username" className="input" placeholder="ten@darkpoke.vn" autoCapitalize="none" spellCheck={false} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Mật khẩu</span>
        <span className="input gap-2 px-0 pl-3">
          <input name="password" type={show ? 'text' : 'password'} required minLength={6} placeholder="Nhập mật khẩu" autoComplete="current-password" className="min-w-0 flex-1 bg-transparent outline-none" />
          <button type="button" className="btn btn-ghost btn-icon min-h-10" aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShow((s) => !s)}>
            {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </span>
      </label>
      {state?.error ? <p role="alert" className="text-sm text-bad">{state.error}</p> : null}
      <button type="submit" className="btn btn-primary btn-lg" disabled={pending}>
        {pending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}Đăng nhập
      </button>
      <p className="text-center text-xs text-muted">Quên mật khẩu? Nhờ chủ shop gửi lại email mời ở mục Nhân viên.</p>
    </form>
  )
}
