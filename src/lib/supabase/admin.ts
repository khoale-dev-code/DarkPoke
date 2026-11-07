import 'server-only'
import type { Database } from '@/lib/database.types'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from '@/lib/env'

/** Client service role: bỏ qua RLS. CHỈ dùng ở server cho webhook, cron, tải ảnh chuyển khoản, mời nhân viên. */
export function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Thiếu SUPABASE_SERVICE_ROLE_KEY')
  return createSupabaseClient<Database>(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
