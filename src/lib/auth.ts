import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { isDemo } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import { DEMO_STAFF } from '@/lib/demo'
import type { Staff, StaffRole } from '@/lib/types'

/** Người dùng đang đăng nhập (khách hoặc nhân viên). Xác thực chữ ký JWT bằng getClaims. */
export const getCurrentUser = cache(async () => {
  if (isDemo) return null
  const sb = await createClient()
  const { data } = await sb.auth.getClaims()
  const c = data?.claims
  if (!c?.sub) return null
  return { id: c.sub as string, email: (c.email as string | undefined) ?? '' }
})

/** Nhân viên đang đăng nhập, null nếu không phải nhân viên. Chế độ demo: trả về chủ shop mẫu để xem giao diện. */
export const getStaff = cache(async (): Promise<Staff | null> => {
  if (isDemo) return DEMO_STAFF[0] ?? null
  const user = await getCurrentUser()
  if (!user) return null
  const sb = await createClient()
  const { data } = await sb.from('staff').select('*').eq('user_id', user.id).eq('active', true).maybeSingle()
  return (data as Staff | null) ?? null
})

export async function requireStaff(roles?: StaffRole[]) {
  const staff = await getStaff()
  if (!staff) redirect('/admin/dang-nhap?error=not_staff')
  if (roles && !roles.includes(staff.role)) redirect('/admin?error=forbidden')
  return staff
}

export const canManage = (s: Staff | null) => s?.role === 'owner' || s?.role === 'manager'
