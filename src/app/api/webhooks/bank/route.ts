import { NextResponse, type NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { hasServiceRole, isDemo } from '@/lib/env'
import { serviceClient } from '@/lib/supabase/admin'

/**
 * Webhook đối soát chuyển khoản (SePay, Casso hoặc dịch vụ tương tự).
 * Xác thực bằng BANK_WEBHOOK_SECRET, một trong hai cách:
 * - API Key: header `Authorization: Apikey <BANK_WEBHOOK_SECRET>` (hoặc `Bearer`).
 * - HMAC-SHA256 (SePay): `X-SePay-Signature: sha256=<hex>` ký trên `{X-SePay-Timestamp}.{body gốc}`, lệch giờ tối đa 5 phút.
 * Body SePay: { id, content, code, transferType: "in", transferAmount, referenceCode, ... }.
 * V14.30: mọi phản hồi 2xx có `"success": true` vì SePay chỉ coi là thành công khi nhận đúng body này (nếu không sẽ gửi lại tối đa 7 lần).
 */
const MAX_SKEW_SECONDS = 300

const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

function authorized(req: NextRequest, raw: string) {
  const secret = process.env.BANK_WEBHOOK_SECRET
  if (!secret) return false
  const signature = req.headers.get('x-sepay-signature')
  if (signature) {
    const timestamp = req.headers.get('x-sepay-timestamp') ?? ''
    const seconds = Number(timestamp)
    if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > MAX_SKEW_SECONDS) return false
    const expected = 'sha256=' + createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex')
    return same(signature.trim().toLowerCase(), expected)
  }
  const token = (req.headers.get('authorization') ?? '').replace(/^(Apikey|Bearer)\s+/i, '').trim()
  return same(token, secret)
}

const done = (extra: Record<string, unknown> = {}) => NextResponse.json({ success: true, ok: true, ...extra })
const fail = (status: number, error: string) => NextResponse.json({ success: false, ok: false, error }, { status })

export async function POST(req: NextRequest) {
  if (isDemo || !hasServiceRole) return fail(503, 'not_configured')
  const raw = await req.text()
  if (!authorized(req, raw)) return fail(401, 'unauthorized')

  let body: Record<string, unknown> | null = null
  try { body = JSON.parse(raw) as Record<string, unknown> } catch { body = null }
  if (!body || typeof body !== 'object') return fail(400, 'bad_json')
  if (String(body.transferType ?? 'in').toLowerCase() !== 'in') return done({ skipped: 'outgoing' })

  const content = String(body.content ?? body.description ?? '')
  const amount = Math.round(Number(body.transferAmount ?? body.amount ?? 0))
  const ref = String(body.id ?? body.referenceCode ?? body.tid ?? '')
  // SePay tách sẵn mã thanh toán vào `code` nếu bạn khai báo tiền tố "DP"; nếu không thì tìm trong nội dung chuyển khoản.
  const code = [body.code, content].map((value) => String(value ?? '').toUpperCase().match(/DP[\s.-]?\d{6,}/)?.[0]?.replace(/[\s.-]/g, '')).find(Boolean)
  // Giao dịch không có mã đơn vẫn trả success để SePay không gửi lại; đơn đó đối soát tay trong trang quản trị.
  if (!code || !amount || !ref) return done({ skipped: 'no_order_code' })

  const { data, error } = await serviceClient().rpc('mark_order_paid', { p_code: code, p_amount: amount, p_ref: ref })
  if (error) return fail(500, 'db')
  revalidateTag('admin-orders', 'max')
  return done({ result: data, code })
}
