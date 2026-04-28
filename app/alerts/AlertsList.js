'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function AlertsList({ rows }) {
  const [items, setItems] = useState(rows)

  async function handleRemove(slug) {
    const previous = items
    setItems(items.filter(r => r.slug !== slug))
    try {
      const res = await fetch('/api/alerts/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_slug: slug }),
      })
      if (!res.ok) setItems(previous)
    } catch {
      setItems(previous)
    }
  }

  if (items.length === 0) {
    return (
      <div className="td-card">
        <p className="td-empty">No alerts yet. Find a restaurant and hit the bell.</p>
        <Link href="/" className="td-cta">Browse restaurants</Link>
      </div>
    )
  }

  return (
    <div className="td-card td-list">
      {items.map(r => (
        <div key={r.slug} className="td-row">
          <div className="td-row-main">
            <div className="td-row-meta">
              {r.neighborhood} · {r.platform || 'No platform'}{r.release_time ? ` · ${r.release_time} ET` : ''}
            </div>
            <Link href={`/restaurant/${r.slug}`} className="td-row-name">{r.restaurant}</Link>
            <div className={r.dropDate ? 'td-row-date' : 'td-row-date muted'}>
              {r.dropDate ? `Next drop: ${r.dropDate}` : 'No upcoming drop'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleRemove(r.slug)}
            className="td-remove"
            aria-label={`Remove alert for ${r.restaurant}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}
