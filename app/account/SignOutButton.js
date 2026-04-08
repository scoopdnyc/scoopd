'use client'

import { getSupabaseBrowser } from '@/lib/supabase-browser'

export default function SignOutButton() {
  async function handleSignOut() {
    try {
      const supabase = getSupabaseBrowser()
      await supabase.auth.signOut()
    } catch {
      // proceed to redirect regardless
    }
    window.location.href = '/'
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      style={{
        background: 'transparent',
        color: '#8a8a80',
        border: 'none',
        padding: 0,
        fontSize: '13px',
        cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
        textDecoration: 'underline',
      }}
    >
      Sign out
    </button>
  )
}
