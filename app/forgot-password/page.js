'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import ScoopFooter from '../components/ScoopFooter'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    })
    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('success')
    }
  }

  return (
    <main style={{ background: '#0f0f0d', minHeight: '100vh', color: '#e8e4dc', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .fp-nav{display:flex;justify-content:space-between;align-items:center;padding:1.25rem 2rem;border-bottom:0.5px solid #2a2a26}
        .fp-logo{font-family:'Playfair Display',serif;font-size:22px;color:#e8e4dc;text-decoration:none}
        .fp-wrap{display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 64px);padding:2rem}
        .fp-card{background:#1a1a16;border:0.5px solid #2a2a26;border-radius:12px;padding:3rem 2.5rem;max-width:460px;width:100%}
        .fp-eyebrow{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;margin-bottom:1rem;text-align:center}
        .fp-headline{font-family:'Playfair Display',serif;font-size:32px;line-height:1.15;color:#e8e4dc;margin-bottom:0.5rem;text-align:center}
        .fp-sub{font-size:14px;color:#8a8a80;text-align:center;margin-bottom:2rem;line-height:1.6}
        .fp-label{display:block;font-size:12px;color:#8a8a80;margin-bottom:0.5rem;letter-spacing:0.5px}
        .fp-input{width:100%;background:#0f0f0d;border:0.5px solid #2a2a26;border-radius:8px;padding:0.875rem 1rem;color:#e8e4dc;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;box-sizing:border-box;margin-bottom:1rem}
        .fp-input::placeholder{color:#444440}
        .fp-input:focus{border-color:#c9a96e}
        .fp-btn{width:100%;background:#c9a96e;color:#0f0f0d;border:none;border-radius:8px;padding:0.9rem;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity 0.15s;margin-top:0.25rem}
        .fp-btn:hover{opacity:0.9}
        .fp-btn:disabled{opacity:0.5;cursor:not-allowed}
        .fp-success{background:#0f1a16;border:0.5px solid #1f3a2a;border-radius:8px;padding:1rem 1.25rem;font-size:14px;color:#6ec9a0;line-height:1.6}
        .fp-error{background:#1a0f0f;border:0.5px solid #3a1f1f;border-radius:8px;padding:1rem 1.25rem;font-size:14px;color:#c96e6e;margin-bottom:1.25rem;line-height:1.5}
        .fp-divider{border:none;border-top:0.5px solid #2a2a26;margin:1.75rem 0}
        .fp-footer{font-size:13px;color:#8a8a80;text-align:center}
        .fp-footer a{color:#c9a96e;text-decoration:none}
        .fp-footer a:hover{text-decoration:underline}
      `}</style>

      <nav className="fp-nav">
        <Link href="/" className="fp-logo">Scoopd</Link>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '13px' }}>
          <Link href="/how-it-works" style={{ color: '#8a8a80', textDecoration: 'none' }}>How it works</Link>
          <Link href="/login" style={{ color: '#c9a96e', textDecoration: 'none' }}>Log in</Link>
        </div>
      </nav>

      <div className="fp-wrap">
        <div className="fp-card">
          <div className="fp-eyebrow">Account</div>
          <h1 className="fp-headline">Reset your password.</h1>
          <p className="fp-sub">Enter your email and we&apos;ll send you a link to set a new password.</p>

          {status === 'error' && (
            <div className="fp-error">{errorMsg || 'Something went wrong. Please try again.'}</div>
          )}

          {status === 'success' ? (
            <div className="fp-success">
              Check your inbox — we sent a password reset link to <strong>{email}</strong>. It may take a minute to arrive.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="fp-label">Email</label>
              <input
                className="fp-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <button className="fp-btn" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}

          <hr className="fp-divider" />

          <p className="fp-footer">
            <Link href="/login">Back to log in</Link>
            {' '}&nbsp;·&nbsp;{' '}
            <Link href="/register">Create an account</Link>
          </p>
        </div>
      </div>
      <ScoopFooter />
    </main>
  )
}
