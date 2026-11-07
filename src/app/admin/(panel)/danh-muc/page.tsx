import { PRODUCT_SUBNAV, SubNav } from '@/components/admin/admin-nav'
import { CategoryManager, SimpleManager } from '@/components/admin/taxonomy'
import { PageHeader, Tabs } from '@/components/admin/ui'
import { countProductsByCategory, getAdminMeta } from '@/lib/admin-data'

export const metadata = { title: 'Danh mục và bộ sưu tập' }

export default async function TaxonomyPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [{ tab = 'danh-muc' }, meta, counts] = await Promise.all([searchParams, getAdminMeta(), countProductsByCategory()])
  return (
    <>
      <PageHeader title="Danh mục và bộ sưu tập" subtitle="Cách sắp xếp hàng hóa trên cửa hàng, dùng chung cho mọi loại sản phẩm" />
      <SubNav items={PRODUCT_SUBNAV} />
      <Tabs items={[
        { href: '/admin/danh-muc', label: 'Danh mục', count: meta.categories.length, on: tab === 'danh-muc' },
        { href: '/admin/danh-muc?tab=bo-suu-tap', label: 'Bộ sưu tập', count: meta.collections.length, on: tab === 'bo-suu-tap' },
        { href: '/admin/danh-muc?tab=thuong-hieu', label: 'Thương hiệu', count: meta.brands.length, on: tab === 'thuong-hieu' }
      ]} />
      {tab === 'bo-suu-tap' ? (
        <SimpleManager table="collections" rows={meta.collections} noun="bộ sưu tập" hint="Nhóm tự do, một sản phẩm thuộc nhiều bộ (bộ thẻ, dòng sản phẩm, chương trình)." />
      ) : tab === 'thuong-hieu' ? (
        <SimpleManager table="brands" rows={meta.brands} noun="thương hiệu" hint="Nhà sản xuất hoặc nhà phát hành." />
      ) : (
        <CategoryManager categories={meta.categories} counts={counts} />
      )}
    </>
  )
}
