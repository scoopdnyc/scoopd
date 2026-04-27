import { createClient } from '@supabase/supabase-js'

// Cookie-free Supabase client for ISR / static server-component data reads.
// Does NOT call cookies() — safe to use in pages with export const revalidate.
// Do NOT use for auth or any user-specific queries (use supabase-server.js for those).
//
// The custom global.fetch passes next: { revalidate: 3600 } to every Supabase
// REST call so Next.js's fetch instrumentation treats them as cacheable, enabling
// the route segment to emit s-maxage ISR headers instead of no-store.
export function createSupabaseStatic() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        fetch: (url, options = {}) =>
          fetch(url, { ...options, next: { revalidate: 3600 } }),
      },
    }
  )
}
