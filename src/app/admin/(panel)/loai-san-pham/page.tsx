import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PRODUCT_SUBNAV, SubNav } from '@/components/admin/admin-nav'
import { PageHeader, Pill, Section } from '@/components/admin/ui'
import { countProductsByType, getAdminMeta } from '@/lib/admin-data'

export const metadata = { title: 'Loại sản phẩm' }

const TEMPLATES = [
  { key: 'the-bai', name: 'Thẻ bài và sưu tầm', text: 'Bộ thẻ, độ hiếm, tình trạng, hãng chấm' },
  { key: 'thoi-trang', name: 'Thời trang', text: 'Size, màu, chất liệu, có biến thể' },
  { key: 'mo-hinh', name: 'Mô hình và đồ chơi', text: 'Tỷ lệ, thương hiệu, độ tuổi, cho pre-order' },
  { key: 'trong', name: 'Hàng thường', text: 'Chỉ có tên, giá, tồn kho' }
]

export default async function TypesPage() {
  const [meta, counts] = await Promise.all([getAdminMeta(), countProductsByType()])
  return (
    <>
      <PageHeader title="Loại sản phẩm và thuộc tính" subtitle="Quyết định form nhập, bộ lọc và cách bán của từng nhóm hàng. Đổi sang ngành hàng khác chỉ cần tạo loại mới." actions={<Link href="/admin/loai-san-pham/moi" className="btn btn-primary"><Plus size={18} aria-hidden="true" />Thêm loại</Link>} />
      <SubNav items={PRODUCT_SUBNAV} />
      <Section bodyClass="divide-y divide-line">
        {meta.types.map((t) => {
          const n = meta.attributes.filter((a) => a.type_id === t.id).length
          return (
            <Link key={t.id} href={`/admin/loai-san-pham/${t.id}`} className="flex flex-wrap items-center gap-3 px-4 py-4 hover:bg-surface sm:px-5">
              <span className="flex min-w-0 flex-[1_1_240px] flex-col"><b>{t.name}</b><span className="text-sm text-muted">{t.description}</span></span>
              <span className="flex flex-wrap gap-1.5">
                <Pill tone="neu">{n} thuộc tính</Pill>
                {t.has_variants ? <Pill tone="brand">Biến thể</Pill> : null}
                {t.is_unique ? <Pill tone="brand">Món duy nhất</Pill> : t.track_inventory ? <Pill tone="neu">Theo dõi tồn</Pill> : null}
                {t.allow_preorder ? <Pill tone="brand">Pre-order</Pill> : null}
                {t.allow_tradein ? <Pill tone="neu">Thu mua</Pill> : null}
              </span>
              <span className="w-24 text-right text-sm text-muted tabular-nums">{counts[t.id] ?? 0} sản phẩm</span>
            </Link>
          )
        })}
      </Section>
      <Section title="Bắt đầu nhanh từ mẫu" action={<span className="text-sm text-muted">Mẫu chỉ là điểm xuất phát, sửa được tự do</span>}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((m) => (
            <div key={m.key} className="card flex flex-col gap-2 p-4">
              <b>{m.name}</b>
              <span className="flex-1 text-sm text-muted">{m.text}</span>
              <Link href={`/admin/loai-san-pham/moi?mau=${m.key}`} className="btn btn-secondary btn-sm self-start"><Plus size={16} aria-hidden="true" />Dùng mẫu này</Link>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}
