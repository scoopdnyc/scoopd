'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import ScoopFooter from '../components/ScoopFooter'

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const supabase = getSupabaseBrowser()
  const [mode, setMode] = useState('password') // 'password' | 'magic'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  async function handlePasswordLogin(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      window.location.href = next || '/account'
    }
  }

  async function handleMagicLink(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${next || '/account'}` },
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
        .lg-nav{display:flex;justify-content:space-between;align-items:center;padding:1.25rem 2rem;border-bottom:0.5px solid #2a2a26}
        .lg-logo{font-family:'Playfair Display',serif;font-size:22px;color:#e8e4dc;text-decoration:none}
        .lg-wrap{display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 64px);padding:2rem}
        .lg-card{background:#1a1a16;border:0.5px solid #2a2a26;border-radius:12px;padding:3rem 2.5rem;max-width:460px;width:100%}
        .lg-eyebrow{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;margin-bottom:1rem;text-align:center}
        .lg-headline{font-family:'Playfair Display',serif;font-size:32px;line-height:1.15;color:#e8e4dc;margin-bottom:0.5rem;text-align:center}
        .lg-sub{font-size:14px;color:#8a8a80;text-align:center;margin-bottom:2rem}
        .lg-tabs{display:flex;background:#0f0f0d;border:0.5px solid #2a2a26;border-radius:8px;padding:4px;margin-bottom:2rem;gap:4px}
        .lg-tab{flex:1;padding:0.6rem;font-size:13px;font-family:'DM Sans',sans-serif;border-radius:6px;cursor:pointer;transition:all 0.15s}
        .lg-label{display:block;font-size:12px;color:#8a8a80;margin-bottom:0.5rem;letter-spacing:0.5px}
        .lg-input{width:100%;background:#0f0f0d;border:0.5px solid #2a2a26;border-radius:8px;padding:0.875rem 1rem;color:#e8e4dc;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;box-sizing:border-box;margin-bottom:1rem}
        .lg-input::placeholder{color:#444440}
        .lg-input:focus{border-color:#c9a96e}
        .lg-btn{width:100%;background:#c9a96e;color:#0f0f0d;border:none;border-radius:8px;padding:0.9rem;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity 0.15s;margin-top:0.25rem}
        .lg-btn:hover{opacity:0.9}
        .lg-btn:disabled{opacity:0.5;cursor:not-allowed}
        .lg-success{background:#0f1a16;border:0.5px solid #1f3a2a;border-radius:8px;padding:1rem 1.25rem;font-size:14px;color:#6ec9a0;margin-bottom:1.25rem;line-height:1.5}
        .lg-error{background:#1a0f0f;border:0.5px solid #3a1f1f;border-radius:8px;padding:1rem 1.25rem;font-size:14px;color:#c96e6e;margin-bottom:1.25rem;line-height:1.5}
        .lg-divider{border:none;border-top:0.5px solid #2a2a26;margin:1.75rem 0}
        .lg-footer{font-size:13px;color:#8a8a80;text-align:center}
        .lg-footer a{color:#c9a96e;text-decoration:none}
        .lg-footer a:hover{text-decoration:underline}
        .lg-magic-hint{font-size:12px;color:#444440;line-height:1.6;margin-top:0.5rem;text-align:center}
      `}</style>

      <nav className="lg-nav">
        <Link href="/" className="lg-logo">Scoopd</Link>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '13px' }}>
          <Link href="/how-it-works" style={{ color: '#8a8a80', textDecoration: 'none' }}>How it works</Link>
          <Link href="/signup" style={{ color: '#c9a96e', textDecoration: 'none' }}>Sign up</Link>
        </div>
      </nav>

      <div className="lg-wrap">
        <div className="lg-card">
          <div className="lg-eyebrow">Members</div>
          <h1 className="lg-headline">Welcome back.</h1>
          <p className="lg-sub">Sign in to access your drop dates.</p>

          <div className="lg-tabs">
            <button
              type="button"
              className="lg-tab"
              style={mode === 'password'
                ? { background: '#1a1a16', color: '#e8e4dc', border: '0.5px solid #2a2a26' }
                : { background: 'transparent', color: '#8a8a80', border: 'none' }}
              onClick={() => { setMode('password'); setStatus('idle'); setErrorMsg('') }}
            >
              Password
            </button>
            <button
              type="button"
              className="lg-tab"
              style={mode === 'magic'
                ? { background: '#1a1a16', color: '#e8e4dc', border: '0.5px solid #2a2a26' }
                : { background: 'transparent', color: '#8a8a80', border: 'none' }}
              onClick={() => { setMode('magic'); setStatus('idle'); setErrorMsg('') }}
            >
              Magic link
            </button>
          </div>

          {status === 'error' && (
            <div className="lg-error">{errorMsg || 'Something went wrong. Please try again.'}</div>
          )}

          {status === 'success' && mode === 'magic' && (
            <div className="lg-success">
              Check your inbox — we sent a sign-in link to <strong>{email}</strong>.
            </div>
          )}

          {mode === 'password' && status !== 'success' && (
            <form onSubmit={handlePasswordLogin}>
              <label className="lg-label">Email</label>
              <input
                className="lg-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <label className="lg-label">Password</label>
              <input
                className="lg-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button className="lg-btn" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          )}

          {mode === 'magic' && status !== 'success' && (
            <form onSubmit={handleMagicLink}>
              <label className="lg-label">Email</label>
              <input
                className="lg-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <button className="lg-btn" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending link...' : 'Send magic link'}
              </button>
              <p className="lg-magic-hint">We will email you a one-click sign-in link. No password needed.</p>
            </form>
          )}

          <hr className="lg-divider" />

          <p className="lg-footer">
            No account?{' '}
            <Link href="/register">Create one</Link>
            {mode === 'password' && (
              <> &nbsp;·&nbsp; <Link href="/forgot-password">Forgot password?</Link></>
            )}
          </p>
        </div>
      </div>
      <ScoopFooter />
    </main>
  )
}

export default function Login() {
  return <Suspense><LoginForm /></Suspense>
}
