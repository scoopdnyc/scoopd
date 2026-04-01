'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      await fetch('https://script.google.com/macros/s/AKfycbxftfY_nFOq59pOpWBkkSYuQTc5tUjZ8u5pQkXJ_SG03DB1PT7_Ny7DXhU46Q_mae2l/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main style={{background:'#0f0f0d',minHeight:'100vh',color:'#e8e4dc',fontFamily:"'DM Sans', sans-serif"}}>
      <style>{`
        .su-nav{display:flex;justify-content:space-between;align-items:center;padding:1.25rem 2rem;border-bottom:0.5px solid #2a2a26}
        .su-logo{font-family:'Playfair Display',serif;font-size:22px;color:#e8e4dc;text-decoration:none}
        .su-wrap{display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 64px);padding:2rem}
        .su-card{background:#1a1a16;border:0.5px solid #2a2a26;border-radius:12px;padding:3rem 2.5rem;max-width:520px;width:100%;text-align:center}
        .su-eyebrow{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;margin-bottom:1rem}
        .su-headline{font-family:'Playfair Display',serif;font-size:36px;line-height:1.15;color:#e8e4dc;margin-bottom:1rem}
        .su-sub{font-size:15px;color:#8a8a80;line-height:1.7;margin-bottom:2rem}
        .su-perks{text-align:left;margin-bottom:2rem}
        .su-perk{display:flex;align-items:flex-start;gap:0.75rem;margin-bottom:0.75rem;font-size:14px;color:#8a8a80;line-height:1.5}
        .su-perk-dot{width:5px;height:5px;border-radius:50%;background:#c9a96e;margin-top:6px;flex-shrink:0}
        .su-input-wrap{display:flex;gap:0.75rem;margin-bottom:1rem}
        .su-email-input{flex:1;background:#0f0f0d;border:0.5px solid #2a2a26;border-radius:8px;padding:0.875rem 1rem;color:#e8e4dc;font-family:'DM Sans',sans-serif;font-size:14px;outline:none}
        .su-email-input::placeholder{color:#444440}
        .su-email-input:focus{border-color:#c9a96e}
        .su-submit-btn{background:#c9a96e;color:#0f0f0d;border:none;border-radius:8px;padding:0.875rem 1.5rem;font-size:14px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap;transition:opacity 0.15s}
        .su-submit-btn:hover{opacity:0.9}
        .su-submit-btn:disabled{opacity:0.5;cursor:not-allowed}
        .su-success{background:#0f1a16;border:0.5px solid #1f3a2a;border-radius:8px;padding:1rem 1.25rem;font-size:14px;color:#6ec9a0;margin-bottom:1rem}
        .su-error{background:#1a0f0f;border:0.5px solid #3a1f1f;border-radius:8px;padding:1rem 1.25rem;font-size:14px;color:#c96e6e;margin-bottom:1rem}
        .su-privacy{font-size:12px;color:#444440;line-height:1.6}
        @media(max-width:480px){.su-input-wrap{flex-direction:column}.su-submit-btn{width:100%}}
      `}</style>

      <nav className="su-nav">
        <Link href="/" className="su-logo">Scoopd</Link>
        <div style={{display:'flex',gap:'1.5rem',fontSize:'13px'}}>
          <Link href="/how-it-works" style={{color:'#8a8a80',textDecoration:'none'}}>How it works</Link>
          <Link href="/signup" style={{color:'#c9a96e',textDecoration:'none'}}>Sign up</Link>
        </div>
      </nav>

      <div className="su-wrap">
        <div className="su-card">
          <div className="su-eyebrow">Early Access</div>
          <h1 className="su-headline">Be first<br />at the table.</h1>
          <p className="su-sub">Scoopd is launching soon. Join the waitlist and be first to know when exact drop dates, real-time alerts, and the full platform go live.</p>

          <div className="su-perks">
            <div className="su-perk"><div className="su-perk-dot"></div><span>Exact calculated drop dates — no math, no guessing</span></div>
            <div className="su-perk"><div className="su-perk-dot"></div><span>Real-time alerts when your target restaurants open</span></div>
            <div className="su-perk"><div className="su-perk-dot"></div><span>Coverage across Resy, OpenTable, DoorDash, and more</span></div>
            <div className="su-perk"><div className="su-perk-dot"></div><span>Plan by date — see what drops for the night you want to go out</span></div>
          </div>

          {status === 'success' && (
            <div className="su-success">You are on the list. We will be in touch when we launch.</div>
          )}

          {status === 'error' && (
            <div className="su-error">Something went wrong. Try again or email us directly.</div>
          )}

          {status !== 'success' && (
            <form onSubmit={handleSubmit}>
              <div className="su-input-wrap">
                <input
                  className="su-email-input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button
                  className="su-submit-btn"
                  type="submit"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Joining...' : 'Join waitlist'}
                </button>
              </div>
            </form>
          )}

          <p className="su-privacy">No spam. Just the launch announcement when we are ready.</p>
        </div>
      </div>
    </main>
  )
}