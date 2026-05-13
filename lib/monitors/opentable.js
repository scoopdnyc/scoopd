import { createClient } from '@supabase/supabase-js'

const OT_GQL_URL = 'https://www.opentable.com/dapi/fe/gql?optype=query&opname=RestaurantsAvailability'
const OT_QUERY_HASH = 'cbcf4838a9b399f742e3741785df64560a826d8d3cc2828aa01ab09a8455e29e'

const OT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://www.opentable.com',
  'Referer': 'https://www.opentable.com/',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
}

// Returns today's date as YYYY-MM-DD in ET
function todayET() {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  return formatDate(d)
}

// Returns a date offset from today by `days`, as YYYY-MM-DD in ET
function offsetDateET(days) {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

function formatDate(d) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Call the OpenTable persisted GraphQL query for a specific restaurant and date.
// Returns the list of available slots (type "Standard") or null on error.
async function fetchAvailability(restaurantId, date) {
  const body = JSON.stringify({
    operationName: 'RestaurantsAvailability',
    variables: {
      restaurantIds: [restaurantId],
      date,
      startTime: '18:00',
      partySize: 2,
      databaseRegion: 'NA',
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: OT_QUERY_HASH,
      },
    },
  })

  let res
  try {
    res = await fetch(OT_GQL_URL, { method: 'POST', headers: OT_HEADERS, body })
  } catch (err) {
    throw new Error(`fetch_error: ${err.message}`)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const snippet = text.slice(0, 120).replace(/\s+/g, ' ')
    throw new Error(`http_${res.status}: ${snippet}`)
  }

  const json = await res.json()

  // Navigate response — OpenTable returns nested data under various shapes.
  // We look for an array of slots and filter for type "Standard".
  const restaurants = json?.data?.availability ?? json?.data?.restaurants ?? []
  const restaurant = Array.isArray(restaurants) ? restaurants[0] : restaurants

  // Slots may live at .availableSlots, .slots, or .availability.timeslots
  const slots =
    restaurant?.availableSlots ??
    restaurant?.slots ??
    restaurant?.availability?.timeslots ??
    restaurant?.availability?.slots ??
    []

  const standardSlots = (Array.isArray(slots) ? slots : []).filter(s => {
    const type = (s?.slotType ?? s?.type ?? s?.availabilityType ?? '').toLowerCase()
    return type === 'standard' || type === ''
  })

  return { slots: standardSlots, raw: json }
}

/**
 * Checks an OpenTable restaurant's booking window against its stored observed_days.
 * Probe logic:
 *   beyond date (today + observed_days)         — flag if ANY Standard slot available
 *   before date (today + observed_days - 2)     — flag if completely empty (no slots)
 * Writes one row to monitor_log regardless of flag status.
 */
export async function checkOpenTable(restaurant) {
  const { slug, restaurant: name, opentable_restaurant_id, observed_days } = restaurant

  if (!opentable_restaurant_id) {
    return { flagged: false, api_verified_days: null, expected_days: observed_days, flag_reason: 'no opentable_restaurant_id' }
  }

  if (observed_days == null) {
    return { flagged: false, api_verified_days: null, expected_days: null, flag_reason: 'no observed_days' }
  }

  const beyondDate = offsetDateET(observed_days)        // one past the expected window
  const beforeDate = offsetDateET(observed_days - 2)    // one before the expected last day

  let flagged = false
  let flagReason = null
  let apiVerifiedDays = observed_days
  let rawValue = null

  try {
    const [beyondResult, beforeResult] = await Promise.all([
      fetchAvailability(opentable_restaurant_id, beyondDate),
      fetchAvailability(opentable_restaurant_id, beforeDate),
    ])

    const beyondHasSlots = beyondResult.slots.length > 0
    const beforeIsEmpty = beforeResult.slots.length === 0

    if (beyondHasSlots) {
      // Window extends further than expected
      flagged = true
      apiVerifiedDays = observed_days + 1  // conservative — at least one day wider
      flagReason = `beyond_date_has_availability date=${beyondDate} slots=${beyondResult.slots.length}`
    } else if (beforeIsEmpty) {
      // Window may be shorter than expected
      flagged = true
      apiVerifiedDays = observed_days - 2  // conservative estimate
      flagReason = `before_date_empty date=${beforeDate} observed=${observed_days}`
    }

    rawValue = JSON.stringify({
      beyond: { date: beyondDate, slotCount: beyondResult.slots.length },
      before: { date: beforeDate, slotCount: beforeResult.slots.length },
    })
  } catch (err) {
    const reason = err.message
    console.error(`[ot-monitor] ${name}: ${reason}`)

    await writeMonitorLog(slug, observed_days, null, reason, null).catch(() => {})
    return { flagged: false, api_verified_days: null, expected_days: observed_days, flag_reason: reason }
  }

  await writeMonitorLog(slug, observed_days, apiVerifiedDays, flagReason, rawValue).catch(err => {
    console.error(`[ot-monitor] ${name}: monitor_log write failed — ${err.message}`)
  })

  return {
    flagged,
    api_verified_days: apiVerifiedDays,
    expected_days: observed_days,
    flag_reason: flagReason,
  }
}

async function writeMonitorLog(slug, storedDays, apiDays, flagReason, rawValue) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  await supabase.from('monitor_log').insert({
    restaurant_slug: slug,
    source: 'opentable',
    field: 'observed_days',
    old_value: storedDays != null ? String(storedDays) : null,
    new_value: apiDays != null ? String(apiDays) : null,
    flag_reason: flagReason ?? null,
    raw_value: rawValue ?? null,
  })
}
