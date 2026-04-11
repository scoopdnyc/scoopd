import { createSupabaseServer } from '../../lib/supabase-server'
import Link from 'next/link'
import ScoopNav from '../components/ScoopNav'
import ScoopFooter from '../components/ScoopFooter'
import './drops.css'

export const metadata = {
  title: 'What Drops Today | Scoopd',
  description: 'Every NYC restaurant reservation drop, sorted by release time. Know exactly what becomes bookable today.',
}

function parseReleaseMinutes(release_time) {
  if (!release_time) return null
  const match = release_time.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
  if (!match) return null
  let h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  const meridiem = match[3].toUpperCase()
  if (meridiem === 'AM' && h === 12) h = 0
  else if (meridiem === 'PM' && h !== 12) h += 12
  return h * 60 + m
}

function computeDropDate(r, etYear, etMonth, etDay, currentETMinutes) {
  const releaseMinutes = parseReleaseMinutes(r.release_time)
  const base = new Date(etYear, etMonth, etDay)
  // If today's drop has already fired, the next one is tomorrow
  if (releaseMinutes !== null && currentETMinutes >= releaseMinutes) {
    base.setDate(base.getDate() + 1)
  }
  // Opens for = base date + observed_days - 1
  base.setDate(base.getDate() + r.observed_days - 1)
  return base.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const DIFF_COLOR = {
  'Extremely Hard': '#a855f7',
  'Very Hard': '#c96e6e',
  'Hard': '#e38f09',
  'Medium': '#c9b882',
  'Easy': '#6ec9a0',
}

export default async function DropsPage() {
  const serverSupabase = await createSupabaseServer()

  const [{ data: restaurants }, { data: { user } }] = await Promise.all([
    serverSupabase
      .from('restaurants')
      .select('restaurant, slug, neighborhood, platform, release_time, observed_days, difficulty')
      .neq('platform', 'CLOSED')
      .neq('platform', 'Walk-in')
      .neq('platform', 'Phone')
      .neq('platform', 'Phone/Relationships')
      .not('observed_days', 'is', null)
      .not('release_time', 'is', null)
      .neq('release_time', '—'),
    serverSupabase.auth.getUser(),
  ])

  let isPremium = false
  if (user) {
    const { data: sub } = await serverSupabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single()
    isPremium = sub?.status === 'active'
  }

  // Current ET time
  const now = new Date()
  const etTimeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const etHour = parseInt(etTimeParts.find(p => p.type === 'hour').value, 10)
  const etMinute = parseInt(etTimeParts.find(p => p.type === 'minute').value, 10)
  const currentETMinutes = etHour * 60 + etMinute

  // Current ET calendar date (for drop date calculation)
  const etDateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const etYear  = parseInt(etDateParts.find(p => p.type === 'year').value, 10)
  const etMonth = parseInt(etDateParts.find(p => p.type === 'month').value, 10) - 1
  const etDay   = parseInt(etDateParts.find(p => p.type === 'day').value, 10)

  // Today's display date for the header
  const todayDisplay = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now)

  // Sort: next upcoming drop first; restaurants whose drop already fired today sort after (their next drop is tomorrow)
  const sorted = [...(restaurants || [])].sort((a, b) => {
    const aMin = parseReleaseMinutes(a.release_time) ?? 0
    const bMin = parseReleaseMinutes(b.release_time) ?? 0
    const aPassed = aMin < currentETMinutes
    const bPassed = bMin < currentETMinutes
    if (aPassed !== bPassed) return aPassed ? 1 : -1
    return aMin - bMin
  })

  // Assign urgency buckets based on distinct release times in rolling order:
  // bucket 1 (opacity 1.0)  — index 0 (next up)
  // bucket 2 (opacity 0.80) — index 1-2
  // bucket 3 (opacity 0.65) — index 3-4
  // bucket 4 (opacity 0.50) — index 5-6
  // bucket 5 (opacity 0.35) — index 7+
  const seenTimes = new Set()
  const orderedTimes = []
  for (const r of sorted) {
    const t = r.release_time ?? ''
    if (!seenTimes.has(t)) {
      seenTimes.add(t)
      orderedTimes.push(t)
    }
  }
  const timeBucket = {}
  orderedTimes.forEach((t, i) => {
    timeBucket[t] = i === 0 ? 1 : i <= 2 ? 2 : i <= 4 ? 3 : i <= 6 ? 4 : 5
  })

  return (
    <main style={{ background: '#0f0f0d', minHeight: '100vh', color: '#e8e4dc', fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <ScoopNav />

      <div className="dr-header">
        <div className="dr-eyebrow">Daily Drop Schedule</div>
        <h1 className="dr-headline">What Drops Today</h1>
        <div className="dr-date">{todayDisplay}</div>
      </div>

      {!isPremium && (
        <div className="dr-upsell-banner">
          <span className="dr-upsell-text">Unlock the exact date each drop opens for. Know what to target before everyone else.</span>
          <Link href="/signup" className="dr-upsell-cta">Get access →</Link>
        </div>
      )}

      <div className="dr-table-wrap">
        <table className="dr-table">
          <thead>
            <tr>
              <th className="dr-th dr-th-restaurant">Restaurant</th>
              <th className="dr-th dr-th-hood">Neighborhood</th>
              <th className="dr-th dr-th-platform">Platform</th>
              <th className="dr-th dr-th-time">Drop Time <span className="dr-th-tz">ET</span></th>
              <th className="dr-th dr-th-diff">Difficulty</th>
              <th className="dr-th dr-th-opens">Opens For</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const dropDate = computeDropDate(r, etYear, etMonth, etDay, currentETMinutes)
              const diffColor = DIFF_COLOR[r.difficulty] ?? '#8a8a80'
              const bucket = timeBucket[r.release_time ?? ''] ?? 4

              return (
                <tr key={r.slug || i} className={`dr-row dr-bucket-${bucket}`}>
                  <td className="dr-td dr-td-restaurant">
                    <Link href={`/restaurant/${r.slug}`} className="dr-restaurant-link">
                      {r.restaurant}
                    </Link>
                  </td>
                  <td className="dr-td dr-td-hood">{r.neighborhood || '—'}</td>
                  <td className="dr-td dr-td-platform">{r.platform || '—'}</td>
                  <td className="dr-td dr-td-time">
                    <span className="dr-time-mono">{r.release_time || '—'}</span>
                  </td>
                  <td className="dr-td dr-td-diff">
                    <span className="dr-diff-badge" style={{ color: diffColor }}>
                      {r.difficulty || '—'}
                    </span>
                  </td>
                  <td className="dr-td dr-td-opens">
                    {isPremium ? (
                      <span className="dr-opens-date">{dropDate}</span>
                    ) : (
                      <span className="dr-opens-locked">
                        <span className="dr-opens-blurred" aria-hidden="true">Wednesday, April 16</span>
                        <span className="dr-lock-icon">🔒</span>
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="dr-footer-note">
        Drop times are in Eastern Time. Always shows the next upcoming drop — rolls forward automatically.
      </div>
      <ScoopFooter />
    </main>
  )
}
