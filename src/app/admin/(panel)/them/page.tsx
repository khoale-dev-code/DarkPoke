import Link from 'next/link'
import { getSettings } from '@/lib/catalog'
import { ChevronRight, CircleDollarSign, FolderTree, Settings, Shapes, ShieldCheck, Store, Timer, Users } from 'lucide-react'
import { PageHeader } from '@/components/admin/ui'

export const metadata = { title: 'Thêm' }

const GROUPS = [
  { title: 'Bán hàng', items: [
    { href: '/pos', label: 'Bán tại quầy (POS)', sub: 'Bán hàng, thu tiền, in hóa đơn', icon: Store },
    { href: '/admin/pre-order', label: 'Pre-order và đặt cọc', sub: 'Theo dõi cọc và suất đặt trước', icon: Timer },
    { href: '/admin/khach-hang', label: 'Khách hàng', sub: 'Lịch sử mua theo số điện thoại', icon: Users }
  ] },
  { title: 'Hàng hóa', items: [
    { href: '/admin/loai-san-pham', label: 'Loại sản phẩm và thuộc tính', sub: 'Dùng lại cho mọi ngành hàng', icon: Shapes },
    { href: '/admin/danh-muc', label: 'Danh mục và bộ sưu tập', sub: 'Cây danh mục, thương hiệu', icon: FolderTree }
  ] },
  { title: 'Hệ thống', items: [
    { href: '/admin/nhan-vien', label: 'Nhân viên và phân quyền', sub: 'Mời, khóa, đổi vai trò', icon: ShieldCheck },
    { href: '/admin/cai-dat', label: 'Cài đặt', sub: 'Ngân hàng, phí ship, quy tắc, mô-đun', icon: Settings },
    { href: '/', label: 'Xem cửa hàng', sub: 'Mở trang khách', icon: CircleDollarSign }
  ] }
]

export default async function MorePage() {
  const {modules}=await getSettings()
  return (
    <>
      <PageHeader title="Thêm" />
      {GROUPS.map((g) => (
        <section key={g.title} className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-semibold tracking-wide text-muted uppercase">{g.title}</h2>
          <div className="card divide-y divide-line overflow-hidden">
            {g.items.filter((i)=>(i.href!=='/pos'||modules.pos)&&(i.href!=='/admin/pre-order'||modules.preorder)).map((i) => {
              const Icon = i.icon
              return (
                <Link key={i.href} href={i.href} className="flex min-h-16 items-center gap-3 px-4 active:bg-surface">
                  <Icon size={22} className="flex-none text-brand" aria-hidden="true" />
                  <span className="flex min-w-0 flex-1 flex-col"><b className="text-sm">{i.label}</b><span className="text-xs text-muted">{i.sub}</span></span>
                  <ChevronRight size={20} className="text-muted" aria-hidden="true" />
                </Link>
              )
            })}
          </div>
        </section>
      ))}
      <form action="/auth/signout?to=admin" method="post"><button type="submit" className="btn btn-danger-outline w-full">Đăng xuất</button></form>
    </>
  )
}
