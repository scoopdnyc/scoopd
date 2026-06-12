'use client'

import { useState, useEffect } from 'react'

export default function ReferralBanner() {
  const [bannerSlug, setBannerSlug] = useState(null)
  const [referralLink, setReferralLink] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      const pending = localStorage.getItem('pending_banner')
      if (!pending) return
      const shown = JSON.parse(localStorage.getItem('banner_shown') || '{}')
      if (shown[pending]) {
        localStorage.removeItem('pending_banner')
        return
      }
      fetch('/api/user/referral', { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.referral_link) {
            setBannerSlug(pending)
            setReferralLink(data.referral_link)
          }
        })
        .catch(() => {})
    } catch {}
  }, [])

  function dismiss() {
    setReferralLink(null)
    if (!bannerSlug) return
    try {
      const shown = JSON.parse(localStorage.getItem('banner_shown') || '{}')
      shown[bannerSlug] = true
      localStorage.setItem('banner_shown', JSON.stringify(shown))
      localStorage.removeItem('pending_banner')
    } catch {}
    fetch('/api/actions/track', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_type: 'banner_dismissed', metadata: { slug: bannerSlug } }),
    }).catch(() => {})
  }

  function copy() {
    navigator.clipboard.writeText(referralLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!referralLink) return null

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
      background: '#1a1a16', border: '0.5px solid #2a2a26', borderRadius: '10px',
      padding: '1rem 1.25rem', maxWidth: '420px', width: 'calc(100vw - 3rem)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem',
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <span style={{ fontSize: '14px', color: '#e8e4dc', lineHeight: 1.5 }}>
          Did you get in? Share how you did it and extend your free access.
        </span>
        <button
          onClick={dismiss}
          style={{ background: 'none', border: 'none', color: '#8a8a80', cursor: 'pointer', fontSize: '20px', lineHeight: 1, flexShrink: 0, padding: 0 }}
        >×</button>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <code style={{
          flex: 1, background: '#0f0f0d', border: '0.5px solid #2a2a26', borderRadius: '6px',
          padding: '0.5rem 0.75rem', fontSize: '12px', color: '#c9a96e',
          fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {referralLink}
        </code>
        <button
          onClick={copy}
          style={{
            background: '#c9a96e', color: '#0f0f0d', border: 'none', borderRadius: '6px',
            padding: '0.5rem 0.75rem', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            flexShrink: 0, fontFamily: "'DM Sans', sans-serif", minWidth: '52px',
          }}
        >{copied ? 'Copied' : 'Copy'}</button>
      </div>
    </div>
  )
}
