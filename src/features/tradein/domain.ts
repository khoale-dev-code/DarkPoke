import { z } from 'zod'

export const MAX_PHOTOS = 14
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024
export const PHOTO_BUCKET = 'tradein-photos'
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const CONDITIONS = [
  { value: 'NM', label: 'Gần như mới', detail: 'Bề mặt, góc và cạnh còn đẹp' },
  { value: 'LP', label: 'Xước nhẹ', detail: 'Có dấu sử dụng nhẹ' },
  { value: 'MP', label: 'Xước rõ', detail: 'Có nhiều dấu sử dụng' },
  { value: 'HP', label: 'Hư hại / xước nhiều', detail: 'Cong, móp hoặc hư hại dễ thấy' },
  { value: 'Seal', label: 'Còn nguyên niêm phong', detail: 'Chưa mở sản phẩm' },
  { value: 'Grading', label: 'Đã được chấm điểm', detail: 'Thẻ trong hộp của đơn vị chấm điểm' },
  { value: 'OTHER', label: 'Khác', detail: 'Tự mô tả tình trạng bên dưới' }
] as const

export const itemSchema = z.object({
  client_id: z.string().regex(/^item-[a-zA-Z0-9-]{1,64}$/),
  name: z.string().trim().min(2, 'Nhập tên vật phẩm, ít nhất 2 ký tự.').max(200, 'Tên tối đa 200 ký tự.'),
  condition: z.enum(['NM', 'LP', 'MP', 'HP', 'Seal', 'Grading', 'OTHER']),
  condition_note: z.string().trim().max(500, 'Mô tả tối đa 500 ký tự.'),
  qty: z.number({error:'Nhập số lượng hợp lệ.'}).int('Số lượng phải là số nguyên.').min(1, 'Số lượng ít nhất là 1.').max(999, 'Số lượng tối đa là 999.'),
  expected: z.string().regex(/^\d{0,12}$/, 'Chỉ nhập số, tối đa 12 chữ số.')
}).superRefine((item, ctx) => {
  if (item.condition === 'OTHER' && item.condition_note.length < 5) ctx.addIssue({ code: 'custom', path: ['condition_note'], message: 'Mô tả tình trạng ít nhất 5 ký tự.' })
})
export const tradeinSchema = z.object({
  items: z.array(itemSchema).min(1, 'Thêm ít nhất một vật phẩm.').max(50, 'Tối đa 50 vật phẩm.').refine(a => new Set(a.map(i => i.client_id)).size === a.length, 'Mã vật phẩm bị trùng.'),
  name: z.string().trim().min(2, 'Nhập họ tên để shop liên hệ.').max(120),
  phone: z.string().transform(v => v.replace(/[\s.()-]/g, '')).pipe(z.string().regex(/^(0|\+84)[0-9]{9,10}$/, 'Số điện thoại chưa đúng, ví dụ 0901234567.')),
  email: z.union([z.literal(''), z.email('Email chưa đúng.')]),
  method: z.enum(['store', 'ship']), payout: z.enum(['cash', 'credit']),
  note: z.string().trim().max(1000, 'Ghi chú tối đa 1.000 ký tự.')
})
export type TradeinInput = z.input<typeof tradeinSchema>
export type TradeinValues = z.output<typeof tradeinSchema>
export const photoDescriptorSchema = z.object({
  item_id: itemSchema.shape.client_id,
  name: z.string().min(1).max(180),
  size: z.number().int().min(1).max(MAX_PHOTO_BYTES),
  mime: z.enum(PHOTO_TYPES),
  sha256: z.string().regex(/^[a-f0-9]{64}$/)
})
export type PhotoDescriptor = z.infer<typeof photoDescriptorSchema>
export const ticketSchema = z.object({ id: z.uuid(), token: z.string().regex(/^[a-f0-9]{64}$/) })
export type UploadTicket = z.infer<typeof ticketSchema>
export const storedPhotoSchema = photoDescriptorSchema.extend({ slot: z.number().int().min(0).max(13), path: z.string().regex(/^[a-f0-9-]{36}\/(?:[0-9]|1[0-3])\.(?:jpg|png|webp)$/) })
export type StoredPhoto = z.infer<typeof storedPhotoSchema>
export function parsePhotos(value: unknown): StoredPhoto[] { const r = z.array(storedPhotoSchema).max(MAX_PHOTOS).safeParse(value); return r.success ? r.data : [] }
export function conditionLabel(value?: string) { return CONDITIONS.find(c => c.value === value)?.label ?? value ?? '' }
export function blankItem(client_id = 'item-1'): TradeinInput['items'][number] { return { client_id, name: '', condition: 'NM', condition_note: '', qty: 1, expected: '' } }
export function photoFileError(file: Pick<File, 'name' | 'size' | 'type'>) {
  if (!PHOTO_TYPES.includes(file.type as typeof PHOTO_TYPES[number])) return `${file.name}: chỉ nhận ảnh JPG, PNG hoặc WebP.`
  if (file.size <= 0) return `${file.name}: ảnh trống hoặc không đọc được.`
  if (file.size > MAX_PHOTO_BYTES) return `${file.name}: vượt 2 MB. Hãy giảm dung lượng trước khi thêm.`
  return null
}
export function serializeTradein(v: TradeinValues) {
  return { ...v, items: v.items.map(i => ({ client_id: i.client_id, name: i.name, condition: i.condition, condition_note: i.condition === 'OTHER' ? i.condition_note : '', qty: i.qty, expected: i.expected ? Number(i.expected) : null })) }
}
