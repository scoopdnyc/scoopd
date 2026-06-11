'use client'

import Link from 'next/link'
import ScoopNav from '../components/ScoopNav'
import ScoopFooter from '../components/ScoopFooter'

export default function SignupClient() {
  return (
    <main style={{ background: '#0f0f0d', minHeight: '100vh', color: '#e8e4dc', fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`
        .su-hero { max-width: 680px; margin: 0 auto; padding: 5rem 2rem 4rem; text-align: center; }
        .su-eyebrow { font-family: var(--font-dm-mono), monospace; font-size: 11px; letter-spacing: 2.5px; color: #c9a96e; text-transform: uppercase; margin-bottom: 1.25rem; }
        .su-headline { font-family: var(--font-playfair), serif; font-size: 52px; line-height: 1.05; color: #e8e4dc; margin: 0 0 1.25rem; }
        .su-sub { font-size: 16px; color: #8a8a80; line-height: 1.8; max-width: 480px; margin: 0 auto 2.5rem; }
        .su-cta-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
        .su-cta-btn { display: inline-block; background: #c9a96e; color: #0f0f0d; font-family: var(--font-dm-sans), sans-serif; font-size: 15px; font-weight: 700; padding: 0.9rem 2.5rem; border-radius: 8px; text-decoration: none; }
        .su-cta-btn:hover { background: #d4b87a; }
        .su-cta-note { font-size: 13px; color: #6b6b60; font-family: var(--font-dm-mono), monospace; letter-spacing: 0.5px; }
        .su-login { font-size: 13px; color: #8a8a80; margin-top: 0.25rem; }
        .su-login a { color: #c9a96e; text-decoration: none; }
        .su-login a:hover { opacity: 0.8; }
        @media (max-width: 600px) {
          .su-headline { font-size: 36px; }
          .su-hero { padding: 3.5rem 1.5rem 3rem; }
        }
      `}</style>

      <ScoopNav />

      <div className="su-hero">
        <div className="su-eyebrow">Get Started</div>
        <h1 className="su-headline">Know when tables drop.</h1>
        <p className="su-sub">Exact drop dates for every restaurant we track. Free for 45 days, no credit card required.</p>
        <div className="su-cta-wrap">
          <Link href="/register" className="su-cta-btn">Create free account</Link>
          <div className="su-cta-note">45 days free. No credit card.</div>
          <div className="su-login">Already have an account? <Link href="/login">Log in</Link></div>
        </div>
      </div>

      <ScoopFooter />
    </main>
  )
}
