'use server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { settingSchemas } from '@/lib/schemas/settings'
import { productSchema, type ProductInput } from '@/lib/schemas/product'
import { getStaff } from '@/lib/auth'
import { CATALOG_TAG, SETTINGS_TAG } from '@/lib/catalog'
import { DEMO_MESSAGE, hasServiceRole, isDemo, SITE_URL } from '@/lib/env'
import { dbError } from '@/lib/labels'
import { serviceClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import type { ActionResult, OrderStatus, StaffRole, TradeinStatus } from '@/lib/types'

type Fail = { ok: false; error: string }

async function guard(roles?: StaffRole[]): Promise<Fail | null> {
  if (isDemo) return { ok: false, error: DEMO_MESSAGE }
  const s = await getStaff()
  if (!s) return { ok: false, error: 'Phiên đăng nhập đã hết, vui lòng đăng nhập lại.' }
  if (roles && !roles.includes(s.role)) return { ok: false, error: 'Tài khoản không có quyền thực hiện thao tác này.' }
  return null
}
const MANAGER: StaffRole[] = ['owner', 'manager']
const OWNER: StaffRole[] = ['owner']

function catalogChanged() {
  revalidateTag(CATALOG_TAG, 'max')
  revalidatePath('/', 'layout')
}

// ============================================================== Đơn hàng
export async function setOrderStatus(orderId: string, status: OrderStatus, note?: string): Promise<ActionResult> {
  const g = await guard()
  if (g) return g
  const sb = await createClient()
  const { error } = await sb.rpc('admin_set_order_status', { p_order_id: orderId, p_status: status, p_note: note ?? null })
  if (error) return { ok: false, error: dbError(error) }
  if (status === 'cancelled') catalogChanged()
  revalidatePath('/admin/don-hang')
  return { ok: true }
}

// ============================================================== Sản phẩm
export type { ProductInput } from '@/lib/schemas/product'

export async function saveProduct(input: ProductInput): Promise<ActionResult<{ id: string }>> {
  const g = await guard(MANAGER)
  if (g) return g
  const p = productSchema.safeParse(input)
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ' }
  const skus = p.data.variants.map((v) => v.sku.toLowerCase())
  if (new Set(skus).size !== skus.length) return { ok: false, error: 'SKU của các biến thể bị trùng nhau.' }

  const sb = await createClient()
  // Kiểm tra thuộc tính bắt buộc theo loại sản phẩm
  const { data: defs } = await sb.from('attribute_defs').select('code,name,required').eq('type_id', p.data.type_id)
  const missing = (defs ?? []).find((d) => d.required && (p.data.attrs[d.code as string] === undefined || p.data.attrs[d.code as string] === ''))
  if (missing) return { ok: false, error: `Vui lòng nhập thuộc tính "${missing.name}".` }

  const { data, error } = await sb.rpc('admin_save_product', { p: p.data })
  if (error) return { ok: false, error: dbError(error) }
  catalogChanged()
  return { ok: true, data: { id: data as string } }
}

export async function setProductStatus(id: string, status: 'active' | 'hidden' | 'archived' | 'draft'): Promise<ActionResult> {
  const g = await guard(MANAGER)
  if (g) return g
  const sb = await createClient()
  const { error } = await sb.from('products').update({ status }).eq('id', id)
  if (error) return { ok: false, error: dbError(error) }
  catalogChanged()
  return { ok: true }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const g = await guard(MANAGER)
  if (g) return g
  const sb = await createClient()
  const { error } = await sb.from('products').delete().eq('id', id)
  if (error) return { ok: false, error: dbError(error) }
  catalogChanged()
  return { ok: true }
}

// ============================================================== Loại sản phẩm
const typeSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().regex(/^[a-z0-9-]{2,40}$/, 'Mã loại chỉ gồm chữ thường không dấu, số, dấu gạch'),
  name: z.string().trim().min(2, 'Vui lòng nhập tên loại').max(80),
  description: z.string().max(300),
  track_inventory: z.boolean(),
  is_unique: z.boolean(),
  has_variants: z.boolean(),
  allow_preorder: z.boolean(),
  allow_tradein: z.boolean(),
  hold_in_cart: z.boolean(),
  attributes: z
    .array(z.object({
      id: z.string().optional(),
      code: z.string().trim().regex(/^[a-z0-9_]{1,40}$/, 'Mã thuộc tính chỉ gồm chữ thường không dấu, số, gạch dưới'),
      name: z.string().trim().min(1, 'Thuộc tính cần tên').max(60),
      kind: z.enum(['text', 'number', 'select', 'boolean', 'date']),
      options: z.array(z.string().trim().min(1).max(60)).max(100),
      required: z.boolean(),
      filterable: z.boolean(),
      visible: z.boolean()
    }))
    .max(40)
})
export type ProductTypeInput = z.infer<typeof typeSchema>

