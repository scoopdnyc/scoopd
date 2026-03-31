'use client'

import { useState } from 'react'
import Link from 'next/link'

const styles = `
  .search-wrap { padding: 1.5rem 2rem; }
  .search-box { background: #1a1a16; border: 0.5px solid #2a2a26; border-radius: 8px; padding: 0.75rem 1rem; display: flex; gap: 1rem; align-items: center; max-width: 700px; }
  .search-box input { background: none; border: none; color: #e8e4dc; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; flex: 1; }
  .search-box input::placeholder { color: #6b6b60; }
  .filters { display: flex; gap: 0.5rem; padding: 0 2rem 1.5rem; flex-wrap: wrap; }
  .filter-btn { font-size: 12px; padding: 5px 14px; border-radius: 20px; border: 0.5px solid #2a2a26; color: #6b6b60; background: transparent; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .filter-btn.active { border-color: #c9a96e; color: #c9a96e; }
  .section-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 2px; color: #a8a49c; text-transform: uppercase; padding: 0 2rem 1rem; }
  .restaurant-list { padding: 0 2rem; }
  .card { background: #1a1a16; border: 0.5px solid #2a2a26; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 0.5rem; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 1rem; text-decoration: none; color: inherit; transition: border-color 0.15s; }
  .card:hover { border-color: #3a3a32; }
  .restaurant-name { font-size: 15px; font-weight: 500; color: #e8e4dc; margin-bottom: 3px; }
  .restaurant-meta { font-size: 12px; color: #8a8a80; }
  .card-right { text-align: right; }
  .release-time { font-family: 'DM Mono', monospace; font-size: 13px; color: #c9a96e; }
  .days-out { font-size: 11px; color: #a8a49c; margin-top: 2px; }
  .badge { display: inline-block; font-size: 10px; padding: 2px 7px; border-radius: 4px; margin-left: 6px; font-family: 'DM Mono', monospace; }
  .badge-vh { background: #2a0f0f; color: #c96e6e; }
  .badge-h { background: #2a1f0f; color: #c9a96e; }
  .badge-m { background: #1a1a16; color: #6b6b60; border: 0.5px solid #2a2a26; }
  .upsell { margin: 2rem; background: #1a1a16; border: 0.5px solid #2a2a26; border-left: 2px solid #c9a96e; border-radius: 8px; padding: 1rem 1.25rem; font-size: 13px; color: #8a8a80; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
  .upsell-cta { color: #c9a96e; font-weight: 500; white-space: nowrap; text-decoration: none; }
  .closed-badge { display: inline-block; font-size: 10px; padding: 2px 7px; border-radius: 4px; margin-left: 6px; background: #1a1a16; color: #6b6b60; border: 0.5px solid #2a2a26; font-family: 'DM Mono', monospace; }
  .no-results { padding: 2rem; color: #6b6b60; font-size: 14px; }
`

const FILTERS = ['All', 'West Village', 'Williamsburg', 'Lower East Side', 'Omakase', 'Italian']

export default function RestaurantList({ restaurants }) {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = restaurants.filter(r => {
    if (!r.slug) return false
    const searchStr = `${r.restaurant} ${r.neighborhood} ${r.cuisine} ${r.platform}`.toLowerCase()
    const matchesQuery = query === '' || searchStr.includes(query.toLowerCase())
    const matchesFilter = activeFilter === 'All' || searchStr.includes(activeFilter.toLowerCase())
    return matchesQuery && matchesFilter
  })

  return (
    <>
      <style>{styles}</style>

      <div className="search-wrap">
        <div className="search-box">
          <span style={{color: '#6b6b60', fontSize: '16px'}}>⌕</span>
          <input
            placeholder="Search restaurants, neighborhoods, cuisine..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="filters">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-btn${activeFilter === f ? ' active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="section-label">
        {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''}
      </div>

      <div className="restaurant-list">
        {filtered.length === 0 && (
          <div className="no-results">No restaurants found.</div>
        )}
        {filtered.map(r => {
          const badgeClass = r.difficulty === 'Very Hard' ? 'badge badge-vh' : r.difficulty === 'Hard' ? 'badge badge-h' : 'badge badge-m'
          const isClosed = r.platform === 'CLOSED'
          return (
            <Link key={r.id} href={`/restaurant/${r.slug}`} className="card">
              <div>
                <div className="restaurant-name">
                  {r.restaurant}
                  {isClosed
                    ? <span className="closed-badge">Closed</span>
                    : r.difficulty && <span className={badgeClass}>{r.difficulty}</span>
                  }
                </div>
                <div className="restaurant-meta">
                  {[r.neighborhood, r.cuisine, r.platform].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="card-right">
                <div className="release-time">{r.release_time || '—'}</div>
                <div className="days-out">
                  {r.stated_days_out ? `${r.stated_days_out} days out*` : r.platform === 'Walk-in' ? 'Walk-in only' : '—'}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="upsell">
        <span>* Release windows vary by platform — we do the math for you.</span>
        <Link href="/signup" className="upsell-cta">Unlock exact drop dates →</Link>
      </div>
    </>
  )
}