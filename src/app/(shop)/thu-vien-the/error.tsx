'use client'
import Link from 'next/link'
import '@/features/card-library/library.css'
export default function LibraryError({reset}:{reset:()=>void}) {return <div className="shop-container dex-page"><div className="dex-empty"><h1>Chưa mở được thư viện thẻ</h1><p>Vui lòng thử tải lại để tiếp tục tra cứu.</p><div><button type="button" className="btn btn-primary" onClick={reset}>Thử lại</button><Link href="/" className="btn btn-secondary">Về trang chủ</Link></div></div></div>}
