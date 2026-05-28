import { createClient } from '@supabase/supabase-js'

const RESEND_API_URL = 'https://api.resend.com/emails'
const BATCH_LIMIT = 10

// Rows matching any of these are silently marked notified and skipped
const SUPPRESS = [
  (r) => r.raw_value === 'no_inventory',
  (r) => r.raw_value?.match(/^clean/i),
  (r) => r.raw_value?.match(/^error/i),
  (r) => r.raw_value?.match(/^event extends calendar/i),
  (r) => r.raw_value?.match(/^no_slots_at_expected_end/i),
  (r) => r.raw_value?.match(/^no_bookable_slots/i),
]

function isSuppressed(row) {
  return SUPPRESS.some(fn => fn(row))
}

// Ghost slot: raw_value has '0 bookable' but at least one probe shows non-zero slots
function isGhostSlot(row) {
  if (!row.raw_value?.includes('0 bookable')) return false
  return /probe\d+=([1-9]\d*)/.test(row.raw_value)
}

function classify(row) {
  if (isSuppressed(row)) return 'suppress'
  if (row.source === 'doordash_monitor' && row.flag_reason === 'inventory_available') return 'dd_inventory'
  if (row.source === 'doordash_monitor' && isGhostSlot(row)) return 'dd_ghost'
  if (row.source === 'sevenrooms' && row.raw_value?.includes('diff=')) return 'sr_diff'
  if (row.source === 'opentable' && row.flag_reason?.includes('http_403')) return 'ot_403'
  // Anything with no flag_reason that didn't match the whitelist is not actionable
  return null
}

function buildEmail(row, type, to) {
  const { restaurant_slug, checked_at, raw_value, field, old_value, new_value } = row
  if (type === 'dd_inventory') {
    return {
      to,
      subject: `🟢 DoorDash Inventory — ${restaurant_slug}`,
      text: [
        `Public inventory appeared on DoorDash for ${restaurant_slug}.`,
        `Detected at: ${checked_at}`,
        `Raw value: ${raw_value}`,
        `Check DoorDash now.`,
      ].join('\n'),
    }
  }
  if (type === 'dd_ghost') {
    return {
      to,
      subject: `👀 DoorDash Signal — ${restaurant_slug}`,
      text: [
        `A ghost slot signal was detected for ${restaurant_slug}.`,
        `Detected at: ${checked_at}`,
        `Raw value: ${raw_value}`,
        `May be a precursor to public inventory. Monitor closely.`,
      ].join('\n'),
    }
  }
  if (type === 'sr_diff') {
    return {
      to,
      subject: `📋 SevenRooms Change — ${restaurant_slug}`,
      text: [
        `A days-out change was detected for ${restaurant_slug} on SevenRooms.`,
        `Field: ${field}`,
        `Old value: ${old_value}`,
        `New value: ${new_value}`,
        `Detected at: ${checked_at}`,
        `Raw value: ${raw_value}`,
        `Review monitor_log and verify before updating the DB.`,
      ].join('\n'),
    }
  }
  if (type === 'ot_403') {
    return {
      to,
      subject: `🚫 OpenTable Blocked — ${restaurant_slug}`,
      text: [
        `Akamai blocked the OpenTable monitor for ${restaurant_slug}.`,
        `Flag: ${row.flag_reason}`,
        `Detected at: ${checked_at}`,
        `Check if the runner IP or OT_COOKIES need refreshing.`,
      ].join('\n'),
    }
  }
  return null
}

