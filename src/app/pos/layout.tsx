import '@/components/admin/admin.css'
import type { Metadata } from 'next'
import { requireStaff } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Bán tại quầy', robots: { index: false, follow: false } }

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  await requireStaff()
  return <div className="admin-app min-h-dvh bg-surface">{children}</div>
}
