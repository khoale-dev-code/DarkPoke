import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isDemo } from '@/lib/env'

export async function POST(req: NextRequest) {
  if (!isDemo) {
    const sb = await createClient()
    await sb.auth.signOut()
  }
  const to = req.nextUrl.searchParams.get('to') === 'admin' ? '/admin/dang-nhap' : '/'
  return NextResponse.redirect(new URL(to, req.nextUrl.origin), { status: 303 })
}
