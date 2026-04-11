'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

export default function ScoopSubBar({ open, pillWidth, pillRightOffset, dropdownWidth }) {
  const [user, setUser] = useState(undefined)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const hiw = pathname === '/how-it-works'

  // Right edge flush with pill left edge when closed, dropdown left edge when open.
  // pillRightOffset = distance from pill container's right edge to viewport right.
  // closed: marginRight = pillRightOffset + pillWidth  (= distance from viewport right to pill's left edge)
  // open:   marginRight = pillRightOffset + dropdownWidth (dropdown is anchored right:0, so its left edge = viewport right - pillRightOffset - dropdownWidth)
  const marginRight = open
    ? `${pillRightOffset + dropdownWidth}px`
    : `${pillRightOffset + pillWidth}px`

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <style>{`
        .sb-box {
          position: relative;
        }
        .sb-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(to right, transparent 0%, #c9a96e 20%, #c9a96e 80%, transparent 100%);
          pointer-events: none;
        }
      `}</style>
      <div className="sb-box" style={{
        marginRight,
        border: 'none',
        clipPath: 'ellipse(50% 100% at 50% 0%)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        background: 'linear-gradient(to right, transparent 0%, rgba(28,28,24,0.92) 15%, rgba(28,28,24,0.92) 85%, transparent 100%)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        padding: '0.75rem 3.5rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '1.5rem',
        fontSize: '13px',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'margin-right 200ms ease',
        whiteSpace: 'nowrap',
      }}>
        <Link
          href="/how-it-works"
          style={{ color: hiw ? '#c9a96e' : '#8a8a80', textDecoration: 'none' }}
        >
          How it works
        </Link>
        {user === undefined ? null : user ? (
          <>
            <Link href="/account" style={{ color: '#8a8a80', textDecoration: 'none' }}>My account</Link>
            <button
              onClick={handleSignOut}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8a8a80',
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                padding: 0,
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ color: '#8a8a80', textDecoration: 'none' }}>Log in</Link>
            <Link href="/signup" style={{ color: '#c9a96e', textDecoration: 'none' }}>Sign up</Link>
          </>
        )}
      </div>
    </div>
  )
}
