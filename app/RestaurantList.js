'use client'
import { useState } from 'react'
import Link from 'next/link'

const FILTERS = ['All', 'West Village', 'Williamsburg', 'Lower East Side', 'Omakase', 'Italian']
const BADGE_DIFFICULTIES = ['Extremely Hard', 'Very Hard', 'Hard', 'Medium', 'Easy']

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
      <div className="search-wrap">
        <div className="search-box">
          <span style={{color:'#6b6b60',fontSize:'16px'}}>⌕</span>
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
          const badgeClass = r.difficulty === 'Extremely Hard' ? 'badge badge-eh'
            : r.difficulty === 'Very Hard' ? 'badge badge-vh'
            : r.difficulty === 'Hard' ? 'badge badge-h'
            : r.difficulty === 'Medium' ? 'badge badge-m'
            : r.difficulty === 'Easy' ? 'badge badge-e'
            : null
          const isClosed = r.platform === 'CLOSED'
          const showBadge = !isClosed && badgeClass !== null
          return (
            <Link key={r.id} href={`/restaurant/${r.slug}`} className="card">
              <div>
                <div className="restaurant-name">
                  {r.restaurant}
                  {isClosed
                    ? <span className="closed-badge">Closed</span>
                    : showBadge && <span className={badgeClass}>{r.difficulty}</span>
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