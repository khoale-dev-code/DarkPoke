import { NextResponse, type NextRequest } from 'next/server'
import { hasServiceRole, isDemo } from '@/lib/env'
import { serviceClient } from '@/lib/supabase/admin'
import { cleanupTradeinUploads } from '@/features/tradein/server/cleanup'

/** Vercel Cron gọi định kỳ (xem vercel.json). Hoặc dùng pg_cron trong supabase/optional/cron.sql. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 })
  if (isDemo || !hasServiceRole) return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 })
  const { data, error } = await serviceClient().rpc('cancel_expired_orders')
  if (error) return NextResponse.json({ ok: false }, { status: 500 })
  const tradeinUploads = await cleanupTradeinUploads()
  return NextResponse.json({ ok: true, cancelled: data, tradeinUploads })
}
