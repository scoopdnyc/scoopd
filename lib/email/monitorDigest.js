const RESEND_API_URL = 'https://api.resend.com/emails'

/**
 * Sends a monitor digest email to the operator summarising all detected
 * discrepancies from the nightly Resy check.
 *
 * @param {Array<{slug: string, name: string, changes: Array<{field: string, stored: string, observed: string}>}>} findings
 * @returns {Promise<void>}
 */
export async function sendMonitorDigest(findings) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[monitor-digest] RESEND_API_KEY not set — skipping email')
    return
  }

  if (findings.length === 0) return

  const rows = findings
    .map(({ slug, name, changes }) => {
      const changeLines = changes
        .map(c => `  • ${c.field}: stored="${c.stored}" → observed="${c.observed}"`)
        .join('\n')
      return `${name} (${slug})\n${changeLines}`
    })
    .join('\n\n')

  const text = [
    `Scoopd nightly Resy monitor — ${new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    `${findings.length} restaurant${findings.length === 1 ? '' : 's'} with detected changes:`,
    '',
    rows,
    '',
    'Review and update the DB at https://scoopd.nyc/admin if these changes are confirmed.',
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
      subject: `[Scoopd Monitor] ${findings.length} change${findings.length === 1 ? '' : 's'} detected`,
      text,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`[monitor-digest] Resend error ${res.status}: ${body}`)
  }
}
