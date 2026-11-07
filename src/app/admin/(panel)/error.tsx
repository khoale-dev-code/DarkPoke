'use client'
import { AlertTriangle } from 'lucide-react'
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="card flex flex-col items-center gap-4 p-8 text-center"><AlertTriangle size={30} className="text-warn" aria-hidden="true" /><h1 className="text-xl font-semibold">Chưa tải được dữ liệu</h1><p className="max-w-md text-sm text-muted">Kiểm tra kết nối và cấu hình Supabase. Nếu vừa cập nhật, hãy chạy migration quản trị trong thư mục supabase/migrations.</p><button type="button" className="btn btn-primary" onClick={reset}>Thử tải lại</button></section>
}
