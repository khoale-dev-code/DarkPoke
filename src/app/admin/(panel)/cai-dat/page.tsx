import { SettingsForms } from '@/components/admin/settings-forms'
import { PageHeader } from '@/components/admin/ui'
import { requireStaff } from '@/lib/auth'
import { getSettings } from '@/lib/catalog'

export const metadata = { title: 'Cài đặt' }

export default async function SettingsPage({ searchParams }: { searchParams:Promise<{section?:string}> }) {
  const sp=await searchParams
  const section = sp.section && ['shop','bank','shipping','rules','modules'].includes(sp.section) ? sp.section as keyof import('@/lib/types').ShopSettings : 'shop'
  const [me, settings] = await Promise.all([requireStaff(), getSettings()])
  return (
    <>
      <PageHeader title="Cài đặt" subtitle="Thông tin shop, thanh toán, vận chuyển, quy tắc nghiệp vụ và mô-đun bán hàng" />
      {me.role !== 'owner' ? <p className="rounded-xl bg-warn-bg p-3 text-sm text-warn">Chỉ chủ shop được lưu cài đặt. Bạn đang xem ở chế độ chỉ đọc.</p> : null}
      <SettingsForms section={section} initial={settings} readOnly={me.role !== 'owner'} />
    </>
  )
}
