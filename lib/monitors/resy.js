import { createClient } from '@supabase/supabase-js'

const RESY_API_KEY = 'VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5'
// /4/venue/calendar returns inventory as an object { reservation, event, walk-in }
// with values "available", "sold-out", "not available". This is the correct endpoint.
// /3/venue/calendar returns flat strings and cannot distinguish event-only dates.
const RESY_CALENDAR_URL = 'https://api.resy.com/4/venue/calendar'

/**
 * Checks a Resy restaurant's booking window against its stored observed_days.
 * Writes one row to monitor_log regardless of flag status.
 *
 * @param {Object} restaurant - Row from the restaurants table
 * @param {string} restaurant.slug
 * @param {string} restaurant.restaurant
 * @param {string|null} restaurant.resy_venue_id
 * @param {string|null} restaurant.resy_slug
 * @param {number|null} restaurant.observed_days
 * @returns {Promise<{ flagged: boolean, api_verified_days: number|null, expected_days: number|null, flag_reason: string|null }>}
 */
export async function checkResyRestaurant(restaurant) {
  const { slug, restaurant: name, resy_venue_id, observed_days } = restaurant

  if (!resy_venue_id) {
    return { flagged: false, api_verified_days: null, expected_days: observed_days, flag_reason: 'no resy_venue_id' }
  }

  const today = new Date().toISOString().split('T')[0]
  const oneYearOut = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  let apiVerifiedDays = null
  let flagReason = null
  let flagged = false
  let effectiveLastDay = null
  let lastDay = null

  try {
    const res = await fetch(
      `${RESY_CALENDAR_URL}?venue_id=${encodeURIComponent(resy_venue_id)}&num_seats=2&start_date=${today}&end_date=${oneYearOut}`,
      {
        headers: {
          'authorization': `ResyAPI api_key="${RESY_API_KEY}"`,
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'en-US,en;q=0.9',
          'cache-control': 'no-cache',
          'origin': 'https://resy.com',
          'referer': 'https://resy.com/',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
          'x-origin': 'https://resy.com',
        },
      }
    )

    if (!res.ok) {
      console.error(`[resy-monitor] ${name}: HTTP ${res.status}`)
      return { flagged: false, api_verified_days: null, expected_days: observed_days, flag_reason: `http_${res.status}` }
    }

    const data = await res.json()
    lastDay = data.last_calendar_day

    if (!lastDay) {
      return { flagged: false, api_verified_days: null, expected_days: observed_days, flag_reason: 'no last_calendar_day in response' }
    }

    // Walk backwards through scheduled to find the last date with actual reservation
    // availability ("available" or "sold-out"). Trailing event-only entries have
    // inventory.reservation = "not available" and must be excluded.
    const scheduled = data.scheduled || []
    for (let i = scheduled.length - 1; i >= 0; i--) {
      const inv = scheduled[i].inventory
      const reservationStatus = typeof inv === 'string' ? inv : inv?.reservation
      if (reservationStatus !== 'not available') {
        effectiveLastDay = scheduled[i].date
        break
      }
    }
    // Fall back to raw last_calendar_day if no bookable date found
    const windowLastDay = effectiveLastDay || lastDay

    // Days from today to effective last day: same day = 0, tomorrow = 1
    const todayMs = new Date(today).getTime()
    apiVerifiedDays = Math.round((new Date(windowLastDay).getTime() - todayMs) / (24 * 60 * 60 * 1000)) + 1

    if (observed_days != null && Math.abs(apiVerifiedDays - observed_days) >= 1) {
      flagged = true
      flagReason = `api=${apiVerifiedDays} stored=${observed_days} diff=${apiVerifiedDays - observed_days}`
    }
  } catch (err) {
    console.error(`[resy-monitor] ${name}: fetch failed — ${err.message}`)
    return { flagged: false, api_verified_days: null, expected_days: observed_days, flag_reason: `fetch_error: ${err.message}` }
  }

  // Write to monitor_log regardless of flag status
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    await supabase.from('monitor_log').insert({
      restaurant_slug: slug,
      source: 'resy',
      field: 'observed_days',
      old_value: observed_days != null ? String(observed_days) : null,
      new_value: apiVerifiedDays != null ? String(apiVerifiedDays) : null,
      raw_value: effectiveLastDay && effectiveLastDay !== lastDay
        ? `event extends calendar from ${effectiveLastDay} to ${lastDay}`
        : null,
    })
  } catch (err) {
    console.error(`[resy-monitor] ${name}: monitor_log write failed — ${err.message}`)
  }

  return {
    flagged,
    api_verified_days: apiVerifiedDays,
    expected_days: observed_days,
    flag_reason: flagReason,
  }
}
