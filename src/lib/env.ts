export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

/** Chưa cấu hình Supabase thì web chạy bằng dữ liệu mẫu (chế độ demo), không ghi được dữ liệu. */
export const isDemo = !SUPABASE_URL || !SUPABASE_ANON_KEY

export const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

export const DEMO_MESSAGE = 'Chế độ demo: hãy cấu hình Supabase trong .env.local để lưu dữ liệu.'
