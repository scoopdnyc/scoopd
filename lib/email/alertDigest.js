const RESEND_API_URL = 'https://api.resend.com/emails'

/**
 * Send a single drop-alert digest email to one user.
 *
 * @param {{ to: string, restaurants: Array<{slug: string, restaurant: string, release_time: string, platform: string, neighborhood: string}> }} params
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function sendAlertDigest({ to, restaurants }) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[alert-digest] RESEND_API_KEY not set, skipping')
    return { ok: false, error: 'no_api_key' }
  }
  if (!restaurants?.length) return { ok: false, error: 'no_restaurants' }

  const names = restaurants.map(r => r.restaurant).join(', ')
  const subject = `🔔 Drops in 5 minutes: ${names}`

  const lines = restaurants.map(r => {
    const url = `https://scoopd.nyc/restaurant/${r.slug}`
    return `${r.restaurant} (${r.neighborhood}) opens at ${r.release_time} ET on ${r.platform}.\n  ${url}`
  })

  const text = [
    'Heads up. The following reservation windows open in about 5 minutes:',
    '',
    ...lines,
    '',
    'Manage your alerts: https://scoopd.nyc/alerts',
  ].join('\n')

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@scoopd.nyc',
      to,
      subject,
      text,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`[alert-digest] Resend error ${res.status}: ${body}`)
    return { ok: false, error: `resend_${res.status}` }
  }
  return { ok: true }
}
