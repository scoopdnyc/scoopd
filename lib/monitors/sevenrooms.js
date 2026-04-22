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

// Days between two MM-DD-YYYY strings
function daysBetween(a, b) {
  const parse = s => {
    const [mm, dd, yyyy] = s.split('-').map(Number)
    return new Date(yyyy, mm - 1, dd)
  }
  return Math.round((parse(b) - parse(a)) / 864e5)
}

async function srFetch(url) {
  const res = await fetch(url, { headers: SR_HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ---

async function checkRolling(restaurant) {
  const { sevenrooms_slug, observed_days, restaurant: name } = restaurant
  const startDate = todayET()

  let json
  try {
    json = await srFetch(
      `${SR_BASE}/availability/ng/widget/dates?venue=${sevenrooms_slug}&start_date=${startDate}&num_days=14`
    )
  } catch (err) {
    console.error(`[sr-monitor] ${name}: fetch failed — ${err.message}`)
    return []
  }

  const validDates = json?.data?.valid_dates || []
  if (validDates.length === 0) {
    return [{
      field: 'observed_days',
      stored: String(observed_days ?? 'null'),
      observed: '0 (no dates returned)',
    }]
  }

  const lastDate = validDates[validDates.length - 1]
  const apiVerifiedDays = daysBetween(startDate, lastDate)

  if (observed_days != null && Math.abs(apiVerifiedDays - observed_days) > 1) {
    return [{
      field: 'observed_days',
      stored: String(observed_days),
      observed: String(apiVerifiedDays),
    }]
  }

  return []
}

async function checkLongCalendar(restaurant) {
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
  const bookableSlots = slots.filter(s => s.type === 'book')

  if (bookableSlots.length > 0) {
    return [{
      field: 'booking_window',
      stored: 'closed_beyond_observed',
      observed: `bookable_slot_found_at_${checkDate}`,
    }]
  }

  return []
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

// Normalise the range endpoint response — slots may be nested by date
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

/**
 * Checks a single SevenRooms restaurant against the live API.
 * Returns an array of change objects. Empty array = no discrepancies.
 * Each object: { field, stored, observed, flagged? }
 *   flagged: false → write to monitor_log but omit from digest email
 *
 * @param {Object} restaurant - Row from restaurants table
 */
export async function checkSevenRoomsRestaurant(restaurant) {
  switch (restaurant.sevenrooms_type) {
    case 'rolling':
      return checkRolling(restaurant)
    case 'long_calendar':
      return checkLongCalendar(restaurant)
    case 'hybrid':
      return checkHybrid(restaurant)
    default:
      console.warn(`[sr-monitor] Unknown sevenrooms_type: ${restaurant.sevenrooms_type}`)
      return []
  }
}
