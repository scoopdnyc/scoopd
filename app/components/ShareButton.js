'use client'
import { useState } from 'react'
import './ShareButton.css'

export default function ShareButton({ restaurantName, platform, releaseTime, observedDays, slug }) {
  const [copied, setCopied] = useState(false)

  const shareTitle = `${restaurantName} — Scoopd`
  const shareText = platform && releaseTime && observedDays
    ? `${restaurantName} releases reservations on ${platform} at ${releaseTime}, ${observedDays} days out.`
    : `${restaurantName} — reservation intelligence on Scoopd.`
  const shareUrl = `https://scoopd.nyc/restaurant/${slug}`

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl })
      } catch {
        // user dismissed, do nothing
      }
      return
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable, do nothing
    }
  }

  return (
    <button className="sh-btn" onClick={handleShare} aria-label="Share this restaurant">
      {copied ? null : (
        <svg className="sh-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )}
      <span className={copied ? 'sh-label copied' : 'sh-label'}>{copied ? 'Copied!' : 'Share'}</span>
    </button>
  )
}
