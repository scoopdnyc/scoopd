'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import './AlertBell.css'

export default function AlertBell({ slug }) {
  const [status, setStatus] = useState('loading') // loading | guest | free | active | inactive
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const supabase = getSupabaseBrowser()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { if (!cancelled) setStatus('guest'); return }

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', session.user.id)
          .single()
        if (sub?.status !== 'active') { if (!cancelled) setStatus('free'); return }

        const res = await fetch('/api/alerts')
        const json = await res.json()
        const active = (json.alerts || []).some(a => a.restaurant_slug === slug)
        if (!cancelled) setStatus(active ? 'active' : 'inactive')
      } catch {
        if (!cancelled) setStatus('guest')
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  async function handleToggle() {
    if (busy) return
    if (status === 'guest' || status === 'free' || status === 'loading') return

    const next = status === 'active' ? 'inactive' : 'active'
    setStatus(next)
    setBusy(true)
    try {
      const res = await fetch('/api/alerts/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_slug: slug }),
      })
      if (!res.ok) {
        setStatus(next === 'active' ? 'inactive' : 'active')
      } else {
        const json = await res.json()
        if (json.active) window.gtag?.('event', 'alert_set')
        setStatus(json.active ? 'active' : 'inactive')
      }
    } catch {
      setStatus(next === 'active' ? 'inactive' : 'active')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'guest' || status === 'free') {
    const href = status === 'guest' ? '/signup' : '/account'
    const label = status === 'guest'
      ? 'Sign up to set a drop alert'
      : 'Subscribe to set a drop alert'
    return (
      <Link href={href} className="ab-btn" aria-label={label} title={label}>
        <BellIcon active={false} />
        <span className="ab-label">Alert</span>
      </Link>
    )
  }

  const isActive = status === 'active'

  return (
    <button
      type="button"
      className={isActive ? 'ab-btn ab-active' : 'ab-btn'}
      onClick={handleToggle}
      disabled={status === 'loading' || busy}
      aria-label={isActive ? 'Remove drop alert' : 'Set a drop alert'}
      aria-pressed={isActive}
    >
      <BellIcon active={isActive} />
      <span className="ab-label">{isActive ? 'Alerted' : 'Alert'}</span>
    </button>
  )
}

function BellIcon({ active }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill={active ? 'currentColor' : '#c9a96e'}
      stroke={active ? 'currentColor' : '#c9a96e'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}
