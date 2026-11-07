import 'server-only'
import { createHash, createHmac, randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { tradeinServiceClient as serviceClient } from './client'
import { hasServiceRole, isDemo } from '@/lib/env'
import type { ActionResult } from '@/lib/types'
import { MAX_PHOTOS, photoDescriptorSchema, serializeTradein, ticketSchema, tradeinSchema, type PhotoDescriptor, type TradeinInput, type UploadTicket } from '../domain'

export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')
export function tradeinError(error: { message?: string } | null) {
  const message = error?.message ?? ''
  if (message.includes('RATE_LIMIT')) return 'Bạn đã gửi nhiều yêu cầu gần đây. Vui lòng thử lại sau một giờ.'
  if (message.includes('UPLOAD_EXPIRED')) return 'Phiên tải ảnh đã hết hạn. Bấm gửi lại để tạo phiên mới; ảnh bạn chọn vẫn được giữ.'
  if (message.includes('MODULE_OFF')) return 'Cửa hàng đang tạm dừng nhận thu mua.'
  if (message.includes('PHOTOS_INCOMPLETE')) return 'Chưa tải đủ ảnh. Bấm gửi lại để tiếp tục từ những ảnh còn thiếu.'
  return 'Chưa gửi được yêu cầu lúc này. Thông tin và ảnh bạn chọn vẫn được giữ để thử lại.'
}
export async function prepare(input: TradeinInput, files: PhotoDescriptor[]): Promise<ActionResult<UploadTicket & { demo?: boolean }>> {
  const values = tradeinSchema.safeParse(input)
  const photos = z.array(photoDescriptorSchema).max(MAX_PHOTOS).safeParse(files)
  if (!values.success) return { ok: false, error: values.error.issues[0]?.message ?? 'Kiểm tra lại thông tin.' }
  if (!photos.success) return { ok: false, error: 'Tối đa 14 ảnh JPG, PNG hoặc WebP; mỗi ảnh không quá 2 MB.' }
  if (photos.data.some(p => !values.data.items.some(i => i.client_id === p.item_id))) return { ok: false, error: 'Ảnh chưa được gắn đúng vật phẩm.' }
  if (isDemo) return { ok: true, data: { id: '00000000-0000-4000-8000-000000000000', token: '0'.repeat(64), demo: true } }
  if (!hasServiceRole) return { ok: false, error: 'Cửa hàng chưa bật nhận yêu cầu kèm ảnh. Vui lòng liên hệ shop để được hỗ trợ.' }
  try {
    const sb = await createClient(); const { data: { user } } = await sb.auth.getUser()
    const h = await headers(); const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
    const fingerprint = createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!).update(`tradein:${ip}`).digest('hex')
    const token = randomBytes(32).toString('hex')
    const { data, error } = await serviceClient().rpc('prepare_tradein_upload', { p_payload: serializeTradein(values.data), p_files: photos.data, p_user_id: user?.id ?? null, p_fingerprint: fingerprint, p_token_hash: tokenHash(token) })
    if (error || !data) return { ok: false, error: tradeinError(error) }
    return { ok: true, data: { id: data, token } }
  } catch { return { ok: false, error: tradeinError(null) } }
}
export async function finish(input: UploadTicket): Promise<ActionResult<{ code: string }>> {
  const v = ticketSchema.safeParse(input)
  if (!v.success) return { ok: false, error: 'Phiên gửi không hợp lệ. Vui lòng thử lại.' }
  if (isDemo) return { ok: true, data: { code: 'TM-DEMO' } }
  if (!hasServiceRole) return { ok: false, error: tradeinError(null) }
  try {
    const {data,error} = await serviceClient().rpc('complete_tradein_upload', { p_session: v.data.id, p_token_hash: tokenHash(v.data.token) })
    if (error || !data) return { ok: false, error: tradeinError(error) }
    return { ok: true, data: { code: data } }
  } catch { return { ok: false, error: tradeinError(null) } }
}
