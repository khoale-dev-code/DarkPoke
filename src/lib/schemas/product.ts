import { z } from 'zod'

export const productSchema = z.object({
  id: z.string().optional(),
  type_id: z.uuid('Vui lòng chọn loại sản phẩm'),
  category_id: z.string(),
  brand_id: z.string(),
  name: z.string().trim().min(2, 'Tên sản phẩm cần ít nhất 2 ký tự').max(200),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,120}$/, 'Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch'),
  sku: z.string().trim().min(2, 'Vui lòng nhập SKU').max(60),
  description: z.string().max(5000),
  unit: z.string().max(20),
  price: z.number().int().min(0, 'Giá không hợp lệ'),
  compare_at_price: z.number().int().min(0).nullable(),
  cost: z.number().int().min(0).nullable(),
  stock: z.number().int().min(0),
  status: z.enum(['draft', 'active', 'hidden', 'archived']),
  online: z.boolean(),
  pos: z.boolean(),
  is_featured: z.boolean(),
  attrs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  tags: z.array(z.string().max(40)).max(30),
  images: z.array(z.object({ url: z.string().min(1).max(1000), alt: z.string().max(200) })).max(20),
  options: z.array(z.object({ name: z.string().trim().min(1).max(40), values: z.array(z.string().trim().min(1).max(60)).min(1).max(30) })).max(3),
  variants: z
    .array(z.object({
      id: z.string().optional(),
      sku: z.string().trim().min(2, 'Mỗi biến thể cần SKU').max(60),
      title: z.string().max(120),
      option_values: z.array(z.string()),
      price: z.number().int().min(0).nullable(),
      stock: z.number().int().min(0),
      active: z.boolean()
    }))
    .max(100),
  collection_ids: z.array(z.uuid()).max(50),
  min_stock: z.number().int().min(0),
  purchase_limit: z.number().int().min(1).nullable(),
  weight_g: z.number().int().min(0).nullable(),
  allow_preorder: z.boolean(),
  preorder_deposit_pct: z.number().int().min(1).max(100).nullable(),
  preorder_release_date: z.string().nullable(),
  preorder_slots: z.number().int().min(0).nullable(),
  preorder_closes_at: z.string().nullable(),
  seo_title: z.string().max(120),
  seo_description: z.string().max(300)
})
export type ProductInput = z.infer<typeof productSchema>

