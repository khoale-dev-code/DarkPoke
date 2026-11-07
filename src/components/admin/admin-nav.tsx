'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ArrowUpRight, Boxes, ChevronRight, CircleHelp, FolderTree, LayoutDashboard, LogOut, Menu, MoreHorizontal, Plus, Receipt, Repeat2, Search, Settings, ShieldCheck, Store, Timer, Users } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AdminBrand } from '@/components/admin/admin-brand'
import { AdminConnection } from '@/components/admin/connection'
import type { ShopSettings, StaffRole } from '@/lib/types'

export const ADMIN_NAV = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard, group: 'Không gian làm việc' },
  { href: '/admin/don-hang', label: 'Đơn hàng', icon: Receipt },
  { href: '/admin/pre-order', label: 'Pre-order', icon: Timer, module: 'preorder' },
  { href: '/admin/thu-mua', label: 'Thu mua', icon: Repeat2, module: 'tradein' },
  { href: '/admin/san-pham', label: 'Sản phẩm', icon: Boxes, group: 'Quản lý cửa hàng' },
  { href: '/admin/danh-muc', label: 'Danh mục', icon: FolderTree },
  { href: '/admin/khach-hang', label: 'Khách hàng', icon: Users },
  { href: '/admin/nhan-vien', label: 'Nhân viên', icon: ShieldCheck, group: 'Hệ thống' },
  { href: '/admin/cai-dat', label: 'Cài đặt', icon: Settings }
]
const isOn = (path: string, href: string) => href === '/admin' ? path === '/admin' : path === href || path.startsWith(`${href}/`) || (href === '/admin/san-pham' && path.startsWith('/admin/loai-san-pham'))
type Props = { name: string; role: string; roleCode: StaffRole; badges: Record<string, number>; modules: ShopSettings['modules']; demo: boolean; children: React.ReactNode }