async function sendOne(apiKey, email) {
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'noreply@scoopd.nyc', ...email }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend ${res.status}: ${body}`)
  }
}

export async function notifyMonitorFlags() {
  const apiKey = process.env.RESEND_API_KEY
  const notifyEmail = process.env.NOTIFY_EMAIL

  if (!apiKey) { console.error('[notify] RESEND_API_KEY not set'); return { sent: 0, errors: 0, skipped: 0 } }
  if (!notifyEmail) { console.error('[notify] NOTIFY_EMAIL not set'); return { sent: 0, errors: 0, skipped: 0 } }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Targeted queries — only fetch rows that could be actionable
  const [
    { data: invRows,   error: e1 },
    { data: ghostRows, error: e2 },
    { data: srRows,    error: e3 },
    { data: otRows,    error: e4 },
    { data: tokenRows, error: e5 },
  ] = await Promise.all([
    supabase.from('monitor_log').select('*').eq('notified', false)
      .eq('source', 'doordash_monitor').eq('flag_reason', 'inventory_available'),
    supabase.from('monitor_log').select('*').eq('notified', false)
      .eq('source', 'doordash_monitor').ilike('raw_value', '%0 bookable%'),
    supabase.from('monitor_log').select('*').eq('notified', false)
      .eq('source', 'sevenrooms').ilike('raw_value', '%diff=%'),
    supabase.from('monitor_log').select('*').eq('notified', false)
      .eq('source', 'opentable').ilike('flag_reason', '%http_403%'),
    supabase.from('monitor_log').select('*').eq('notified', false)
      .eq('source', 'doordash_monitor').eq('flag_reason', 'auth_error'),
  ])

  const queryErr = e1 ?? e2 ?? e3 ?? e4 ?? e5
  if (queryErr) {
    console.error('[notify] query error:', queryErr.message)
    return { sent: 0, errors: 1, skipped: 0 }
  }

  // Dedup by id across the four main buckets (tokenRows handled separately)
  const seen = new Set()
  const candidates = [
    ...(invRows ?? []),
    ...(ghostRows ?? []),
    ...(srRows ?? []),
    ...(otRows ?? []),
  ].filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true })

  let sent = 0, errors = 0, skipped = 0

  // --- 401 token expiry digest (max one per day, batch-marks all rows) ---
  const t401 = tokenRows ?? []
  if (t401.length > 0) {
    const todayUTC = new Date()
    todayUTC.setUTCHours(0, 0, 0, 0)
    const { data: alreadySent } = await supabase.from('monitor_log')
      .select('id').eq('notified', true).eq('source', 'doordash_monitor')
      .eq('flag_reason', 'auth_error').gte('checked_at', todayUTC.toISOString())
      .limit(1)

    const digestAlreadySentToday = alreadySent?.length > 0
    if (!digestAlreadySentToday) {
      try {
        await sendOne(apiKey, {
          to: notifyEmail,
          subject: '⚠️ DD_WEB_TOKEN may have expired',
          text: [
            'DoorDash monitor is returning 401 errors.',
            `Affected rows: ${t401.length}`,
            'DD_WEB_TOKEN may have expired. Check and refresh.',
            'Extract fresh token from Chrome DevTools: Application → Cookies → doordash.com → ddweb_token',
            'Then update the DD_WEB_TOKEN GitHub Actions secret.',
          ].join('\n'),
        })
        sent++
      } catch (err) {
        console.error('[notify] 401 digest send failed:', err.message)
        errors++
      }
    }

    // Mark all 401 rows notified regardless (silence future runs today)
    const ids = t401.map(r => r.id)
    await supabase.from('monitor_log').update({ notified: true }).in('id', ids)
  }

  // --- Main actionable rows, capped at BATCH_LIMIT ---
  const batch = candidates.slice(0, BATCH_LIMIT)

  for (const row of batch) {
    const type = classify(row)

    // Suppressed rows: mark notified silently to prevent reprocessing
    if (type === 'suppress') {
      await supabase.from('monitor_log').update({ notified: true }).eq('id', row.id)
      skipped++
      continue
    }

    if (!type) { skipped++; continue }

    const email = buildEmail(row, type, notifyEmail)
    if (!email) { skipped++; continue }

    try {
      await sendOne(apiKey, email)
    } catch (err) {
      console.error(`[notify] send failed for row ${row.id}: ${err.message}`)
      errors++
      continue // do NOT mark notified — retry next run
    }

    const { error: updateErr } = await supabase
      .from('monitor_log').update({ notified: true }).eq('id', row.id)
    if (updateErr) {
      console.error(`[notify] mark-notified failed for row ${row.id}: ${updateErr.message}`)
      errors++
    } else {
      sent++
    }
  }

  console.log(`[notify] sent=${sent} errors=${errors} skipped=${skipped}`)
  return { sent, errors, skipped }
}
