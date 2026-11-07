import { PageHeader, Pill, Section } from '@/components/admin/ui'
import { InviteStaffForm, StaffRowActions } from '@/components/admin/staff'
import { requireStaff } from '@/lib/auth'
import { listStaff } from '@/lib/admin-data'
import { ROLE_LABEL } from '@/lib/labels'

export const metadata = { title: 'Nhân viên' }

const PERMS = [
  ['Chủ shop', 'Toàn quyền: cài đặt, nhân viên, giá, xóa dữ liệu'],
  ['Quản lý', 'Sản phẩm, loại, danh mục, đơn hàng, duyệt giảm giá và thu mua vượt hạn mức'],
  ['Thu ngân', 'Bán tại quầy, xem và xử lý đơn, giảm giá trong hạn mức'],
  ['Nhân viên kho', 'Xem đơn, đóng gói, giao hàng']
]

export default async function StaffPage() {
  const [me, staff] = await Promise.all([requireStaff(), listStaff()])
  const owner = me.role === 'owner'
  return (
    <>
      <PageHeader title="Nhân viên và phân quyền" subtitle="Chỉ email được mời mới đăng nhập được trang quản trị" />
      <Section bodyClass="divide-y divide-line">
        {staff.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
            <span className="admin-avatar" aria-hidden="true">{(s.full_name || s.email).slice(0,1)}</span><span className="flex min-w-0 flex-[1_1_200px] flex-col"><b>{s.full_name || s.email}</b><span className="text-xs break-words text-muted">{s.email}</span></span>
            <span className="flex flex-wrap gap-1.5">
              <Pill tone="brand">{ROLE_LABEL[s.role]}</Pill>
              <Pill tone="neu">{s.allow_google ? 'Mật khẩu hoặc Google' : 'Chỉ mật khẩu'}</Pill>
              {!s.user_id ? <Pill tone="warn">Chưa đăng nhập lần nào</Pill> : null}
              {!s.active ? <Pill tone="bad">Đã khóa</Pill> : null}
            </span>
            {owner ? <StaffRowActions s={s} isMe={s.id === me.id} /> : null}
          </div>
        ))}
      </Section>
      {owner ? <InviteStaffForm /> : <p className="text-sm text-muted">Chỉ chủ shop mời hoặc đổi quyền nhân viên.</p>}
      <Section title="Quyền theo vai trò" bodyClass="divide-y divide-line">
        {PERMS.map(([r, d]) => <div key={r} className="flex flex-wrap gap-x-4 px-4 py-3 text-sm sm:px-5"><b className="w-32">{r}</b><span className="text-muted">{d}</span></div>)}
      </Section>
    </>
  )
}
