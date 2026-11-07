import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="container-dp flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="code text-muted">404</p>
      <h1 className="h-page">Không tìm thấy trang</h1>
      <p className="max-w-md text-muted">Trang bạn tìm có thể đã đổi đường dẫn hoặc sản phẩm đã ngừng bán.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">Về trang chủ</Link>
        <Link href="/san-pham" className="btn btn-secondary">Xem sản phẩm</Link>
      </div>
    </main>
  )
}
