'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import ScoopNav from '../components/ScoopNav'
import ScoopFooter from '../components/ScoopFooter'

export default function SignupClient() {
  const [user, setUser] = useState(undefined)
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(null) // 'month' | 'year' | null

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', u.id)
          .single()
        setIsPremium(sub?.status === 'active')
      }
    })
  }, [])

  function handleCheckout(interval) {
    if (!user) {
      window.location.href = '/login?next=/signup'
      return
    }
    setLoading(interval)
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/api/stripe/checkout'
    const foundingInput = document.createElement('input')
    foundingInput.type = 'hidden'
    foundingInput.name = 'founding'
    foundingInput.value = 'false'
    const intervalInput = document.createElement('input')
    intervalInput.type = 'hidden'
    intervalInput.name = 'interval'
    intervalInput.value = interval
    form.appendChild(foundingInput)
    form.appendChild(intervalInput)
    document.body.appendChild(form)
    form.submit()
  }

  return (
    <main style={{ background: '#0f0f0d', minHeight: '100vh', color: '#e8e4dc', fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`
        .su-hero { max-width: 680px; margin: 0 auto; padding: 5rem 2rem 4rem; text-align: center; }
        .su-eyebrow { font-family: var(--font-dm-mono), monospace; font-size: 11px; letter-spacing: 2.5px; color: #c9a96e; text-transform: uppercase; margin-bottom: 1.25rem; }
        .su-headline { font-family: var(--font-playfair), serif; font-size: 52px; line-height: 1.05; color: #e8e4dc; margin: 0 0 1.25rem; }
        .su-sub { font-size: 16px; color: #8a8a80; line-height: 1.8; max-width: 480px; margin: 0 auto; }
        .su-pricing { display: flex; gap: 1.25rem; justify-content: center; padding: 0 2rem 5rem; flex-wrap: wrap; }
        .su-plan-card { position: relative; background: #1a1a16; border: 0.5px solid #2a2a26; border-radius: 12px; padding: 2.25rem 2rem; width: 280px; display: flex; flex-direction: column; gap: 0.5rem; }
        .su-plan-card--featured { border-color: #c9a96e; }
        .su-plan-badge { position: absolute; top: -11px; left: 50%; transform: translateX(-50%); background: #c9a96e; color: #0f0f0d; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
        .su-plan-label { font-family: var(--font-dm-mono), monospace; font-size: 10px; letter-spacing: 1.5px; color: #6b6b60; text-transform: uppercase; margin-bottom: 0.25rem; }
        .su-plan-price { font-family: var(--font-playfair), serif; font-size: 42px; color: #e8e4dc; line-height: 1; margin-bottom: 0.25rem; }
        .su-plan-per { font-family: var(--font-dm-sans), sans-serif; font-size: 16px; color: #8a8a80; font-weight: 400; }
        .su-plan-note { font-size: 13px; color: #8a8a80; margin-bottom: 1.5rem; line-height: 1.5; }
        .su-plan-btn { width: 100%; background: #2a2a26; color: #e8e4dc; border: 0.5px solid #3a3a34; border-radius: 8px; padding: 0.85rem; font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font-dm-sans), sans-serif; transition: background 0.15s, border-color 0.15s; margin-top: auto; }
        .su-plan-btn:hover:not(:disabled) { background: #333330; border-color: #4a4a44; }
        .su-plan-btn--featured { background: #c9a96e; color: #0f0f0d; border-color: #c9a96e; }
        .su-plan-btn--featured:hover:not(:disabled) { background: #e8c98e; border-color: #e8c98e; }
        .su-plan-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .su-already { max-width: 480px; margin: 0 auto; padding: 0 2rem 5rem; text-align: center; }
        .su-already-card { background: #1a1a16; border: 0.5px solid #2a2a26; border-radius: 12px; padding: 2.5rem 2rem; }
        .su-already-label { font-family: var(--font-dm-mono), monospace; font-size: 10px; letter-spacing: 2px; color: #6ec9a0; text-transform: uppercase; margin-bottom: 1rem; }
        .su-already-text { font-size: 15px; color: #8a8a80; line-height: 1.7; margin-bottom: 1.5rem; }
        .su-already-link { display: inline-block; color: #c9a96e; font-size: 14px; text-decoration: none; border-bottom: 0.5px solid #c9a96e; padding-bottom: 1px; }
        .su-already-link:hover { opacity: 0.8; }
        @media (max-width: 600px) {
          .su-headline { font-size: 36px; }
          .su-hero { padding: 3.5rem 1.5rem 3rem; }
          .su-pricing { padding: 0 1.5rem 3rem; flex-direction: column; align-items: center; }
          .su-plan-card { width: 100%; max-width: 340px; }
        }
      `}</style>

      <ScoopNav />

      <div className="su-hero">
        <div className="su-eyebrow">Get Started</div>
        <h1 className="su-headline">Know when tables drop.</h1>
        <p className="su-sub">Exact drop dates for every restaurant we track — the precise calendar day and time a reservation becomes available.</p>
      </div>

      {isPremium ? (
        <div className="su-already">
          <div className="su-already-card">
            <div className="su-already-label">Already subscribed</div>
            <p className="su-already-text">You already have premium access. Manage your subscription, view billing details, and update your account from your account page.</p>
            <Link href="/account" className="su-already-link">Go to my account →</Link>
          </div>
        </div>
      ) : (
        <div className="su-pricing">
          <div className="su-plan-card">
            <div className="su-plan-label">Monthly</div>
            <div className="su-plan-price">$9.99<span className="su-plan-per">/month</span></div>
            <div className="su-plan-note">Cancel anytime</div>
            <button
              className="su-plan-btn"
              onClick={() => handleCheckout('month')}
              disabled={loading !== null}
            >
              {loading === 'month' ? 'Redirecting...' : 'Get access'}
            </button>
          </div>

          <div className="su-plan-card su-plan-card--featured">
            <div className="su-plan-badge">Best value</div>
            <div className="su-plan-label">Yearly</div>
            <div className="su-plan-price">$60<span className="su-plan-per">/year</span></div>
            <div className="su-plan-note">$5/month, billed annually</div>
            <button
              className="su-plan-btn su-plan-btn--featured"
              onClick={() => handleCheckout('year')}
              disabled={loading !== null}
            >
              {loading === 'year' ? 'Redirecting...' : 'Get access'}
            </button>
          </div>
        </div>
      )}
      <ScoopFooter />
    </main>
  )
}
