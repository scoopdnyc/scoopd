'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { computeNextDropDate } from '../../lib/dropDate'

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

const DIFF_COLOR = {
  'Extremely Hard': '#a855f7',
  'Very Hard': '#c96e6e',
  'Hard': '#e38f09',
  'Medium': '#c9b882',
  'Easy': '#6ec9a0',
}

const TEASER_NAMES = ['Adda', 'Double Chicken Please', 'Coqodaq']
const GHOST_ROW_COUNT = 5

// Difficulty buckets by days until target date
const GHOST_DIFFICULTIES = {
  short:  ['Extremely Hard', 'Extremely Hard', 'Very Hard', 'Very Hard', 'Hard'],       // 0–14 days
  medium: ['Extremely Hard', 'Extremely Hard', 'Very Hard', 'Very Hard', 'Very Hard'],  // 15–30 days
  long:   ['Extremely Hard', 'Extremely Hard', 'Very Hard', 'Hard', 'Hard'],            // 31+ days
}

const GHOST_DIFF_COLORS = {
  'Extremely Hard': '#a855f7',
  'Very Hard': '#c96e6e',
  'Hard': '#e38f09',
}

// Seeded shuffle — same date always yields same order
function seededShuffle(arr, seed) {
  const result = [...arr]
  let s = seed
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(s) % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function getGhostDifficulties(daysUntil) {
  const bucketIndex = daysUntil <= 14 ? 0 : daysUntil <= 30 ? 1 : 2
  const bucketKey   = ['short', 'medium', 'long'][bucketIndex]
  return { difficulties: seededShuffle(GHOST_DIFFICULTIES[bucketKey], bucketIndex), bucketIndex }
}

const BLUR5 = { filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }
const BLUR4 = { filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none' }

const GHOST_NAMES  = ['Bistrot Ha', 'Claud', 'Peasant', 'Don Angie', 'Via Carota', 'Red Hook Tavern', 'Double Chicken Please', 'Saint Julivert Fisherie']
const GHOST_HOODS  = ['West Village', 'Lower East Side', 'Williamsburg', 'Flatiron', 'NoHo']
const GHOST_PLATFS = ['Resy', 'OpenTable', 'DoorDash']
const GHOST_TIMES  = ['12:00 AM', '9:00 AM', '10:00 AM', '12:00 PM']

// Pick from an array using (seed + offset) so each row gets a different value
// and different dates rotate the starting point
function seedPick(arr, seed, offset) {
  return arr[Math.abs(seed + offset * 31) % arr.length]
}

function GhostRow({ difficulty, seed, index }) {
  const diffColor = GHOST_DIFF_COLORS[difficulty] ?? '#8a8a80'
  const name  = seedPick(GHOST_NAMES,  seed, index)
  const hood  = seedPick(GHOST_HOODS,  seed, index + 3)
  const platf = seedPick(GHOST_PLATFS, seed, index + 7)
  const time  = seedPick(GHOST_TIMES,  seed, index + 13)
  return (
    <tr className="pb-row pb-ghost-row">
      <td className="pb-td pb-td-restaurant">
        <span className="pb-restaurant-link" style={BLUR5}>{name}</span>
      </td>
      <td className="pb-td pb-td-hood">
        <span style={BLUR4}>{hood}</span>
      </td>
      <td className="pb-td pb-td-platform">
        <span style={BLUR4}>{platf}</span>
      </td>
      <td className="pb-td pb-td-time">
        <span className="pb-time-mono" style={BLUR4}>{time}</span>
      </td>
      <td className="pb-td pb-td-diff">
        <span className="pb-diff-badge" style={{ color: diffColor, ...BLUR4 }}>{difficulty}</span>
      </td>
      <td className="pb-td pb-td-drop">
        <span className="pb-drop-locked">
          <span className="pb-drop-blurred" aria-hidden="true">Wednesday, April 16</span>
          <span className="pb-lock-icon">🔒</span>
        </span>
      </td>
    </tr>
  )
}

function formatDateStr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function RestaurantRow({ r }) {
  const diffColor = DIFF_COLOR[r.difficulty] ?? '#8a8a80'
  return (
    <tr className="pb-row">
      <td className="pb-td pb-td-restaurant">
        <Link href={`/restaurant/${r.slug}`} className="pb-restaurant-link">
          {r.restaurant}
        </Link>
      </td>
      <td className="pb-td pb-td-hood">{r.neighborhood || '—'}</td>
      <td className="pb-td pb-td-platform">{r.platform || '—'}</td>
      <td className="pb-td pb-td-time">
        <span className="pb-time-mono">{r.release_time || '—'}</span>
      </td>
      <td className="pb-td pb-td-diff">
        <span className="pb-diff-badge" style={{ color: diffColor }}>
          {r.difficulty || '—'}
        </span>
      </td>
      <td className="pb-td pb-td-drop">
        {r.dropDateStr ? (
          <span className="pb-drop-date">
            <span className="pb-date-long">{r.dropDateStr}</span>
            <span className="pb-date-short">{r.dropDateStrShort}</span>
          </span>
        ) : (
          <span className="pb-drop-locked">
            <span className="pb-drop-blurred" aria-hidden="true">Wednesday, April 16</span>
            <span className="pb-lock-icon">🔒</span>
          </span>
        )}
      </td>
    </tr>
  )
}

export default function PlanClient({
  restaurants,
  isPremium,
  defaultDate,
  minDate,
  etYear,
  etMonth,
  etDay,
  currentETMinutes,
}) {
  const [dateStr, setDateStr] = useState(defaultDate)

  const { results, targetDisplay } = useMemo(() => {
    if (!dateStr) return { results: null, targetDisplay: null }

    const [ty, tm, td] = dateStr.split('-').map(Number)
    const targetDate = new Date(ty, tm - 1, td)
    const targetDisplay = formatDateStr(dateStr)

    const list = []
    for (const r of restaurants) {
      const { dateET: windowReaches } = computeNextDropDate(r)
      if (!windowReaches) continue

      // Already bookable for target date — exclude
      if (windowReaches >= targetDate) continue

      // The calendar day the booking window first reaches the target date
      const dropFiresOn = new Date(targetDate)
      dropFiresOn.setDate(dropFiresOn.getDate() - r.observed_days + 1)

      const dropDateStr = dropFiresOn.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      })
      const dropDateStrShort = dropFiresOn.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      })

      list.push({ ...r, dropFiresOn, dropDateStr, dropDateStrShort })
    }

    // Premium: sort by drop date ascending, then by release_time ascending within same date.
    if (isPremium) {
      list.sort((a, b) => {
        const dateDiff = a.dropFiresOn.getTime() - b.dropFiresOn.getTime()
        if (dateDiff !== 0) return dateDiff
        return (parseReleaseMinutes(a.release_time) ?? 0) - (parseReleaseMinutes(b.release_time) ?? 0)
      })
    }

    return { results: list, targetDisplay }
  }, [dateStr, restaurants, isPremium, etYear, etMonth, etDay, currentETMinutes])

  // Free-user teaser: the 3 hardcoded restaurants that appear in filtered results
  const { teaserRows, hiddenCount, ghostDifficulties, bucketIndex } = useMemo(() => {
    if (isPremium || !results) return { teaserRows: [], hiddenCount: 0, ghostDifficulties: [], bucketIndex: 0 }
    const teaserRows = TEASER_NAMES
      .map(name => results.find(r => r.restaurant === name))
      .filter(Boolean)
    const hiddenCount = results.length - teaserRows.length

    // Days between today (ET) and selected date for difficulty bucket
    const [ty, tm, td] = dateStr.split('-').map(Number)
    const targetDate = new Date(ty, tm - 1, td)
    const todayET = new Date(etYear, etMonth, etDay)
    const daysUntil = Math.round((targetDate - todayET) / 86400000)
    const { difficulties: ghostDifficulties, bucketIndex } = getGhostDifficulties(daysUntil)
    return { teaserRows, hiddenCount, ghostDifficulties, bucketIndex }
  }, [isPremium, results, dateStr, etYear, etMonth, etDay])

  const tableHeaders = (
    <tr>
      <th className="pb-th pb-th-restaurant">Restaurant</th>
      <th className="pb-th pb-th-hood">Neighborhood</th>
      <th className="pb-th pb-th-platform">Platform</th>
      <th className="pb-th pb-th-time">Drop Time <span className="pb-th-tz">ET</span></th>
      <th className="pb-th pb-th-diff">Difficulty</th>
      <th className="pb-th pb-th-drop">Drop Date</th>
    </tr>
  )

  return (
    <div>
      <div className="pb-header">
        <div className="pb-eyebrow">Plan by Date</div>
        <h1 className="pb-headline">When can I book?</h1>
        <p className="pb-sub">
          Enter a target dinner date. We&apos;ll show every restaurant whose reservation window hasn&apos;t reached it yet — and exactly when the drop fires.
        </p>

        <div className="pb-date-row">
          <label htmlFor="pb-date" className="pb-date-label">Target dinner date</label>
          <input
            id="pb-date"
            type="date"
            className="pb-date-input"
            value={dateStr}
            min={minDate}
            onChange={e => setDateStr(e.target.value)}
          />
          <button
            type="button"
            className="pb-reset-btn"
            onClick={() => {
              const t = new Date()
              t.setDate(t.getDate() + 14)
              const y = t.getFullYear()
              const m = String(t.getMonth() + 1).padStart(2, '0')
              const d = String(t.getDate()).padStart(2, '0')
              setDateStr(`${y}-${m}-${d}`)
            }}
            title="Reset to 2 weeks from today"
          >↺</button>
        </div>
      </div>

      {!dateStr ? (
        <div className="pb-empty">Select a target dinner date above to see which drops are still ahead of you.</div>
      ) : results && results.length === 0 ? (
        <div className="pb-empty">
          All tracked restaurants can already be booked for {targetDisplay}. Try a date further out.
        </div>
      ) : results ? (
        isPremium ? (
          <>
            <div className="pb-table-wrap">
              <table className="pb-table">
                <thead>{tableHeaders}</thead>
                <tbody>
                  {results.map((r, i) => (
                    <RestaurantRow key={r.slug || i} r={r} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pb-footer-note">
              {results.length} restaurant{results.length !== 1 ? 's' : ''} still have a drop ahead for {targetDisplay}.
            </div>
          </>
        ) : (
          <>
            <div className="pb-table-wrap">
              <table className="pb-table">
                <thead>{tableHeaders}</thead>
                <tbody>
                  {teaserRows.map((r, i) => (
                    <RestaurantRow key={r.slug || i} r={{ ...r, dropDateStr: null }} />
                  ))}
                  {Array.from({ length: GHOST_ROW_COUNT }, (_, i) => (
                    <GhostRow key={`ghost-${i}`} difficulty={ghostDifficulties[i]} seed={bucketIndex} index={i} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pb-locked-banner">
              <div className="pb-locked-left">
                <span className="pb-locked-count">{hiddenCount} more restaurant{hiddenCount !== 1 ? 's' : ''}</span>
                <span className="pb-locked-text"> drop for this date — unlock to see all of them and exactly when.</span>
              </div>
              <Link href="/signup" className="pb-locked-cta">Get access →</Link>
            </div>
          </>
        )
      ) : null}
    </div>
  )
}
