'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

function getPlaceholderDate() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  }) + ' at 10:00 AM ET'
}

export default function PremiumReveal({ dropDate, isPlatformWalkIn }) {
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function checkPremium() {
      try {
        const supabase = getSupabaseBrowser()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', session.user.id)
          .single()
        if (sub?.status === 'active') setRevealed(true)
      } catch {
        // silently fail, stays blurred
      } finally {
        setLoading(false)
      }
    }
    checkPremium()
  }, [])

  if (isPlatformWalkIn) return null

  if (revealed && dropDate) {
    return (
      <div className="rp-drop-card">
        <div className="rp-drop-label">Next Drop Date</div>
        <div style={{fontFamily:"'DM Mono',monospace",color:'#c9a96e',fontSize:'18px',fontWeight:400,letterSpacing:'0.5px',marginTop:'0.5rem'}}>
          {dropDate}
        </div>
      </div>
    )
  }

  return (
    <div className="rp-drop-card">
      <div className="rp-drop-label">Next Drop Date</div>
      <div className="rp-drop-blurred">{getPlaceholderDate()}</div>
      {!loading && (
        <div className="rp-drop-overlay">
          <span className="rp-drop-lock">
            <svg width="20" height="24" viewBox="0 0 20 24" fill="none" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="11" width="16" height="12" rx="2"/>
              <path d="M6 11V7a4 4 0 0 1 8 0v4"/>
            </svg>
          </span>
          <span className="rp-drop-overlay-text">Sign up to unlock exact drop dates</span>
          <Link href="/signup" className="rp-drop-cta">Get access →</Link>
        </div>
      )}
    </div>
  )
}
