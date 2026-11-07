import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { SUPABASE_URL } from '@/lib/env'
/** Typed service client confined to this feature; never imported by render/animation code. */
export function tradeinServiceClient() {
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!key)throw new Error('Trade-in service unavailable')
  return createClient<Database>(SUPABASE_URL,key,{auth:{persistSession:false,autoRefreshToken:false}})
}