export async function saveProductType(input: ProductTypeInput): Promise<ActionResult<{ id: string }>> {
  const g = await guard(MANAGER)
  if (g) return g
  const p = typeSchema.safeParse(input)
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ' }
  const codes = p.data.attributes.map((a) => a.code)
  if (new Set(codes).size !== codes.length) return { ok: false, error: 'Mã thuộc tính bị trùng.' }
  const bad = p.data.attributes.find((a) => a.kind === 'select' && a.options.length === 0)
  if (bad) return { ok: false, error: `Thuộc tính "${bad.name}" là danh sách chọn, cần ít nhất 1 giá trị.` }

  const sb = await createClient()
  const { attributes, id, ...type } = p.data
  const res = id
    ? await sb.from('product_types').update(type).eq('id', id).select('id').single()
    : await sb.from('product_types').insert(type).select('id').single()
  if (res.error) return { ok: false, error: dbError(res.error) }
  const typeId = res.data.id as string

  const keep = attributes.filter((a) => a.id).map((a) => a.id as string)
  let del = sb.from('attribute_defs').delete().eq('type_id', typeId)
  if (keep.length) del = del.not('id', 'in', `(${keep.join(',')})`)
  const d = await del
  if (d.error) return { ok: false, error: dbError(d.error) }
  const rows = attributes.map((a, i) => ({ ...a, type_id: typeId, sort: i, options: a.kind === 'select' ? a.options : [] }))
  // Tách cập nhật và thêm mới: upsert hàng loạt yêu cầu mọi dòng cùng cột.
  const updates = rows.filter((r) => r.id)
  const inserts = rows.filter((r) => !r.id).map(({ id: _id, ...r }) => r)
  if (updates.length) {
    const u = await sb.from('attribute_defs').upsert(updates, { onConflict: 'id' })
    if (u.error) return { ok: false, error: dbError(u.error) }
  }
  if (inserts.length) {
    const ins = await sb.from('attribute_defs').insert(inserts)
    if (ins.error) return { ok: false, error: dbError(ins.error) }
  }
  catalogChanged()
  return { ok: true, data: { id: typeId } }
}

export async function deleteProductType(id: string): Promise<ActionResult> {
  const g = await guard(MANAGER)
  if (g) return g
  const sb = await createClient()
  const { error } = await sb.from('product_types').delete().eq('id', id)
  if (error) return { ok: false, error: error.code === '23503' ? 'Loại này đang có sản phẩm, hãy chuyển sản phẩm sang loại khác trước.' : dbError(error) }
  catalogChanged()
  return { ok: true }
}

// ============================================================== Danh mục, bộ sưu tập, thương hiệu
const catSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Vui lòng nhập tên').max(80),
  slug: z.string().trim().regex(/^[a-z0-9-]{1,80}$/, 'Đường dẫn chỉ gồm chữ thường không dấu, số, dấu gạch'),
  parent_id: z.string().nullable(),
  sort: z.number().int(),
  visible: z.boolean()
})

export async function saveCategory(input: z.infer<typeof catSchema>): Promise<ActionResult> {
  const g = await guard(MANAGER)
  if (g) return g
  const p = catSchema.safeParse(input)
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ' }
  const sb = await createClient()
  const { id, ...row } = p.data
  const res = id ? await sb.from('categories').update(row).eq('id', id) : await sb.from('categories').insert(row)
  if (res.error) return { ok: false, error: dbError(res.error) }
  catalogChanged()
  return { ok: true }
}

const simpleSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Vui lòng nhập tên').max(80),
  slug: z.string().trim().regex(/^[a-z0-9-]{1,80}$/, 'Đường dẫn chỉ gồm chữ thường không dấu, số, dấu gạch')
})

export async function saveSimple(table: 'collections' | 'brands', input: z.infer<typeof simpleSchema>): Promise<ActionResult> {
  const g = await guard(MANAGER)
  if (g) return g
  const p = simpleSchema.safeParse(input)
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ' }
  const sb = await createClient()
  const { id, ...row } = p.data
  const res = id ? await sb.from(table).update(row).eq('id', id) : await sb.from(table).insert(row)
  if (res.error) return { ok: false, error: dbError(res.error) }
  catalogChanged()
  return { ok: true }
}

export async function deleteTaxonomy(table: 'categories' | 'collections' | 'brands', id: string): Promise<ActionResult> {
  const g = await guard(MANAGER)
  if (g) return g
  const sb = await createClient()
  const { error } = await sb.from(table).delete().eq('id', id)
  if (error) return { ok: false, error: error.code === '23503' ? 'Danh mục còn danh mục con, hãy chuyển hoặc xóa danh mục con trước.' : dbError(error) }
  catalogChanged()
  return { ok: true }
}

