import { createClient } from '@supabase/supabase-js'
import { inngest } from '../inngest'
import { checkOpenTable } from '../monitors/opentable'
import { sendMonitorDigest } from '../email/monitorDigest'

export const opentableDailyCheck = inngest.createFunction(
  // 5 PM UTC = 1 PM ET — same window as resy-daily-check
  { id: 'opentable-daily-check', triggers: [{ cron: '0 17 * * *' }] },
  async ({ step }) => {
    // --- Step 1: Fetch all active OpenTable restaurants ---
    const restaurants = await step.run('fetch-opentable-restaurants', async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      const { data, error } = await supabase
        .from('restaurants')
        .select('slug, restaurant, platform, observed_days, opentable_restaurant_id')
        .or('platform.ilike.%OpenTable%,platform.ilike.%opentable%')
        .not('opentable_restaurant_id', 'is', null)
        .not('observed_days', 'is', null)
      if (error) throw new Error(`DB fetch failed: ${error.message}`)
      return data || []
    })

    // --- Step 2: Check each restaurant against the OpenTable API ---
    const findings = await step.run('check-all-restaurants', async () => {
      const results = []

      for (const restaurant of restaurants) {
        const result = await checkOpenTable(restaurant)

        if (result.flagged) {
          results.push({
            slug: restaurant.slug,
            name: restaurant.restaurant,
            api_verified_days: result.api_verified_days,
            expected_days: result.expected_days,
            flag_reason: result.flag_reason,
          })
        }
      }

      return results
    })

    // --- Step 3: Send digest email if anything flagged ---
    if (findings.length > 0) {
      await step.run('send-digest', () => sendMonitorDigest(findings))
    }

    return {
      checked: restaurants.length,
      flagged: findings.length,
    }
  }
)
