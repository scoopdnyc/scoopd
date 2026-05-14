#!/usr/bin/env node
/**
 * Standalone OpenTable availability monitor.
 * Runs directly on GitHub Actions runners to bypass Akamai IP blocking on Vercel.
 * Env vars required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[ot-check] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

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

function offsetDateET(days) {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  d.setDate(d.getDate() + days)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

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
    restaurant?.noTimesReasons ?? restaurant?.availability?.noTimesReasons
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

  const fullyBooked = noTimesReasons.some(r =>
    typeof r === 'string'
      ? r === 'NoTimesExist'
      : (r?.reason ?? r) === 'NoTimesExist'
  )

  const experienceOnly = allSlots.length > 0 && standardSlots.length === 0

  return { standardSlots, allSlots, noTimesReasons, blocked, fullyBooked, experienceOnly, raw: json }
}

async function checkRestaurant(supabase, restaurant) {
  const { slug, restaurant: name, opentable_restaurant_id, observed_days } = restaurant

  const beyondDate = offsetDateET(observed_days)
  const beforeDate = offsetDateET(observed_days - 2)

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
      beyond: { date: beyondDate, standardSlots: beyondResult.standardSlots.length, allSlots: beyondResult.allSlots.length, noTimesReasons: beyondResult.noTimesReasons },
      before: { date: beforeDate, standardSlots: beforeResult.standardSlots.length, allSlots: beforeResult.allSlots.length, noTimesReasons: beforeResult.noTimesReasons },
    })

    if (beyondResult.blocked || beforeResult.blocked) {
      flagReason = 'skip:blocked_availability'
      await writeLog(supabase, slug, observed_days, null, flagReason, rawValue)
      return { flagged: false, slug, name, flag_reason: flagReason }
    }

    if (beyondResult.experienceOnly && beforeResult.experienceOnly) {
      flagReason = 'skip:experience_only'
      await writeLog(supabase, slug, observed_days, null, flagReason, rawValue)
      return { flagged: false, slug, name, flag_reason: flagReason }
    }

    const beyondHasStandardSlots = beyondResult.standardSlots.length > 0
    const beforeIsEmpty =
      beyondResult.standardSlots.length === 0 &&
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
    console.error(`[ot-check] ${name}: ${reason}`)
    await writeLog(supabase, slug, observed_days, null, reason, null)
    return { flagged: false, slug, name, flag_reason: reason }
  }

  await writeLog(supabase, slug, observed_days, apiVerifiedDays, flagReason, rawValue)
  return { flagged, slug, name, api_verified_days: apiVerifiedDays, expected_days: observed_days, flag_reason: flagReason }
}

async function writeLog(supabase, slug, storedDays, apiDays, flagReason, rawValue) {
  const { error } = await supabase.from('monitor_log').insert({
    restaurant_slug: slug,
    source: 'opentable',
    field: 'observed_days',
    old_value: storedDays != null ? String(storedDays) : null,
    new_value: apiDays != null ? String(apiDays) : null,
    flag_reason: flagReason ?? null,
    raw_value: rawValue ?? null,
  })
  if (error) console.error(`[ot-check] monitor_log write failed for ${slug}: ${error.message}`)
}

async function sendDigest(findings) {
  if (!RESEND_API_KEY) {
    console.warn('[ot-check] RESEND_API_KEY not set — skipping digest email')
    return
  }

  const rows = findings.map(({ name, slug, api_verified_days, expected_days, flag_reason }) =>
    `${name} (${slug})\n  • observed: ${api_verified_days} days | expected: ${expected_days} days | reason: ${flag_reason}`
  ).join('\n\n')

  const text = [
    `Scoopd OpenTable monitor — ${new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    `${findings.length} restaurant${findings.length === 1 ? '' : 's'} with detected changes:`,
    '',
    rows,
    '',
    'Review and update the DB at https://scoopd.nyc/admin if these changes are confirmed.',
  ].join('\n')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@scoopd.nyc',
      to: 'support@scoopd.nyc',
      subject: `[Scoopd Monitor] OpenTable: ${findings.length} change${findings.length === 1 ? '' : 's'} detected`,
      text,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`[ot-check] Resend error ${res.status}: ${body}`)
  }
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('slug, restaurant, platform, observed_days, opentable_restaurant_id')
    .or('platform.ilike.%OpenTable%,platform.ilike.%opentable%')
    .not('opentable_restaurant_id', 'is', null)
    .not('observed_days', 'is', null)

  if (error) {
    console.error(`[ot-check] DB fetch failed: ${error.message}`)
    process.exit(1)
  }

  console.log(`[ot-check] Checking ${restaurants.length} restaurants`)

  const findings = []
  for (const restaurant of restaurants) {
    const result = await checkRestaurant(supabase, restaurant)
    console.log(`[ot-check] ${restaurant.restaurant}: flagged=${result.flagged} reason=${result.flag_reason ?? 'none'}`)
    if (result.flagged) findings.push(result)
  }

  console.log(`[ot-check] Done. ${restaurants.length} checked, ${findings.length} flagged.`)

  if (findings.length > 0) {
    await sendDigest(findings)
  }
}

main().catch(err => {
  console.error('[ot-check] Fatal:', err)
  process.exit(1)
})
