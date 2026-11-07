import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight,PackageCheck,ShieldCheck } from 'lucide-react'
import { GoogleButton } from '@/components/google-button'
import { ShopBrand } from '@/components/shop/brand'
import { isDemo } from '@/lib/env'
export const metadata:Metadata={title:'Đăng nhập',robots:{index:false}}
export default async function LoginPage({searchParams}:{searchParams:Promise<{error?:string}>}) {
  const {error}=await searchParams
  return <div className="shop-container shop-page !py-12 sm:!py-16"><div className="shop-login"><ShopBrand/><span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-brand-subtle text-brand"><PackageCheck size={24} strokeWidth={1.5} aria-hidden="true"/></span><h1 className="font-display font-bold">Bộ sưu tập của bạn. Một nơi để theo dõi.</h1><p className="mt-4 text-sm leading-relaxed text-muted">Đăng nhập để xem đơn hàng, theo dõi hàng đặt trước và những yêu cầu thu mua đã gửi.</p>{error?<p role="alert" className="mt-5 rounded-xl bg-bad-bg p-3 text-sm text-bad">Chưa đăng nhập thành công. Vui lòng thử lại.</p>:null}<div className="mt-7"><GoogleButton next="/tai-khoan" disabled={isDemo}/></div><p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-muted"><ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true"/>Không cần tạo thêm mật khẩu. Tiếp tục bằng tài khoản Google của bạn.</p>{isDemo?<p className="mt-5 rounded-xl bg-brand-subtle p-3 text-xs leading-relaxed text-brand-ink">Bạn đang xem bản demo. Tính năng đăng nhập hiện chưa được bật.</p>:null}<Link href="/san-pham" className="shop-section-link mt-6">Tiếp tục khám phá sản phẩm<ArrowRight size={15} aria-hidden="true"/></Link></div></div>
}
