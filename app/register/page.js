'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const [optIn, setOptIn] = useState(true)

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')

    if (password !== confirm) {
      setStatus('error')
      setErrorMsg('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setStatus('error')
      setErrorMsg('Password must be at least 8 characters.')
      return
    }

    setStatus('loading')
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      if (optIn) {
        fetch('https://script.google.com/macros/s/AKfycbxftfY_nFOq59pOpWBkkSYuQTc5tUjZ8u5pQkXJ_SG03DB1PT7_Ny7DXhU46Q_mae2l/exec', {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }).catch(() => {})
      }
      setStatus('success')
    }
  }

  return (
    <main style={{ background: '#0f0f0d', minHeight: '100vh', color: '#e8e4dc', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .rg-nav{display:flex;justify-content:space-between;align-items:center;padding:1.25rem 2rem;border-bottom:0.5px solid #2a2a26}
        .rg-logo{font-family:'Playfair Display',serif;font-size:22px;color:#e8e4dc;text-decoration:none}
        .rg-wrap{display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 64px);padding:2rem}
        .rg-card{background:#1a1a16;border:0.5px solid #2a2a26;border-radius:12px;padding:3rem 2.5rem;max-width:460px;width:100%}
        .rg-eyebrow{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;margin-bottom:1rem;text-align:center}
        .rg-headline{font-family:'Playfair Display',serif;font-size:32px;line-height:1.15;color:#e8e4dc;margin-bottom:0.5rem;text-align:center}
        .rg-sub{font-size:14px;color:#8a8a80;text-align:center;margin-bottom:2rem}
        .rg-label{display:block;font-size:12px;color:#8a8a80;margin-bottom:0.5rem;letter-spacing:0.5px}
        .rg-input{width:100%;background:#0f0f0d;border:0.5px solid #2a2a26;border-radius:8px;padding:0.875rem 1rem;color:#e8e4dc;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;box-sizing:border-box;margin-bottom:1.25rem}
        .rg-input::placeholder{color:#444440}
        .rg-input:focus{border-color:#c9a96e}
        .rg-btn{width:100%;background:#c9a96e;color:#0f0f0d;border:none;border-radius:8px;padding:0.9rem;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity 0.15s}
        .rg-btn:hover{opacity:0.9}
        .rg-btn:disabled{opacity:0.5;cursor:not-allowed}
        .rg-success{background:#0f1a16;border:0.5px solid #1f3a2a;border-radius:8px;padding:1.25rem;font-size:14px;color:#6ec9a0;margin-bottom:1.25rem;line-height:1.6;text-align:center}
        .rg-error{background:#1a0f0f;border:0.5px solid #3a1f1f;border-radius:8px;padding:1rem 1.25rem;font-size:14px;color:#c96e6e;margin-bottom:1.25rem;line-height:1.5}
        .rg-divider{border:none;border-top:0.5px solid #2a2a26;margin:1.75rem 0}
        .rg-footer{font-size:13px;color:#8a8a80;text-align:center}
        .rg-footer a{color:#c9a96e;text-decoration:none}
        .rg-footer a:hover{text-decoration:underline}
      `}</style>

      <nav className="rg-nav">
        <Link href="/" className="rg-logo">Scoopd</Link>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '13px' }}>
          <Link href="/how-it-works" style={{ color: '#8a8a80', textDecoration: 'none' }}>How it works</Link>
          <Link href="/login" style={{ color: '#c9a96e', textDecoration: 'none' }}>Sign in</Link>
        </div>
      </nav>

      <div className="rg-wrap">
        <div className="rg-card">
          <div className="rg-eyebrow">Create Account</div>
          <h1 className="rg-headline">Get the scoop.</h1>
          <p className="rg-sub">Create your account to unlock exact drop dates.</p>

          {status === 'error' && (
            <div className="rg-error">{errorMsg}</div>
          )}

          {status === 'success' ? (
            <div className="rg-success">
              <strong>Check your email.</strong><br />
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="rg-label">Email</label>
              <input
                className="rg-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <label className="rg-label">Password</label>
              <input
                className="rg-input"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <label className="rg-label">Confirm password</label>
              <input
                className="rg-input"
                type="password"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '1.25rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={optIn}
                  onChange={e => setOptIn(e.target.checked)}
                  style={{ marginTop: '2px', accentColor: '#c9a96e', width: '14px', height: '14px', flexShrink: 0, cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', color: '#8a8a80', lineHeight: 1.5 }}>
                  Notify me when Scoopd launches new features
                </span>
              </label>
              <button className="rg-btn" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          )}

          <hr className="rg-divider" />
          <p className="rg-footer">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
