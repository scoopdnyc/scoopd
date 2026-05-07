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

  const marginRight = open
    ? `${pillRightOffset + dropdownWidth}px`
    : `${pillRightOffset + pillWidth}px`

  return (
    <div className="sb-outer" style={{ '--sb-mr': marginRight }}>
      <style>{`
        .sb-outer {
          display: flex;
          justify-content: flex-end;
        }
        .sb-box {
          position: relative;
          margin-right: var(--sb-mr, 0px);
          border: none;
          clip-path: ellipse(50% 100% at 50% 0%);
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          background: linear-gradient(to right, transparent 0%, rgba(28,28,24,0.92) 15%, rgba(28,28,24,0.92) 85%, transparent 100%);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          padding: 0.75rem 3.5rem;
          display: inline-flex;
          align-items: center;
          gap: 1.5rem;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          transition: margin-right 200ms ease;
          white-space: nowrap;
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
        @media (max-width: 640px) {
          .sb-outer {
            justify-content: center;
          }
          .sb-box {
            margin-right: 0 !important;
            padding: 0.6rem 1.5rem;
            gap: 1rem;
            clip-path: none;
          }
        }
      `}</style>
      <div className="sb-box">
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
