'use client'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container-dp flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="h-page">Trang tạm thời chưa tải được</h1>
      <p className="max-w-md text-muted">Có thể do kết nối mạng hoặc máy chủ dữ liệu. Bạn thử tải lại nhé.</p>
      <button type="button" className="btn btn-primary" onClick={reset}>Tải lại</button>
    </main>
  )
}
