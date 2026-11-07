import type { Metadata } from 'next'
import { AdminShell } from '@/components/admin/admin-nav'
import { requireStaff } from '@/lib/auth'
import { getNavBadges } from '@/lib/admin-data'
import { getSettings } from '@/lib/catalog'
import { isDemo } from '@/lib/env'
import { ROLE_LABEL } from '@/lib/labels'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: { default: 'Quản trị', template: '%s · Quản trị Dark Poke' }, robots: { index: false, follow: false } }
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff()
  const [badges, settings] = await Promise.all([getNavBadges(), getSettings()])
  return <AdminShell name={staff.full_name || staff.email} role={ROLE_LABEL[staff.role]} roleCode={staff.role} badges={badges} modules={settings.modules} demo={isDemo}>{children}</AdminShell>
}
