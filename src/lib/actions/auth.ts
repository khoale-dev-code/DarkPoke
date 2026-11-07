'use server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { isDemo } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({ email: z.email(), password: z.string().min(6).max(200) })

export async function adminLogin(_prev: { error: string } | null, formData: FormData): Promise<{ error: string } | null> {
  if (isDemo) redirect('/admin')
  const p = schema.safeParse({ email: String(formData.get('email') ?? '').trim().toLowerCase(), password: formData.get('password') })
  if (!p.success) return { error: 'Email hoặc mật khẩu chưa đúng định dạng.' }
  const sb = await createClient()
  const { error } = await sb.auth.signInWithPassword(p.data)
  if (error) return { error: 'Email hoặc mật khẩu không đúng.' }
  const { data: role } = await sb.rpc('claim_staff')
  if (!role) {
    await sb.auth.signOut()
    return { error: 'Tài khoản này chưa được mời vào trang quản trị. Liên hệ chủ shop.' }
  }
  const next = String(formData.get('next') ?? '/admin')
  redirect(next.startsWith('/admin') || next.startsWith('/pos') ? next : '/admin')
}
