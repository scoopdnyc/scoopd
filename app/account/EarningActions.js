'use client'

import { useState } from 'react'

export default function EarningActions({ referralLink, socialFollowed, streak, streakRewardFired }) {
  const [followed, setFollowed] = useState(socialFollowed)
  const [copied, setCopied] = useState(false)

  function copyRef() {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSocialClick() {
    if (followed) return
    fetch('/api/actions/track', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_type: 'social_follow' }),
    }).catch(() => {})
    setFollowed(true)
  }

  const streakDone = streak >= 7

  return (
    <div className="ac-card">
      <div className="ac-card-label">Earn more free days</div>

      {/* Refer a friend */}
      <div className="ac-action-row">
        <div style={{ flex: 1 }}>
          <div className="ac-action-name">Refer a friend (+14 days on conversion)</div>
          {referralLink && (
            <div className="ac-ref-row" style={{ marginTop: '0.5rem' }}>
              <code className="ac-ref-code">{referralLink}</code>
              <button onClick={copyRef} className="ac-copy-btn">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>
        <span className="ac-action-status-available" style={{ alignSelf: 'flex-start', marginLeft: '1rem' }}>AVAILABLE</span>
      </div>

      {/* Follow on social */}
      <div className="ac-action-row">
        <div style={{ flex: 1 }}>
          <div className="ac-action-name">Follow on social</div>
          {!followed && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <a
                href="https://instagram.com/scoopdnyc"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleSocialClick}
                className="ac-social-link"
              >Instagram →</a>
              <a
                href="https://x.com/scoopdnyc"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleSocialClick}
                className="ac-social-link"
              >X →</a>
            </div>
          )}
        </div>
        <span className={followed ? 'ac-action-status-done' : 'ac-action-status-available'} style={{ alignSelf: 'flex-start', marginLeft: '1rem' }}>
          {followed ? 'DONE' : 'AVAILABLE'}
        </span>
      </div>

      {/* 7-day login streak */}
      <div className="ac-action-row">
        <div style={{ flex: 1 }}>
          <div className="ac-action-name">7-day login streak (+14 days)</div>
          <div style={{ fontSize: '12px', color: '#6b6b60', marginTop: '0.35rem', fontFamily: "'DM Mono', monospace", letterSpacing: '0.5px' }}>
            {streakDone ? 'Streak complete' : `${streak} of 7 days`}
          </div>
        </div>
        <span className={streakDone ? 'ac-action-status-done' : 'ac-action-status-available'} style={{ alignSelf: 'flex-start', marginLeft: '1rem' }}>
          {streakDone ? 'DONE' : 'AVAILABLE'}
        </span>
      </div>
    </div>
  )
}
