import { createClient } from '@supabase/supabase-js'
import { inngest } from '../inngest'
import { checkLongCalendar } from '../monitors/sevenrooms'

const RESEND_API_URL = 'https://api.resend.com/emails'

// Last day of the month 2 months ahead of today (ET).
// e.g. running May 1 or May 15 → June 30; June 1 or June 15 → July 31.
function expectedEndDate() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  // new Date(y, m, 0) = last day of month m-1 (0-based). Adding 2 to current month
  // gives last day of (current month + 1), i.e. end of next month.
  // May → June 30, June → July 31. JS handles month overflow correctly.
  return new Date(now.getFullYear(), now.getMonth() + 2, 0)
}

// Days from today (ET, midnight) to targetDate (midnight).
function daysFromToday(targetDate) {
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)
  return Math.round((targetDate - today) / 864e5)
}

async function sendNozAlert({ apiVerifiedDays, expectedDays, endDateStr, flagReason }) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[sr-monthly] RESEND_API_KEY not set — skipping email')
    return
  }

  const subject = `Sushi Noz — window changed: expected ${expectedDays} days (ends ${endDateStr}), found ${apiVerifiedDays} days`
  const text = [
    `Sushi Noz booking window change detected.`,
    ``,
    `Expected end date: ${endDateStr} (${expectedDays} days from today)`,
    `Detected api_verified_days: ${apiVerifiedDays}`,
    `Reason: ${flagReason}`,
    ``,
    `Review at https://scoopd.nyc/admin if confirmed.`,
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
        .select('slug, restaurant, sevenrooms_slug, sevenrooms_type')
        .eq('platform', 'DoorDash')
        .eq('sevenrooms_slug', 'sushinoznyc')
        .single()
      if (error) throw new Error(`DB fetch: ${error.message}`)
      return data
    })

    const result = await step.run('check-sushi-noz', async () => {
      const endDate = expectedEndDate()
      const expectedDays = daysFromToday(endDate)
      const endDateStr = endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

      // Inject computed expected days as the scan center (observed_days).
      const syntheticRestaurant = { ...restaurant, observed_days: expectedDays }
      const checkResult = await checkLongCalendar(syntheticRestaurant, { searchRadius: 30 })

      return { ...checkResult, expectedDays, endDateStr }
    })

    // Alert if detected boundary differs from expected end by more than 3 days.
    const diff = result.api_verified_days != null
      ? Math.abs(result.api_verified_days - result.expectedDays)
      : null

    if (diff != null && diff > 3) {
      await step.run('send-alert', () => sendNozAlert({
        apiVerifiedDays: result.api_verified_days,
        expectedDays: result.expectedDays,
        endDateStr: result.endDateStr,
        flagReason: result.flag_reason,
      }))
    }

    return {
      flagged: diff != null && diff > 3,
      api_verified_days: result.api_verified_days,
      expected_days: result.expectedDays,
      expected_end_date: result.endDateStr,
      flag_reason: result.flag_reason,
    }
  }
)
