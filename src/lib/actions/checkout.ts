'use server'
import { z } from 'zod'
import { DEMO_MESSAGE, hasServiceRole, isDemo } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/admin'
import { dbError } from '@/lib/labels'
import type { ActionResult } from '@/lib/types'

const checkoutSchema = z.object({
  items: z.array(z.object({ variant_id: z.uuid(), qty: z.number().int().min(1).max(99) })).min(1).max(50),
  customer: z.object({
    name: z.string().trim().min(2, 'Vui lòng nhập họ tên').max(120),
    phone: z.string().trim().regex(/^(0|\+84)[0-9]{9,10}$/, 'Số điện thoại chưa đúng, ví dụ 0901234567'),
    email: z.union([z.literal(''), z.email('Email chưa đúng')]),
    province: z.string().trim().max(80),
    address: z.string().trim().max(300)
  }),
  fulfillment: z.enum(['delivery', 'pickup']),
  note: z.string().trim().max(500)
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

/** Đặt hàng: giá, tồn kho, phí ship tính lại ở database (RPC place_order), client chỉ gửi id biến thể và số lượng. */
export async function placeOrder(input: CheckoutInput): Promise<ActionResult<{ url: string }>> {
  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Thông tin chưa hợp lệ' }
  const v = parsed.data
  if (v.fulfillment === 'delivery' && (v.customer.address.length < 5 || !v.customer.province)) {
    return { ok: false, error: 'Vui lòng nhập đủ địa chỉ và tỉnh, thành phố.' }
  }
  if (isDemo) return { ok: true, data: { url: '/don-hang/DP100118?t=demo' }, message: DEMO_MESSAGE }

  const sb = await createClient()
  const { data, error } = await sb.rpc('place_order', {
    p_items: v.items,
    p_customer: v.customer,
    p_fulfillment: v.fulfillment,
    p_note: v.note || null
  })
  if (error) return { ok: false, error: dbError(error) }
  const row = (Array.isArray(data) ? data[0] : data) as { order_code: string; order_token: string } | undefined
  if (!row) return { ok: false, error: 'Không tạo được đơn, vui lòng thử lại.' }
  return { ok: true, data: { url: `/don-hang/${row.order_code}?t=${row.order_token}` } }
}

const tokenSchema = z.object({ code: z.string().regex(/^DP\d{4,12}$/), token: z.uuid() })

export async function confirmTransfer(code: string, token: string): Promise<ActionResult> {
  if (isDemo) return { ok: true, message: DEMO_MESSAGE }
  const p = tokenSchema.safeParse({ code, token })
  if (!p.success) return { ok: false, error: 'Đơn hàng không hợp lệ.' }
  const sb = await createClient()
  const { error } = await sb.rpc('confirm_transfer', { p_code: code, p_token: token })
  if (error) return { ok: false, error: dbError(error) }
  return { ok: true, message: 'Đã ghi nhận. Shop sẽ đối soát và báo cho bạn sớm.' }
}

/** Khách tải ảnh chuyển khoản. Dùng service role sau khi kiểm tra mã đơn + token. */
export async function uploadProof(formData: FormData): Promise<ActionResult> {
  if (isDemo) return { ok: true, message: DEMO_MESSAGE }
  if (!hasServiceRole) return { ok: false, error: 'Shop chưa bật tải ảnh chuyển khoản. Bạn gửi ảnh qua Zalo giúp shop nhé.' }
  const p = tokenSchema.safeParse({ code: formData.get('code'), token: formData.get('token') })
  const file = formData.get('file')
  if (!p.success || !(file instanceof File)) return { ok: false, error: 'Dữ liệu không hợp lệ.' }
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: 'Ảnh tối đa 5MB.' }
  if (!/^image\/(jpeg|png|webp|heic)$/.test(file.type)) return { ok: false, error: 'Chỉ nhận ảnh JPG, PNG, WEBP hoặc HEIC.' }

  const admin = serviceClient()
  const { data: order } = await admin.from('orders').select('id,code').eq('code', p.data.code).eq('access_token', p.data.token).maybeSingle()
  if (!order) return { ok: false, error: 'Không tìm thấy đơn hàng.' }
  const ext = file.type.split('/')[1]
  const path = `${order.code}/${Date.now()}.${ext}`
  const up = await admin.storage.from('payment-proofs').upload(path, file, { contentType: file.type, upsert: false })
  if (up.error) return { ok: false, error: 'Tải ảnh chưa được, vui lòng thử lại.' }
  await admin.from('orders').update({ proof_path: path }).eq('id', order.id)
  await admin.from('order_events').insert({ order_id: order.id, message: 'Khách tải ảnh chuyển khoản', actor: 'customer' })
  return { ok: true, message: 'Đã nhận ảnh chuyển khoản.' }
}
