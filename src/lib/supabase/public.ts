import 'server-only'
import type { Database } from '@/lib/database.types'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/env'

let client: SupabaseClient<Database> | null = null

/** Client ẩn danh không dùng cookie: dữ liệu công khai (danh mục, sản phẩm) nên cache được. */
export function publicClient() {
  client ??= createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
  return client
}
