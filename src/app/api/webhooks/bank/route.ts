import { NextResponse, type NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { timingSafeEqual } from 'node:crypto'
import { hasServiceRole, isDemo } from '@/lib/env'
import { serviceClient } from '@/lib/supabase/admin'

/**
 * Webhook đối soát chuyển khoản (SePay, Casso hoặc dịch vụ tương tự).
 * Cấu hình dịch vụ gửi header: Authorization: Apikey <BANK_WEBHOOK_SECRET> (hoặc Bearer).
 * Body tối thiểu: { "content": "DP100123 NGUYEN VAN A", "transferAmount": 3380000, "id": "mã giao dịch", "transferType": "in" }
 */
function authorized(req: NextRequest) {
  const secret = process.env.BANK_WEBHOOK_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization') ?? ''
  const token = header.replace(/^(Apikey|Bearer)\s+/i, '')
  const a = Buffer.from(token)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  if (isDemo || !hasServiceRole) return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 })
  if (!authorized(req)) return NextResponse.json({ ok: false }, { status: 401 })

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 })
  if (String(body.transferType ?? 'in').toLowerCase() !== 'in') return NextResponse.json({ ok: true, skipped: 'outgoing' })

  const content = String(body.content ?? body.description ?? '')
  const amount = Math.round(Number(body.transferAmount ?? body.amount ?? 0))
  const ref = String(body.id ?? body.referenceCode ?? body.tid ?? '')
  const code = content.toUpperCase().match(/DP\d{6,}/)?.[0]
  if (!code || !amount || !ref) return NextResponse.json({ ok: true, skipped: 'no_order_code' })

  const { data, error } = await serviceClient().rpc('mark_order_paid', { p_code: code, p_amount: amount, p_ref: ref })
  if (error) return NextResponse.json({ ok: false, error: 'db' }, { status: 500 })
  revalidateTag('admin-orders', 'max')
  return NextResponse.json({ ok: true, result: data, code })
}
