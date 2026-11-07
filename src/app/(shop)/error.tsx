'use client'
import Link from 'next/link'
import { PackageSearch } from 'lucide-react'
export default function ShopError({reset}:{error:Error;reset:()=>void}) {return <div className="shop-container shop-page"><div className="shop-empty"><span className="shop-empty-icon"><PackageSearch size={30} aria-hidden="true"/></span><h1 className="h-section">Chưa tải được trang</h1><p>Kiểm tra kết nối rồi thử lại. Các sản phẩm trong giỏ hàng của bạn vẫn được giữ trên thiết bị.</p><div className="flex flex-wrap justify-center gap-3"><button type="button" className="btn btn-primary" onClick={reset}>Thử lại</button><Link href="/" className="btn btn-secondary">Về trang chủ</Link></div></div></div>}
