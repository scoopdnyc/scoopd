import { createClient } from '@supabase/supabase-js'
import { inngest } from '../inngest'
import { checkSevenRoomsRestaurant, checkLongCalendar } from '../monitors/sevenrooms'

const RESEND_API_URL = 'https://api.resend.com/emails'

async function sendSevenRoomsDigest(findings) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[sr-daily] RESEND_API_KEY not set — skipping email')
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

  const dateStr = new Date().toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const text = [
    `Scoopd nightly SevenRooms monitor — ${dateStr}`,
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
      subject: `[SevenRooms] ${findings.length} change${findings.length === 1 ? '' : 's'} detected`,
      text,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`[sr-daily] Resend error ${res.status}: ${body}`)
  }
}

export const sevenroomsDailyCheck = inngest.createFunction(
  // 5 PM UTC = 1 PM ET
  { id: 'sevenrooms-daily-check', triggers: [{ cron: '0 17 * * *' }] },
  async ({ step }) => {
    // --- Step 1: Fetch all SevenRooms restaurants ---
    const restaurants = await step.run('fetch-sevenrooms-restaurants', async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      const { data, error } = await supabase
        .from('restaurants')
        .select('slug, restaurant, sevenrooms_slug, sevenrooms_type, observed_days')
        .eq('platform', 'DoorDash')
        .not('sevenrooms_slug', 'is', null)
        .not('sevenrooms_type', 'is', null)
      if (error) throw new Error(`DB fetch failed: ${error.message}`)
      return data || []
    })

    // --- Step 2: Check each restaurant serially ---
    const findings = await step.run('check-all-restaurants', async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      const digestFindings = []

      for (const restaurant of restaurants) {
        const changes = await checkSevenRoomsRestaurant(restaurant)

        if (changes.length > 0) {
          // Write all changes to monitor_log (including logOnly ones)
          const logRows = changes.map(c => ({
            restaurant_slug: restaurant.slug,
            source: 'sevenrooms',
            field: c.field,
            old_value: c.stored,
            new_value: c.observed,
          }))
          await supabase.from('monitor_log').insert(logRows)

          // Only include digest-worthy changes (exclude flagged: false)
          const flaggedChanges = changes.filter(c => c.flagged !== false)
          if (flaggedChanges.length > 0) {
            digestFindings.push({
              slug: restaurant.slug,
              name: restaurant.restaurant,
              changes: flaggedChanges,
            })
          }
        }

        // 300ms between requests to avoid hammering the API
        await new Promise(r => setTimeout(r, 300))
      }

      return digestFindings
    })

    // --- Step 2b: Long calendar check for Marea and Rezdora ---
    const longCalFindings = await step.run('check-long-calendar-restaurants', async () => {
      const longCalRestaurants = restaurants.filter(
        r => r.sevenrooms_type === 'long_calendar' && ['marea', 'rezdora'].includes(r.slug)
      )

      const digestFindings = []

      for (const restaurant of longCalRestaurants) {
        const result = await checkLongCalendar(restaurant)

        if (result.flagged) {
          digestFindings.push({
            slug: restaurant.slug,
            name: restaurant.restaurant,
            changes: [{
              field: 'booking_window',
              stored: result.expected_days != null ? String(result.expected_days) : null,
              observed: result.api_verified_days != null ? String(result.api_verified_days) : 'none',
            }],
          })
        }
      }

      return digestFindings
    })

    const allFindings = [...findings, ...longCalFindings]

    // --- Step 3: Send digest if anything flagged ---
    if (allFindings.length > 0) {
      await step.run('send-digest', () => sendSevenRoomsDigest(allFindings))
    }

    return {
      checked: restaurants.length,
      flagged: allFindings.length,
    }
  }
)
