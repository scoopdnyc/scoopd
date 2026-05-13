import { createClient } from '@supabase/supabase-js'

const OT_GQL_URL = 'https://www.opentable.com/dapi/fe/gql?optype=query&opname=RestaurantsAvailability'
const OT_QUERY_HASH = 'cbcf4838a9b399f742e3741785df64560a826d8d3cc2828aa01ab09a8455e29e'

// Aska (334675) and Yingtao (1295479) offer experience-only reservations on OpenTable.
// The monitor will detect this automatically and log skip:experience_only.
// No meaningful window data until they offer Standard reservations.

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

function offsetDateET(days) {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  d.setDate(d.getDate() + days)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Call the OpenTable persisted GraphQL query for a specific restaurant and date.
// Returns rich availability metadata to support skip-logic in the caller.
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
      persistedQuery: { version: 1, sha256Hash: OT_QUERY_HASH },
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

  // Navigate response — OpenTable nests data under various shapes.
  const restaurants = json?.data?.availability ?? json?.data?.restaurants ?? []
  const restaurant = Array.isArray(restaurants) ? restaurants[0] : restaurants

  const allSlots = Array.isArray(
    restaurant?.availableSlots ??
    restaurant?.slots ??
    restaurant?.availability?.timeslots ??
    restaurant?.availability?.slots
  )
    ? (restaurant?.availableSlots ?? restaurant?.slots ?? restaurant?.availability?.timeslots ?? restaurant?.availability?.slots)
    : []

  const noTimesReasons = Array.isArray(
    restaurant?.noTimesReasons ??
    restaurant?.availability?.noTimesReasons
  )
    ? (restaurant?.noTimesReasons ?? restaurant?.availability?.noTimesReasons)
    : []

  const standardSlots = allSlots.filter(s => {
    const type = (s?.slotType ?? s?.type ?? s?.availabilityType ?? '').toLowerCase()
    return type === 'standard' || type === ''
  })

  const blocked = noTimesReasons.some(r =>
    typeof r === 'string'
      ? r.toLowerCase().includes('blocked')
      : String(r?.reason ?? r ?? '').toLowerCase().includes('blocked')
  )

  // NoTimesExist = the date is in the booking window but fully booked (not outside it).
  const fullyBooked = noTimesReasons.some(r =>
    typeof r === 'string'
      ? r === 'NoTimesExist'
      : (r?.reason ?? r) === 'NoTimesExist'
  )

  // Experience-only = slots returned but none are Standard type.
  const experienceOnly = allSlots.length > 0 && standardSlots.length === 0

  return { standardSlots, allSlots, noTimesReasons, blocked, fullyBooked, experienceOnly, raw: json }
}

/**
 * Checks an OpenTable restaurant's booking window against its stored observed_days.
 *
 * Probe dates:
 *   beyondDate = today + observed_days       (should have no Standard slots)
 *   beforeDate = today + observed_days - 2   (should have slots or be fully booked)
 *
 * Skip conditions (no flag, log reason):
 *   - Either probe returns BlockedAvailability → log skip:blocked_availability
 *   - Both probes return experience-only slots → log skip:experience_only
 *
 * Flag conditions:
 *   - beyondDate has Standard slots → window wider than expected
 *   - beforeDate is empty AND not fullyBooked → window shorter than expected
 *
 * Writes one row to monitor_log regardless.
 */
export async function checkOpenTable(restaurant) {
  const { slug, restaurant: name, opentable_restaurant_id, observed_days } = restaurant

  if (!opentable_restaurant_id) {
    return { flagged: false, api_verified_days: null, expected_days: observed_days, flag_reason: 'no opentable_restaurant_id' }
  }

  if (observed_days == null) {
    return { flagged: false, api_verified_days: null, expected_days: null, flag_reason: 'no observed_days' }
  }

  const beyondDate = offsetDateET(observed_days)      // one past the expected window
  const beforeDate = offsetDateET(observed_days - 2)  // one before the expected last day

  let flagged = false
  let flagReason = null
  let apiVerifiedDays = observed_days
  let rawValue = null

  try {
    const [beyondResult, beforeResult] = await Promise.all([
      fetchAvailability(opentable_restaurant_id, beyondDate),
      fetchAvailability(opentable_restaurant_id, beforeDate),
    ])

    rawValue = JSON.stringify({
      beyond: {
        date: beyondDate,
        standardSlots: beyondResult.standardSlots.length,
        allSlots: beyondResult.allSlots.length,
        noTimesReasons: beyondResult.noTimesReasons,
      },
      before: {
        date: beforeDate,
        standardSlots: beforeResult.standardSlots.length,
        allSlots: beforeResult.allSlots.length,
        noTimesReasons: beforeResult.noTimesReasons,
      },
    })

    // BlockedAvailability on either probe → skip this restaurant
    if (beyondResult.blocked || beforeResult.blocked) {
      flagReason = 'skip:blocked_availability'
      await writeMonitorLog(slug, observed_days, null, flagReason, rawValue).catch(() => {})
      return { flagged: false, api_verified_days: null, expected_days: observed_days, flag_reason: flagReason }
    }

    // Experience-only on both probes → skip (restaurant uses Experiences, not Standard reservations)
    if (beyondResult.experienceOnly && beforeResult.experienceOnly) {
      flagReason = 'skip:experience_only'
      await writeMonitorLog(slug, observed_days, null, flagReason, rawValue).catch(() => {})
      return { flagged: false, api_verified_days: null, expected_days: observed_days, flag_reason: flagReason }
    }

    const beyondHasStandardSlots = beyondResult.standardSlots.length > 0
    // beforeIsEmpty only flags if not simply fully booked (NoTimesExist = in-window but sold out)
    const beforeIsEmpty = beyondResult.standardSlots.length === 0 &&
      beforeResult.standardSlots.length === 0 &&
      !beforeResult.fullyBooked

    if (beyondHasStandardSlots) {
      flagged = true
      apiVerifiedDays = observed_days + 1
      flagReason = `beyond_date_has_availability date=${beyondDate} slots=${beyondResult.standardSlots.length}`
    } else if (beforeIsEmpty) {
      flagged = true
      apiVerifiedDays = observed_days - 2
      flagReason = `before_date_empty date=${beforeDate} observed=${observed_days}`
    }
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