function Account({ name, role }: { name: string; role: string }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="admin-avatar" aria-label={`Tài khoản ${name}`} title={name}>{name.slice(0, 1).toUpperCase()}</button></DropdownMenuTrigger>
    <DropdownMenuContent align="end"><div className="px-3 py-2"><p className="font-semibold break-words">{name}</p><p className="mt-1 text-xs text-muted">{role}</p></div><DropdownMenuSeparator />
      <DropdownMenuItem asChild><Link href="/"><ArrowUpRight size={16} aria-hidden="true" />Xem cửa hàng</Link></DropdownMenuItem>
      <DropdownMenuItem onSelect={() => { const f = document.createElement('form'); f.method = 'post'; f.action = '/auth/signout?to=admin'; document.body.append(f); f.submit() }}><LogOut size={16} aria-hidden="true" />Đăng xuất</DropdownMenuItem>
    </DropdownMenuContent></DropdownMenu>
}
export function AdminShell({ name, role, roleCode, badges, modules, demo, children }: Props) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const nav = ADMIN_NAV.filter((n) => !n.module || modules[n.module as keyof typeof modules])
  const current = nav.find((n) => isOn(path, n.href))?.label ?? 'Quản trị'
  const canEdit = roleCode === 'owner' || roleCode === 'manager'
  const menu = <nav aria-label="Điều hướng quản trị" className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-5">{nav.map((n) => <div key={n.href}>
    {n.group ? <p className="admin-nav-group">{n.group}</p> : null}
    <Link href={n.href} prefetch={false} className="admin-nav-link" aria-current={isOn(path, n.href) ? 'page' : undefined} onClick={() => setOpen(false)}><n.icon size={19} strokeWidth={1.7} aria-hidden="true" /><span>{n.label}</span>{badges[n.href] ? <span className="admin-badge">{badges[n.href]! > 99 ? '99+' : badges[n.href]}</span> : null}</Link>
  </div>)}</nav>
  return <div className="admin-app">
    <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-brand focus:px-4 focus:py-3 focus:text-white">Đến nội dung chính</a>
    <aside className="admin-sidebar"><AdminBrand />{menu}<div className="mt-5 rounded-xl bg-surface p-3.5"><p className="mb-2 flex items-center gap-2 text-xs font-semibold"><CircleHelp size={15} aria-hidden="true" />Cửa hàng của bạn</p><Link href="/" className="flex min-h-9 items-center justify-between text-xs text-muted">Xem trang khách<ArrowUpRight size={15} aria-hidden="true" /></Link></div><div className="admin-user"><Account name={name} role={role} /><span className="flex-1 truncate"><b className="block truncate text-xs font-semibold">{name}</b><span className="text-[11px] text-muted">{role}</span></span></div></aside>
    <div className="admin-workspace">
      <header className="admin-topbar">
        <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button type="button" className="btn btn-ghost btn-icon admin-menu-trigger" aria-label="Mở menu quản trị"><Menu size={21} aria-hidden="true" /></button></DialogTrigger><DialogContent className="admin-drawer"><DialogTitle className="sr-only">Menu quản trị</DialogTitle><DialogDescription className="sr-only">Đi đến các mục quản lý cửa hàng</DialogDescription><AdminBrand />{menu}</DialogContent></Dialog>
        <nav className="admin-crumb flex-1" aria-label="Đường dẫn"><Link href="/admin" className="hidden sm:inline">Không gian làm việc</Link><ChevronRight size={14} className="hidden sm:inline" aria-hidden="true" /><strong>{current}</strong>{path.split('/').length > 3 ? <ChevronRight size={14} aria-hidden="true" /> : null}{path.split('/').length > 3 ? <span>Chi tiết</span> : null}</nav>
        <form action="/admin/san-pham" role="search" className="admin-topbar-search"><Search size={17} className="shrink-0 text-muted" aria-hidden="true" /><input name="q" type="search" placeholder="Tìm tên sản phẩm, SKU…" aria-label="Tìm nhanh sản phẩm" /><button className="sr-only" type="submit">Tìm kiếm</button></form>
        {modules.pos ? <Link href="/pos" className="btn btn-primary btn-sm"><Store size={17} aria-hidden="true" /><span className="hidden sm:inline">Bán tại quầy</span><span className="sm:hidden">POS</span></Link> : null}
        <span className="lg:hidden"><Account name={name} role={role} /></span>
      </header>
      {demo ? <div className="admin-demo"><CircleHelp size={15} className="shrink-0" aria-hidden="true" /><span><b>Bản xem thử.</b> Dữ liệu mẫu; kết nối Supabase để lưu và vận hành cửa hàng.</span></div> : null}
      <AdminConnection demo={demo} />
      <main id="admin-main" className="admin-main" tabIndex={-1}>{children}</main>
      {canEdit && path === '/admin/them' ? <Link href="/admin/san-pham/moi" className="btn btn-primary mx-4 mb-28"><Plus size={18} aria-hidden="true" />Thêm sản phẩm</Link> : null}
    </div>
    <AdminTabs badges={badges} />
  </div>
}
export function AdminTabs({ badges }: { badges: Record<string, number> }) {
  const path = usePathname()
  const tabs = [
    { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard }, { href: '/admin/don-hang', label: 'Đơn hàng', icon: Receipt },
    { href: '/admin/san-pham', label: 'Sản phẩm', icon: Boxes }, { href: '/admin/khach-hang', label: 'Khách hàng', icon: Users }, { href: '/admin/them', label: 'Thêm', icon: MoreHorizontal }
  ]
  return <nav className="admin-bottomnav" aria-label="Quản trị nhanh">{tabs.map((t) => <Link key={t.href} href={t.href} prefetch={false} aria-current={(t.href === '/admin/them' ? !tabs.slice(0,4).some((x) => isOn(path,x.href)) : isOn(path,t.href)) ? 'page' : undefined}><t.icon size={21} strokeWidth={1.7} aria-hidden="true" /><span>{t.label}</span>{badges[t.href] ? <span className="admin-mobile-badge">{badges[t.href]! > 99 ? '99+' : badges[t.href]}</span> : null}</Link>)}</nav>
}
export function SubNav({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname()
  return <nav className="admin-subnav" aria-label="Mục con">{items.map((i) => <Link key={i.href} href={i.href} aria-current={isOn(path,i.href) ? 'page' : undefined}>{i.label}</Link>)}</nav>
}
export const PRODUCT_SUBNAV = [{ href: '/admin/san-pham', label: 'Danh sách sản phẩm' }, { href: '/admin/loai-san-pham', label: 'Loại & thuộc tính' }, { href: '/admin/danh-muc', label: 'Danh mục & bộ sưu tập' }]