// ============================================================== Thu mua
export async function updateTradein(id: string, input: { status: TradeinStatus; quoted_total: number | null; staff_note: string }): Promise<ActionResult> {
  const g = await guard()
  if (g) return g
  const sb = await createClient()
  const { data: rules } = await sb.from('settings').select('value').eq('key', 'rules').maybeSingle()
  const hours = Number((rules?.value as Record<string, unknown> | undefined)?.tradein_quote_hours ?? 48)
  const limit = Number((rules?.value as Record<string, unknown> | undefined)?.tradein_approval_limit ?? 5_000_000)
  const staff = await getStaff()
  if (input.quoted_total && input.quoted_total > limit && staff && !MANAGER.includes(staff.role)) {
    return { ok: false, error: `Báo giá trên ${limit.toLocaleString('vi-VN')}₫ cần quản lý duyệt.` }
  }
  const patch: Database['public']['Tables']['tradein_requests']['Update'] = { status: input.status, quoted_total: input.quoted_total, staff_note: input.staff_note || null, handled_by: staff?.id }
  if (input.status === 'quoted') patch.quote_expires_at = new Date(Date.now() + hours * 3600_000).toISOString()
  const { error } = await sb.from('tradein_requests').update(patch).eq('id', id)
  if (error) return { ok: false, error: dbError(error) }
  revalidatePath('/admin/thu-mua')
  return { ok: true }
}

// ============================================================== Nhân viên
const staffSchema = z.object({
  email: z.email('Email chưa đúng'),
  full_name: z.string().trim().max(80),
  role: z.enum(['owner', 'manager', 'cashier', 'staff']),
  allow_google: z.boolean(),
  send_invite: z.boolean()
})

export async function inviteStaff(input: z.infer<typeof staffSchema>): Promise<ActionResult> {
  const g = await guard(OWNER)
  if (g) return g
  const p = staffSchema.safeParse(input)
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ' }
  const sb = await createClient()
  const email = p.data.email.toLowerCase()
  const { error } = await sb.from('staff').insert({ email, full_name: p.data.full_name, role: p.data.role, allow_google: p.data.allow_google })
  if (error) return { ok: false, error: dbError(error) }
  let message = 'Đã thêm. Nhân viên đăng nhập bằng Google với đúng email này.'
  if (p.data.send_invite) {
    if (!hasServiceRole) {
      message = 'Đã thêm. Chưa gửi được email đặt mật khẩu vì thiếu SUPABASE_SERVICE_ROLE_KEY.'
    } else {
      const inv = await serviceClient().auth.admin.inviteUserByEmail(email, { redirectTo: `${SITE_URL}/admin/dang-nhap` })
      message = inv.error ? 'Đã thêm, nhưng gửi email mời chưa được (email có thể đã có tài khoản).' : 'Đã thêm và gửi email mời đặt mật khẩu.'
    }
  }
  revalidatePath('/admin/nhan-vien')
  return { ok: true, message }
}

export async function updateStaff(id: string, patch: { role?: StaffRole; active?: boolean; allow_google?: boolean }): Promise<ActionResult> {
  const g = await guard(OWNER)
  if (g) return g
  const me = await getStaff()
  if (me?.id === id && (patch.active === false || (patch.role && patch.role !== 'owner'))) {
    return { ok: false, error: 'Không thể tự khóa hoặc tự hạ quyền chủ shop của chính mình.' }
  }
  const sb = await createClient()
  const { error } = await sb.from('staff').update(patch).eq('id', id)
  if (error) return { ok: false, error: dbError(error) }
  revalidatePath('/admin/nhan-vien')
  return { ok: true }
}

export async function deleteStaff(id: string): Promise<ActionResult> {
  const g = await guard(OWNER)
  if (g) return g
  const me = await getStaff()
  if (me?.id === id) return { ok: false, error: 'Không thể tự xóa chính mình.' }
  const sb = await createClient()
  const { error } = await sb.from('staff').delete().eq('id', id)
  if (error) return { ok: false, error: dbError(error) }
  revalidatePath('/admin/nhan-vien')
  return { ok: true }
}

// ============================================================== Cài đặt
const settingKeys = ['shop', 'bank', 'shipping', 'rules', 'modules'] as const

export async function saveSetting(key: (typeof settingKeys)[number], value: Record<string, unknown>): Promise<ActionResult> {
  const g = await guard(OWNER)
  if (g) return g
  if (!settingKeys.includes(key)) return { ok: false, error: 'Mục cài đặt không hợp lệ' }
  const sb = await createClient()
  const valid = settingSchemas[key].safeParse(value)
  if (!valid.success) return { ok:false,error:valid.error.issues[0]?.message ?? 'Cài đặt chưa hợp lệ' }
  const { error } = await sb.from('settings').upsert({ key, value:valid.data, is_public: true }, { onConflict: 'key' })
  if (error) return { ok: false, error: dbError(error) }
  revalidateTag(SETTINGS_TAG, 'max')
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Đã lưu cài đặt.' }
}

