'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import ScoopFooter from '../components/ScoopFooter'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  // 'waiting' — extracting session from hash
  // 'ready'   — session confirmed, show form
  // 'loading' — submitting update
  // 'success' — password updated
  // 'error'   — something went wrong
  const [status, setStatus] = useState('waiting')
  const [errorMsg, setErrorMsg] = useState('')
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    let recovered = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        recovered = true
        setSessionReady(true)
        setStatus('ready')
      }
    })

    const timeout = setTimeout(() => {
      if (!recovered) {
        setStatus('error')
        setErrorMsg('This reset link is invalid or has expired. Request a new one below.')
      }
    }, 8000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
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
    setErrorMsg('')
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.updateUser({ password })
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
        .pw-nav{display:flex;justify-content:space-between;align-items:center;padding:1.25rem 2rem;border-bottom:0.5px solid #2a2a26}
        .pw-logo{font-family:'Playfair Display',serif;font-size:22px;color:#e8e4dc;text-decoration:none}
        .pw-wrap{display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 64px);padding:2rem}
        .pw-card{background:#1a1a16;border:0.5px solid #2a2a26;border-radius:12px;padding:3rem 2.5rem;max-width:460px;width:100%}
        .pw-eyebrow{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;margin-bottom:1rem;text-align:center}
        .pw-headline{font-family:'Playfair Display',serif;font-size:32px;line-height:1.15;color:#e8e4dc;margin-bottom:0.5rem;text-align:center}
        .pw-sub{font-size:14px;color:#8a8a80;text-align:center;margin-bottom:2rem;line-height:1.6}
        .pw-label{display:block;font-size:12px;color:#8a8a80;margin-bottom:0.5rem;letter-spacing:0.5px}
        .pw-input{width:100%;background:#0f0f0d;border:0.5px solid #2a2a26;border-radius:8px;padding:0.875rem 1rem;color:#e8e4dc;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;box-sizing:border-box;margin-bottom:1rem}
        .pw-input::placeholder{color:#444440}
        .pw-input:focus{border-color:#c9a96e}
        .pw-btn{width:100%;background:#c9a96e;color:#0f0f0d;border:none;border-radius:8px;padding:0.9rem;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity 0.15s;margin-top:0.25rem}
        .pw-btn:hover{opacity:0.9}
        .pw-btn:disabled{opacity:0.5;cursor:not-allowed}
        .pw-success{background:#0f1a16;border:0.5px solid #1f3a2a;border-radius:8px;padding:1rem 1.25rem;font-size:14px;color:#6ec9a0;line-height:1.6;margin-bottom:1.25rem}
        .pw-error{background:#1a0f0f;border:0.5px solid #3a1f1f;border-radius:8px;padding:1rem 1.25rem;font-size:14px;color:#c96e6e;margin-bottom:1.25rem;line-height:1.5}
        .pw-waiting{font-size:14px;color:#8a8a80;text-align:center;padding:1rem 0}
        .pw-divider{border:none;border-top:0.5px solid #2a2a26;margin:1.75rem 0}
        .pw-footer{font-size:13px;color:#8a8a80;text-align:center}
        .pw-footer a{color:#c9a96e;text-decoration:none}
        .pw-footer a:hover{text-decoration:underline}
      `}</style>

      <nav className="pw-nav">
        <Link href="/" className="pw-logo">Scoopd</Link>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '13px' }}>
          <Link href="/how-it-works" style={{ color: '#8a8a80', textDecoration: 'none' }}>How it works</Link>
          <Link href="/login" style={{ color: '#c9a96e', textDecoration: 'none' }}>Log in</Link>
        </div>
      </nav>

      <div className="pw-wrap">
        <div className="pw-card">
          <div className="pw-eyebrow">Account</div>
          <h1 className="pw-headline">Set a new password.</h1>
          <p className="pw-sub">Choose a new password for your account.</p>

          {status === 'waiting' && (
            <p className="pw-waiting">Verifying your reset link...</p>
          )}

          {(status === 'error') && (
            <div className="pw-error">{errorMsg || 'Something went wrong. Please try again.'}</div>
          )}

          {status === 'success' && (
            <div className="pw-success">
              Your password has been updated. You can now sign in with your new password.
            </div>
          )}

          {(status === 'ready' || status === 'loading' || (status === 'error' && sessionReady)) && (
            <form onSubmit={handleSubmit}>
              <label className="pw-label">New password</label>
              <input
                className="pw-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <label className="pw-label">Confirm new password</label>
              <input
                className="pw-input"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button className="pw-btn" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Updating...' : 'Update password'}
              </button>
            </form>
          )}

          <hr className="pw-divider" />

          <p className="pw-footer">
            {status === 'success'
              ? <Link href="/login">Go to log in →</Link>
              : status === 'error' && !sessionReady
              ? <Link href="/forgot-password">Request a new reset link →</Link>
              : <><Link href="/login">Back to log in</Link> &nbsp;·&nbsp; <Link href="/forgot-password">Resend reset link</Link></>
            }
          </p>
        </div>
      </div>
      <ScoopFooter />
    </main>
  )
}
