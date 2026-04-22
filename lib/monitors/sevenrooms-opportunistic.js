const SR_BASE = 'https://fp.sevenrooms.com/api-yoa'
const RESEND_API_URL = 'https://api.resend.com/emails'

const SR_HEADERS = {
  Accept: 'application/json',
  Origin: 'https://www.sevenrooms.com',
  Referer: 'https://www.sevenrooms.com/',
}

function todayET() {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}-${dd}-${d.getFullYear()}`
}

async function sendImmediateAlert(slot) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[sr-opportunistic] RESEND_API_KEY not set — skipping alert')
    return
  }

  const now = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
  const text = [
    `Bookable slot detected at Corner Store.`,
    ``,
    `Time: ${slot.time ?? slot.start_time ?? 'unknown'}`,
    `access_persistent_id: ${slot.access_persistent_id}`,
    `Detected at: ${now} ET`,
    ``,
    `Book at: https://www.sevenrooms.com/explore/corner-store/reservations/create/search`,
  ].join('\n')

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@scoopd.nyc',
      to: 'support@scoopd.nyc',
      subject: `Corner Store — bookable slot detected [${slot.time ?? slot.start_time ?? 'unknown time'}]`,
      text,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`[sr-opportunistic] Resend error ${res.status}: ${body}`)
  }
}

/**
 * Checks Corner Store for bookable slots right now.
 * Sends an immediate Resend alert if any slot has type "book" with
 * a non-null access_persistent_id.
 * Always writes to monitor_log regardless of result.
 *
 * @param {Object} supabase - Supabase client instance
 * @returns {Promise<{ found: boolean, slotCount: number }>}
 */
export async function checkCornerStoreOpportunistic(supabase) {
  const startDate = todayET()
  const url = `${SR_BASE}/availability/ng/widget/range?venue=corner-store&party_size=2&halo_size_interval=100&start_date=${startDate}&num_days=1&channel=SEVENROOMS_WIDGET&exclude_pdr=true`

  let slots = []
  let fetchError = null

  try {
    const res = await fetch(url, { headers: SR_HEADERS })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const avail = json?.data?.availability
    if (Array.isArray(avail)) {
      slots = avail
    } else if (avail && typeof avail === 'object') {
      slots = Object.values(avail).flat()
    }
  } catch (err) {
    fetchError = err.message
    console.error(`[sr-opportunistic] Corner Store fetch failed — ${err.message}`)
  }

  const bookableSlots = slots.filter(
    s => s.type === 'book' && s.access_persistent_id != null
  )
  const found = bookableSlots.length > 0

  // Always write to monitor_log
  const logRow = {
    restaurant_slug: 'corner-store',
    source: 'sevenrooms_opportunistic',
    field: 'bookable_slot',
    old_value: 'none',
    new_value: fetchError
      ? `fetch_error: ${fetchError}`
      : found
        ? `${bookableSlots.length} bookable slot(s) found`
        : 'no bookable slots',
  }
  await supabase.from('monitor_log').insert([logRow])

  // Alert fires immediately for each bookable slot found
  for (const slot of bookableSlots) {
    await sendImmediateAlert(slot)
  }

  return { found, slotCount: bookableSlots.length }
}
