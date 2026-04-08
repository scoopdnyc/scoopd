'use client'

import { getSupabaseBrowser } from '@/lib/supabase-browser'

export default function NavSignOut() {
  async function handleSignOut() {
    try {
      const supabase = getSupabaseBrowser()
      await supabase.auth.signOut()
    } catch {
      // proceed regardless
    }
    window.location.href = '/'
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      style={{ background: 'transparent', border: 'none', color: '#8a8a80', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: 0 }}
    >
      Sign out
    </button>
  )
}
