import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { isDemo, hasServiceRole, SITE_URL } from '@/lib/env'
import { tradeinServiceClient as serviceClient } from '@/features/tradein/server/client'
import { MAX_PHOTO_BYTES, PHOTO_BUCKET, parsePhotos, ticketSchema } from '@/features/tradein/domain'
import { tokenHash, tradeinError } from '@/features/tradein/server/submissions'
import { boundedFormData, imageMime } from '@/features/tradein/server/photo-validation'
export const runtime = 'nodejs'
export const maxDuration = 30
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin && origin !== new URL(SITE_URL).origin) return json({error:'Yêu cầu không hợp lệ.'},403)
  if (isDemo || !hasServiceRole) return json({error:'Tải ảnh hiện chưa khả dụng.'},503)
  const ticket = ticketSchema.safeParse({id:request.headers.get('x-tradein-id'),token:request.headers.get('x-tradein-token')})
  const rawSlot = request.headers.get('x-tradein-slot') ?? ''
  if (!ticket.success || !/^(?:[0-9]|1[0-3])$/.test(rawSlot)) return json({error:'Phiên tải ảnh không hợp lệ.'},400)
  try {
    const sb = serviceClient(); const hash = tokenHash(ticket.data.token)
    const {data:session,error} = await sb.from('tradein_upload_sessions').select('manifest,expires_at,completed_code').eq('id',ticket.data.id).eq('token_hash',hash).maybeSingle()
    if (error || !session || session.completed_code || Date.parse(session.expires_at) <= Date.now()) return json({error:'Phiên tải ảnh đã hết hạn. Vui lòng gửi lại.',code:'UPLOAD_EXPIRED'},410)
    const photo = parsePhotos(session.manifest).find(p => p.slot === Number(rawSlot))
    if (!photo) return json({error:'Ảnh vượt số lượng đã đăng ký.'},400)
    const form = await boundedFormData(request); const entries = [...form.entries()]; const file = form.get('file')
    if (entries.length !== 1 || !(file instanceof File) || file.size < 1 || file.size > MAX_PHOTO_BYTES || file.size !== photo.size) return json({error:'Mỗi lần chỉ gửi một ảnh, tối đa 2 MB.'},413)
    const bytes = new Uint8Array(await file.arrayBuffer()); const mime = imageMime(bytes)
    if (!mime || mime !== photo.mime || mime !== file.type || createHash('sha256').update(bytes).digest('hex') !== photo.sha256) return json({error:'Nội dung ảnh không khớp hoặc định dạng không được hỗ trợ.'},415)
    const bucket = sb.storage.from(PHOTO_BUCKET)
    const upload = await bucket.upload(photo.path,bytes,{contentType:mime,upsert:false,cacheControl:'3600'})
    if (upload.error) {
      const previous = await bucket.download(photo.path)
      if (!previous.data || createHash('sha256').update(new Uint8Array(await previous.data.arrayBuffer())).digest('hex') !== photo.sha256) return json({error:'Chưa tải được ảnh. Vui lòng thử lại.'},503)
    }
    const ready = await sb.rpc('mark_tradein_photo_ready',{p_session:ticket.data.id,p_token_hash:hash,p_slot:photo.slot})
    if (ready.error) return json({error:tradeinError(ready.error)},409)
    return json({ok:true,slot:photo.slot})
  } catch (error) {
    if (error instanceof Error && error.message === 'PHOTO_TOO_LARGE') return json({error:'Ảnh vượt 2 MB.'},413)
    return json({error:'Chưa tải được ảnh. Ảnh đã chọn được giữ để bạn thử lại.'},503)
  }
}
