import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/admin/product-form'
import { PageHeader } from '@/components/admin/ui'
import { getAdminProduct, getAdminMeta } from '@/lib/admin-data'
import { canManage, requireStaff } from '@/lib/auth'
import { isDemo } from '@/lib/env'

export const metadata = { title: 'Sản phẩm' }

export default async function ProductEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string }> }) {
  const [{ id }, sp, meta, me] = await Promise.all([params, searchParams, getAdminMeta(), requireStaff()])
  const isNew = id === 'moi'
  const product = isNew ? null : await getAdminProduct(id)
  if (!isNew && !product) notFound()
  return (
    <>
      <PageHeader back={{ href: '/admin/san-pham', label: 'Sản phẩm' }} title={isNew ? 'Thêm sản phẩm' : 'Sửa sản phẩm'} subtitle={product ? product.name : 'Chọn loại sản phẩm trước, form sẽ hiện đúng các trường cần nhập.'} />
      <ProductForm meta={meta} product={product} defaultTypeCode={sp.type} canUpload={!isDemo && canManage(me)} readOnly={!canManage(me)} />
    </>
  )
}
