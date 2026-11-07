import type { Database } from '@/lib/database.types'
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/** Làm mới phiên đăng nhập và chặn sớm khu vực quản trị khi chưa đăng nhập (kiểm tra quyền thật ở layout). */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.next({ request })

  let response = NextResponse.next({ request })
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list, headers) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v))
      }
    }
  })

  const { data } = await supabase.auth.getClaims()
  const path = request.nextUrl.pathname
  const needsStaff = (path.startsWith('/admin') && !path.startsWith('/admin/dang-nhap')) || path.startsWith('/pos')
  if (needsStaff && !data?.claims) {
    const to = request.nextUrl.clone()
    to.pathname = '/admin/dang-nhap'
    to.search = `?next=${encodeURIComponent(path)}`
    return NextResponse.redirect(to)
  }
  if (path.startsWith('/tai-khoan') && !data?.claims) {
    const to = request.nextUrl.clone()
    to.pathname = '/dang-nhap'
    to.search = ''
    return NextResponse.redirect(to)
  }
  return response
}
