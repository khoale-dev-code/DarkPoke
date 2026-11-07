import { notFound } from 'next/navigation'
import { TypeForm, type TypeDraft } from '@/components/admin/type-form'
import { PageHeader } from '@/components/admin/ui'
import { countProductsByType, getAdminMeta } from '@/lib/admin-data'

export const metadata = { title: 'Loại sản phẩm' }

const base = { track_inventory: true, is_unique: false, has_variants: false, allow_preorder: false, allow_tradein: false, hold_in_cart: false }
const a = (code: string, name: string, kind: TypeDraft['attributes'][number]['kind'], options: string[] = [], extra: Partial<TypeDraft['attributes'][number]> = {}) =>
  ({ code, name, kind, options, required: false, filterable: kind === 'select', visible: true, ...extra })

const TEMPLATES: Record<string, TypeDraft> = {
  'the-bai': { code: 'the-suu-tam', name: 'Thẻ sưu tầm', description: 'Từng thẻ, có tình trạng', ...base, is_unique: true, allow_tradein: true, hold_in_cart: true,
    attributes: [a('set_name', 'Bộ thẻ', 'text', [], { required: true }), a('card_no', 'Số thẻ', 'text'), a('rarity', 'Độ hiếm', 'select', ['Common', 'Rare', 'Ultra Rare']), a('condition', 'Tình trạng', 'select', ['NM', 'LP', 'MP', 'HP'], { required: true })] },
  'thoi-trang': { code: 'thoi-trang', name: 'Thời trang', description: 'Áo, quần, phụ kiện thời trang', ...base, has_variants: true,
    attributes: [a('material', 'Chất liệu', 'select', ['Cotton', 'Polyester', 'Denim']), a('gender', 'Giới tính', 'select', ['Nam', 'Nữ', 'Unisex']), a('care', 'Hướng dẫn giặt', 'text', [], { filterable: false })] },
  'mo-hinh': { code: 'mo-hinh', name: 'Mô hình và đồ chơi', description: 'Figure, mô hình lắp ráp', ...base, allow_preorder: true,
    attributes: [a('scale', 'Tỷ lệ', 'select', ['1/144', '1/100', '1/7', 'Non-scale']), a('age', 'Độ tuổi', 'select', ['3+', '8+', '15+']), a('height_cm', 'Chiều cao (cm)', 'number', [], { filterable: false })] },
  trong: { code: 'loai-moi', name: 'Loại mới', description: '', ...base, attributes: [] }
}

export default async function TypeEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mau?: string }> }) {
  const [{ id }, sp, meta, counts] = await Promise.all([params, searchParams, getAdminMeta(), countProductsByType()])
  let draft: TypeDraft
  if (id === 'moi') {
    draft = TEMPLATES[sp.mau ?? 'trong'] ?? TEMPLATES.trong!
  } else {
    const t = meta.types.find((x) => x.id === id)
    if (!t) notFound()
    draft = { ...t, attributes: meta.attributes.filter((x) => x.type_id === id).sort((x, y) => x.sort - y.sort) }
  }
  const inUse = id === 'moi' ? 0 : (counts[id] ?? 0)
  return (
    <>
      <PageHeader back={{ href: '/admin/loai-san-pham', label: 'Loại sản phẩm' }} title={id === 'moi' ? 'Thêm loại sản phẩm' : `Sửa loại: ${draft.name}`} subtitle={inUse ? `${inUse} sản phẩm đang dùng loại này` : undefined} />
      <TypeForm draft={draft} inUse={inUse} />
    </>
  )
}
