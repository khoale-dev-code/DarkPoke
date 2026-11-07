import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  // Chỉ chạy ở các trang cần phiên đăng nhập; trang sản phẩm công khai không đi qua proxy nên cache tốt hơn.
  matcher: ['/admin/:path*', '/pos/:path*', '/tai-khoan/:path*', '/auth/:path*', '/don-hang/:path*']
}
