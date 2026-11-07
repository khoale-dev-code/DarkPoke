import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Google trả về đây kèm mã đăng nhập. Khu quản trị chỉ cho email đã được mời. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const code = url.searchParams.get('code')
  const rawNext = url.searchParams.get('next') ?? '/tai-khoan'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/tai-khoan'
  const isAdmin = next.startsWith('/admin') || next.startsWith('/pos')
  const fail = new URL(isAdmin ? '/admin/dang-nhap?error=oauth' : '/dang-nhap?error=oauth', url.origin)
  if (!code) return NextResponse.redirect(fail)

  const sb = await createClient()
  const { error } = await sb.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(fail)

  if (isAdmin) {
    const { data: role } = await sb.rpc('claim_staff')
    if (!role) {
      await sb.auth.signOut()
      return NextResponse.redirect(new URL('/admin/dang-nhap?error=not_invited', url.origin))
    }
  }
  return NextResponse.redirect(new URL(next, url.origin))
}
