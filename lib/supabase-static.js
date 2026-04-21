import { createClient } from '@supabase/supabase-js'

// Cookie-free Supabase client for ISR / static server-component data reads.
// Does NOT call cookies() — safe to use in pages with export const revalidate.
// Do NOT use for auth or any user-specific queries (use supabase-server.js for those).
export function createSupabaseStatic() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