// ============================================================== Bán tại quầy
const posSchema = z.object({
  items: z.array(z.object({ variant_id: z.uuid(), qty: z.number().int().min(1).max(999) })).min(1).max(100),
  payment: z.enum(['cash', 'bank_transfer', 'card']),
  discount: z.number().int().min(0),
  customer: z.object({ name: z.string().max(120), phone: z.string().max(20) })
})

export async function posCheckout(input: z.infer<typeof posSchema>): Promise<ActionResult<{ code: string }>> {
  const g = await guard()
  if (g) return isDemo ? { ok: true, data: { code: 'DP-DEMO' }, message: DEMO_MESSAGE } : g
  const p = posSchema.safeParse(input)
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ' }
  const sb = await createClient()
  const { data, error } = await sb.rpc('pos_create_sale', { p_items: p.data.items, p_payment: p.data.payment, p_discount: p.data.discount, p_customer: p.data.customer })
  if (error) return { ok: false, error: dbError(error) }
  catalogChanged()
  return { ok: true, data: { code: data as string } }
}

export async function posSearch(q: string) {
  const term = q.replace(/[%_,()"\\]/g, ' ').trim().slice(0, 60)
  if (!term) return []
  if (isDemo) {
    const { demo } = await import('@/lib/demo')
    const { unaccent } = await import('@/lib/utils')
    const t = unaccent(term.toLowerCase())
    return demo.variants
      .map((v) => ({ v, p: demo.products.find((x) => x.id === v.product_id)! }))
      .filter(({ v, p }) => p && v.active && (unaccent(`${p.name} ${v.sku}`.toLowerCase()).includes(t)))
      .slice(0, 20)
      .map(({ v, p }) => ({ variant_id: v.id, name: p.name, title: v.title, sku: v.sku, price: v.price ?? p.price, stock: v.stock, image: v.image_url ?? p.thumbnail }))
  }
  const staff = await getStaff()
  if (!staff) return []
  const sb = await createClient()
  const { unaccent } = await import('@/lib/utils')
  const cols = 'id,sku,title,price,stock,image_url,product_id'
  const [bySku, byName] = await Promise.all([
    sb.from('variants').select(cols).eq('active', true).ilike('sku', `%${term}%`).limit(20),
    sb.from('products').select('id').eq('pos', true).neq('status', 'archived').ilike('search_text', `%${unaccent(term.toLowerCase())}%`).limit(20)
  ])
  const pids = (byName.data ?? []).map((r) => r.id as string)
  const byProduct = pids.length ? await sb.from('variants').select(cols).eq('active', true).in('product_id', pids).limit(40) : { data: [] }
  type V = { id: string; sku: string; title: string; price: number | null; stock: number; image_url: string | null; product_id: string }
  const vs = new Map<string, V>()
  for (const v of [...((bySku.data ?? []) as V[]), ...((byProduct.data ?? []) as V[])]) vs.set(v.id, v)
  const allPids = [...new Set([...vs.values()].map((v) => v.product_id))]
  if (!allPids.length) return []
  const { data: prods } = await sb.from('products').select('id,name,price,thumbnail,pos,status').in('id', allPids)
  type P = { id: string; name: string; price: number; thumbnail: string | null; pos: boolean; status: string }
  const pm = new Map(((prods ?? []) as P[]).map((p) => [p.id, p]))
  return [...vs.values()]
    .filter((v) => { const p = pm.get(v.product_id); return p && p.pos && p.status !== 'archived' })
    .slice(0, 20)
    .map((v) => {
      const p = pm.get(v.product_id)!
      return { variant_id: v.id, name: p.name, title: v.title, sku: v.sku, price: v.price ?? p.price, stock: v.stock, image: v.image_url ?? p.thumbnail }
    })
}

/** One bounded UPDATE, with the same server-side permission check as single edits. */
export async function bulkProductStatus(ids: string[], status: 'active' | 'hidden' | 'archived'): Promise<ActionResult> {
  const g = await guard(MANAGER)
  if (g) return g
  const parsed = z.object({ ids: z.array(z.uuid()).min(1).max(20), status: z.enum(['active','hidden','archived']) }).safeParse({ ids, status })
  if (!parsed.success) return { ok: false, error: 'Chọn từ 1 đến 20 sản phẩm trên trang hiện tại.' }
  const sb = await createClient()
  const { error } = await sb.from('products').update({ status: parsed.data.status }).in('id', [...new Set(parsed.data.ids)])
  if (error) return { ok: false, error: dbError(error) }
  catalogChanged()
  revalidatePath('/admin/san-pham')
  return { ok: true, message: 'Đã cập nhật sản phẩm.' }
}
