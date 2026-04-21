'use client'

import { useState } from 'react'
import Link from 'next/link'
import ScoopNav from '../components/ScoopNav'
import ScoopFooter from '../components/ScoopFooter'

export default function FoundingClient({ isLoggedIn }) {
  const [loading, setLoading] = useState(null) // 'month' | 'year' | null

  function handleCheckout(interval) {
    if (!isLoggedIn) {
      window.location.href = '/register?next=/founding'
      return
    }
    setLoading(interval)
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/api/stripe/checkout'
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'founding'
    input.value = 'true'
    const intervalInput = document.createElement('input')
    intervalInput.type = 'hidden'
    intervalInput.name = 'interval'
    intervalInput.value = interval
    form.appendChild(input)
    form.appendChild(intervalInput)
    document.body.appendChild(form)
    form.submit()
  }

  return (
    <main style={{ background: '#0f0f0d', minHeight: '100vh', color: '#e8e4dc', fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <ScoopNav />

      <section className="fm-hero">
        <div className="fm-eyebrow">Founding Member</div>
        <h1 className="fm-headline">The price that disappears.</h1>
        <p className="fm-sub">
          We are offering a founding rate to a small group of early members before this goes public.
          Lock it in and it is yours as long as you stay subscribed. Cancel and it is gone. The public price is $9.99 a month and this rate will not come back.
        </p>
      </section>

      <section className="fm-pricing">
        <div className="fm-plan-card">
          <div className="fm-plan-label">Monthly</div>
          <div className="fm-plan-price">$2.99<span className="fm-plan-per">/month</span></div>
          <div className="fm-plan-note">Lock it in forever</div>
          <button
            className="fm-plan-btn"
            onClick={() => handleCheckout('month')}
            disabled={loading !== null}
          >
            {loading === 'month' ? 'Redirecting...' : 'Get founding access'}
          </button>
        </div>

        <div className="fm-plan-card fm-plan-card--featured">
          <div className="fm-plan-badge">Best value</div>
          <div className="fm-plan-label">Yearly</div>
          <div className="fm-plan-price">$18<span className="fm-plan-per">/year</span></div>
          <div className="fm-plan-note">$1.50/month. One charge, done.</div>
          <button
            className="fm-plan-btn fm-plan-btn--featured"
            onClick={() => handleCheckout('year')}
            disabled={loading !== null}
          >
            {loading === 'year' ? 'Redirecting...' : 'Get founding access'}
          </button>
        </div>
      </section>

      <section className="fm-includes">
        <div className="fm-includes-label">What&apos;s included</div>
        <ul className="fm-includes-list">
          <li className="fm-includes-item">
            <span className="fm-check">→</span>
            Exact drop dates for every restaurant. The precise calendar day and time a reservation becomes available
          </li>
          <li className="fm-includes-item">
            <span className="fm-check">→</span>
            Daily drop schedule. Every restaurant&apos;s next release, sorted by what&apos;s coming up first
          </li>
          <li className="fm-includes-item">
            <span className="fm-check">→</span>
            Plan by date. Enter a target dinner date and see every drop that still stands between you and that table
          </li>
          <li className="fm-includes-item">
            <span className="fm-check">→</span>
            Drop alerts when built. Get notified the moment a restaurant you&apos;re watching opens its next window
          </li>
        </ul>
      </section>

      <div className="fm-footer-note">
        This page is not advertised. If you found it, you were meant to.
      </div>
      <ScoopFooter />
    </main>
  )
}
