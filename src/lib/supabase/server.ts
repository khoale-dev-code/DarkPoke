import 'server-only'
import type { Database } from '@/lib/database.types'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/env'

/** Client theo phiên đăng nhập của người dùng (đọc cookie). Dùng trong Server Component, Server Action, Route Handler. */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Gọi từ Server Component: bỏ qua, proxy.ts đã làm mới phiên.
        }
      }
    }
  })
}
