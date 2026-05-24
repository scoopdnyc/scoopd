import { createClient } from '@supabase/supabase-js'

const RESEND_API_URL = 'https://api.resend.com/emails'

function classify(row) {
  if (row.flag_reason === 'inventory_available') return 'dd_inventory'
  if (row.raw_value?.includes('0 bookable')) return 'dd_ghost'
  if (row.source === 'opentable' && row.flag_reason) return 'ot_change'
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
  if (type === 'ot_change') {
    return {
      to,
      subject: `📋 OpenTable Change — ${restaurant_slug}`,
      text: [
        `A change was detected for ${restaurant_slug} on OpenTable.`,
        `Field: ${field}`,
        `Old value: ${old_value}`,
        `New value: ${new_value}`,
        `Detected at: ${checked_at}`,
        `Review monitor_log and verify before updating the DB.`,
      ].join('\n'),
    }
  }
  return null
}

export async function notifyMonitorFlags() {
  const apiKey = process.env.RESEND_API_KEY
  const notifyEmail = process.env.NOTIFY_EMAIL

  if (!apiKey) {
    console.error('[notify] RESEND_API_KEY not set')
    return { sent: 0, errors: 0, skipped: 0 }
  }
  if (!notifyEmail) {
    console.error('[notify] NOTIFY_EMAIL not set')
    return { sent: 0, errors: 0, skipped: 0 }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Three targeted queries — avoids scanning all no_inventory rows
  const [
    { data: invRows,   error: e1 },
    { data: ghostRows, error: e2 },
    { data: otRows,    error: e3 },
  ] = await Promise.all([
    supabase.from('monitor_log').select('*').eq('notified', false).eq('flag_reason', 'inventory_available'),
    supabase.from('monitor_log').select('*').eq('notified', false).ilike('raw_value', '%0 bookable%'),
    supabase.from('monitor_log').select('*').eq('notified', false).eq('source', 'opentable').not('flag_reason', 'is', null),
  ])

  if (e1 || e2 || e3) {
    console.error('[notify] query error:', e1?.message ?? e2?.message ?? e3?.message)
    return { sent: 0, errors: 1, skipped: 0 }
  }

  // Dedup by id — a row could theoretically match multiple queries
  const seen = new Set()
  const rows = [...(invRows ?? []), ...(ghostRows ?? []), ...(otRows ?? [])].filter(r => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })

  if (!rows.length) return { sent: 0, errors: 0, skipped: 0 }

  let sent = 0, errors = 0, skipped = 0

  for (const row of rows) {
    const type = classify(row)
    const email = type ? buildEmail(row, type, notifyEmail) : null
    if (!email) { skipped++; continue }

    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: 'noreply@scoopd.nyc', ...email }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[notify] Resend error ${res.status} for row ${row.id}: ${body}`)
      errors++
      continue // do NOT mark notified — retry next run
    }

    const { error: updateErr } = await supabase
      .from('monitor_log')
      .update({ notified: true })
      .eq('id', row.id)

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
