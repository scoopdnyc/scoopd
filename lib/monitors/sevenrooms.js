import { createClient } from '@supabase/supabase-js'

const SR_BASE = 'https://fp.sevenrooms.com/api-yoa'

const SR_HEADERS = {
  Accept: 'application/json',
  Origin: 'https://www.sevenrooms.com',
  Referer: 'https://www.sevenrooms.com/',
}

// Returns today's date as MM-DD-YYYY in ET
function todayET() {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  return formatDate(d)
}

// Returns a date offset from today by `days`, as MM-DD-YYYY
function offsetDate(days) {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

function formatDate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}-${dd}-${d.getFullYear()}`
}

async function srFetch(url) {
  const res = await fetch(url, { headers: SR_HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ---

async function checkRolling(restaurant) {
  const { slug, restaurant: name, sevenrooms_slug, observed_days } = restaurant

  if (observed_days == null) {
    return { flagged: false, api_verified_days: null, expected_days: null, flag_reason: 'no observed_days' }
  }

  const expectedLastDate = offsetDate(observed_days - 1)
  const beyondDate = offsetDate(observed_days + 3)

  // Probe 1: expected last date — should have slots
  let probe1Slots
  try {
    const json1 = await srFetch(
      `${SR_BASE}/availability/ng/widget/range?venue=${sevenrooms_slug}&party_size=2&halo_size_interval=100&start_date=${expectedLastDate}&num_days=1&channel=SEVENROOMS_WIDGET&exclude_pdr=true`
    )
    probe1Slots = extractSlots(json1)
  } catch (err) {
    console.error(`[sr-monitor] ${name}: probe1 fetch failed — ${err.message}`)
    return { flagged: false, api_verified_days: null, expected_days: observed_days, flag_reason: `fetch_error: ${err.message}` }
  }

  if (probe1Slots.length === 0) {
    const flagReason = `no_slots_at_expected_end date=${expectedLastDate}`
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      await supabase.from('monitor_log').insert({
        restaurant_slug: slug,
        source: 'sevenrooms',
        field: 'booking_window',
        old_value: String(observed_days),
        new_value: null,
        raw_value: flagReason,
      })
    } catch (err) {
      console.error(`[sr-monitor] ${name}: monitor_log write failed — ${err.message}`)
    }
    return { flagged: true, api_verified_days: null, expected_days: observed_days, flag_reason: flagReason }
  }

  // 300ms delay between probes
  await new Promise(r => setTimeout(r, 300))

  // Probe 2: beyond expected window — should have no confirmed bookable slots
  let probe2Slots
  try {
    const json2 = await srFetch(
      `${SR_BASE}/availability/ng/widget/range?venue=${sevenrooms_slug}&party_size=2&halo_size_interval=100&start_date=${beyondDate}&num_days=1&channel=SEVENROOMS_WIDGET&exclude_pdr=true`
    )
    probe2Slots = extractSlots(json2)
  } catch (err) {
    console.error(`[sr-monitor] ${name}: probe2 fetch failed — ${err.message}`)
    return { flagged: false, api_verified_days: null, expected_days: observed_days, flag_reason: `fetch_error: ${err.message}` }
  }

  // Only flag if type:"book" AND access_persistent_id is non-null — ignore request slots
  const bookableSlots = probe2Slots.filter(s => s.type === 'book' && s.access_persistent_id != null)

  if (bookableSlots.length > 0) {
    const flagReason = `slots_found_beyond_window date=${beyondDate} count=${bookableSlots.length}`
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      await supabase.from('monitor_log').insert({
        restaurant_slug: slug,
        source: 'sevenrooms',
        field: 'booking_window',
        old_value: String(observed_days),
        new_value: null,
        raw_value: flagReason,
      })
    } catch (err) {
      console.error(`[sr-monitor] ${name}: monitor_log write failed — ${err.message}`)
    }
    return { flagged: true, api_verified_days: null, expected_days: observed_days, flag_reason: flagReason }
  }

  // Clean — write log
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    await supabase.from('monitor_log').insert({
      restaurant_slug: slug,
      source: 'sevenrooms',
      field: 'booking_window',
      old_value: String(observed_days),
      new_value: String(observed_days),
      raw_value: `probe1=${probe1Slots.length} slots probe2=${probe2Slots.length} slots (${bookableSlots.length} bookable)`,
    })
  } catch (err) {
    console.error(`[sr-monitor] ${name}: monitor_log write failed — ${err.message}`)
  }

  return { flagged: false, api_verified_days: null, expected_days: observed_days, flag_reason: null }
}

export async function checkLongCalendar(restaurant, { searchRadius = 7 } = {}) {
  const { slug, restaurant: name, sevenrooms_slug, observed_days } = restaurant

  if (observed_days == null) {
    return { flagged: false, api_verified_days: null, expected_days: null, flag_reason: 'no observed_days' }
  }

  // Scan from (observed_days - searchRadius) to (observed_days + searchRadius) days out.
  // Track the highest offset that has a confirmed bookable slot (type:"book" + access_persistent_id).
  let lastBookableOffset = null

  const startOffset = observed_days - searchRadius
  const endOffset = observed_days + searchRadius

  for (let offset = startOffset; offset <= endOffset; offset++) {
    const date = offsetDate(offset)
    let slots
    try {
      const json = await srFetch(
        `${SR_BASE}/availability/ng/widget/range?venue=${sevenrooms_slug}&party_size=2&halo_size_interval=100&start_date=${date}&num_days=1&channel=SEVENROOMS_WIDGET&exclude_pdr=true`
      )
      slots = extractTimeSlots(json)
    } catch (err) {
      console.error(`[sr-monitor] ${name}: fetch failed at offset=${offset} — ${err.message}`)
      await new Promise(r => setTimeout(r, 300))
      continue
    }

    const hasBookable = slots.some(s => s.type === 'book' && s.access_persistent_id != null)
    if (hasBookable) lastBookableOffset = offset

    await new Promise(r => setTimeout(r, 300))
  }

  // api_verified_days: last bookable offset + 1 (offset 0 = today = day 1)
  const apiVerifiedDays = lastBookableOffset != null ? lastBookableOffset + 1 : null
  const diff = apiVerifiedDays != null ? apiVerifiedDays - observed_days : null
  const flagged = diff != null && Math.abs(diff) > 1
  const flagReason = flagged
    ? `api=${apiVerifiedDays} stored=${observed_days} diff=${diff > 0 ? '+' : ''}${diff}`
    : lastBookableOffset == null
    ? 'no_bookable_slots_found_in_range'
    : null

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    await supabase.from('monitor_log').insert({
      restaurant_slug: slug,
      source: 'sevenrooms',
      field: 'booking_window',
      old_value: String(observed_days),
      new_value: apiVerifiedDays != null ? String(apiVerifiedDays) : null,
      raw_value: flagReason ?? `clean api=${apiVerifiedDays} stored=${observed_days}`,
    })
  } catch (err) {
    console.error(`[sr-monitor] ${name}: monitor_log write failed — ${err.message}`)
  }

  return { flagged: flagged || lastBookableOffset == null, api_verified_days: apiVerifiedDays, expected_days: observed_days, flag_reason: flagReason }
}

async function checkHybrid(restaurant) {
  const { sevenrooms_slug, observed_days, restaurant: name } = restaurant
  const checkDate = offsetDate((observed_days ?? 0) + 5)

  let json
  try {
    json = await srFetch(
      `${SR_BASE}/availability/ng/widget/range?venue=${sevenrooms_slug}&party_size=2&halo_size_interval=100&start_date=${checkDate}&num_days=1&channel=SEVENROOMS_WIDGET&exclude_pdr=true`
    )
  } catch (err) {
    console.error(`[sr-monitor] ${name}: fetch failed — ${err.message}`)
    return []
  }

  const slots = extractSlots(json)
  const bookCount = slots.filter(s => s.type === 'book').length
  const requestCount = slots.filter(s => s.type === 'request').length
  const total = slots.length

  const changes = []

  // Always log the ratio — flagged: false means write to monitor_log but omit from digest
  changes.push({
    field: 'book_request_ratio',
    stored: null,
    observed: `${bookCount}/${total} (${requestCount} request)`,
    flagged: false,
  })

  // Only flag (and digest) if bookable slots appeared beyond the expected window
  if (bookCount > 0) {
    changes.push({
      field: 'booking_window',
      stored: 'closed_beyond_observed',
      observed: `bookable_slot_found_at_${checkDate}`,
    })
  }

  return changes
}

// Normalise the range endpoint response — returns shift objects (may be nested by date)
function extractSlots(json) {
  const data = json?.data
  if (!data) return []
  // Response may be { availability: [...] } or { availability: { [date]: [...] } }
  const avail = data.availability
  if (!avail) return []
  if (Array.isArray(avail)) return avail
  // Object keyed by date
  return Object.values(avail).flat()
}

// Flatten individual time slots from within each shift's .times array.
// type, access_persistent_id etc. live on time slots, not on the shift object itself.
function extractTimeSlots(json) {
  const shifts = extractSlots(json)
  return shifts.flatMap(shift => shift.times ?? [])
}

/**
 * Checks a single SevenRooms restaurant against the live API.
 *
 * rolling: self-contained — writes monitor_log internally, returns [].
 * long_calendar: self-contained — caller should use checkLongCalendar directly, returns [].
 * hybrid: returns an array of change objects { field, stored, observed, flagged? }.
 *   flagged: false → write to monitor_log but omit from digest email.
 *
 * @param {Object} restaurant - Row from restaurants table
 */
export async function checkSevenRoomsRestaurant(restaurant) {
  switch (restaurant.sevenrooms_type) {
    case 'rolling':
      await checkRolling(restaurant)
      return []
    case 'long_calendar':
      // Self-contained: caller invokes checkLongCalendar directly.
      await checkLongCalendar(restaurant)
      return []
    case 'hybrid':
      return checkHybrid(restaurant)
    default:
      console.warn(`[sr-monitor] Unknown sevenrooms_type: ${restaurant.sevenrooms_type}`)
      return []
  }
}
