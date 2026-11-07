import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { GoogleButton } from '@/components/google-button'
import { AdminBrand } from '@/components/admin/admin-brand'
import { AdminLoginForm } from '@/components/admin/login-form'
import { isDemo } from '@/lib/env'
export const metadata:Metadata={title:'Đăng nhập quản trị',robots:{index:false}}
const ERR:Record<string,string>={not_invited:'Email Google này chưa được mời hoặc chưa được bật đăng nhập Google.',not_staff:'Tài khoản không có quyền quản trị.',oauth:'Đăng nhập Google chưa thành công, vui lòng thử lại.'}
export default async function AdminLoginPage({searchParams}:{searchParams:Promise<{error?:string;next?:string}>}) {
  const {error,next}=await searchParams;const to=next && (next.startsWith('/admin') || next.startsWith('/pos')) ? next : '/admin'
  return <main className="admin-app admin-login"><div className="admin-login-card"><AdminBrand /><span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-brand-subtle text-brand"><ShieldCheck size={24} strokeWidth={1.5} aria-hidden="true" /></span><h1 className="text-2xl font-semibold tracking-tight">Chào mừng trở lại</h1><p className="mt-2 mb-7 text-sm text-muted">Đăng nhập để quản lý cửa hàng Dark Poke.</p>{error && ERR[error] ? <p role="alert" className="mb-5 rounded-xl bg-bad-bg p-3 text-sm text-bad">{ERR[error]}</p> : null}{isDemo ? <p className="mb-5 rounded-xl bg-brand-subtle p-3 text-xs leading-relaxed text-brand-ink">Bản xem thử. Bấm Đăng nhập để xem admin với dữ liệu mẫu.</p> : null}<AdminLoginForm next={to} /><div className="my-5 flex items-center gap-3 text-xs text-muted"><hr className="flex-1 border-line" />hoặc tiếp tục với<hr className="flex-1 border-line" /></div><GoogleButton next={to} label="Đăng nhập bằng Google" disabled={isDemo} /><p className="mt-5 text-center text-xs leading-relaxed text-muted">Chỉ email được chủ shop mời mới có quyền truy cập.</p></div><Link href="/" className="mt-6 flex min-h-11 items-center gap-2 text-xs text-muted">Quay lại cửa hàng<ArrowUpRight size={15} aria-hidden="true" /></Link></main>
}
