import { createClient } from '@supabase/supabase-js'
import { inngest } from '../inngest'
import { checkLongCalendar } from '../monitors/sevenrooms'

const RESEND_API_URL = 'https://api.resend.com/emails'

async function sendNozAlert(result) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[sr-monthly] RESEND_API_KEY not set — skipping email')
    return
  }

  const subject = `Sushi Noz — window changed: expected ${result.expected_days} days, found ${result.api_verified_days} days`
  const text = [
    `Sushi Noz booking window change detected.`,
    ``,
    `Stored observed_days: ${result.expected_days}`,
    `Detected api_verified_days: ${result.api_verified_days}`,
    `Reason: ${result.flag_reason}`,
    ``,
    `Review and update observed_days at https://scoopd.nyc/admin if confirmed.`,
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
      subject,
      text,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`[sr-monthly] Resend error ${res.status}: ${body}`)
  }
}

export const sevenroomsLongCalMonthlyCheck = inngest.createFunction(
  // 2 PM UTC on the 1st and 15th of each month
  { id: 'sevenrooms-longcal-monthly-check', triggers: [{ cron: '0 14 1,15 * *' }] },
  async ({ step }) => {
    const restaurant = await step.run('fetch-sushi-noz', async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      const { data, error } = await supabase
        .from('restaurants')
        .select('slug, restaurant, sevenrooms_slug, sevenrooms_type, observed_days')
        .eq('platform', 'DoorDash')
        .eq('sevenrooms_slug', 'sushinoznyc')
        .single()
      if (error) throw new Error(`DB fetch: ${error.message}`)
      return data
    })

    const result = await step.run('check-sushi-noz', async () => {
      return checkLongCalendar(restaurant, { searchRadius: 30 })
    })

    // Flag if boundary differs from observed_days by more than 3 days
    const diff = result.api_verified_days != null && result.expected_days != null
      ? Math.abs(result.api_verified_days - result.expected_days)
      : null

    if (diff != null && diff > 3) {
      await step.run('send-alert', () => sendNozAlert(result))
    }

    return {
      flagged: result.flagged,
      api_verified_days: result.api_verified_days,
      expected_days: result.expected_days,
      flag_reason: result.flag_reason,
    }
  }
)
