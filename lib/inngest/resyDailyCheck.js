import { createClient } from '@supabase/supabase-js'
import { inngest } from '../inngest'
import { checkResyRestaurant } from '../monitors/resy'
import { sendMonitorDigest } from '../email/monitorDigest'

export const resyDailyCheck = inngest.createFunction(
  // 5 PM UTC = 1 PM ET (well after morning drop windows have fired)
  { id: 'resy-daily-check', triggers: [{ cron: '0 17 * * *' }] },
  async ({ step }) => {
    // --- Step 1: Fetch all active Resy restaurants from DB ---
    const restaurants = await step.run('fetch-resy-restaurants', async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      const { data, error } = await supabase
        .from('restaurants')
        .select('slug, restaurant, resy_venue_id, resy_slug, release_time, observed_days')
        .in('platform', ['Resy', 'Resy/OpenTable', 'Resy/Tock'])
        .not('slug', 'is', null)
      if (error) throw new Error(`DB fetch failed: ${error.message}`)
      return data || []
    })

    // --- Step 2: Check each restaurant against the Resy API ---
    // Run checks serially to avoid hammering the Resy API
    const findings = await step.run('check-all-restaurants', async () => {
      const results = []

      for (const restaurant of restaurants) {
        const result = await checkResyRestaurant(restaurant)

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

      // monitor_log writes happen inside checkResyRestaurant regardless of flag status

      return results
    })

    // --- Step 3: Send digest email if anything changed ---
    if (findings.length > 0) {
      await step.run('send-digest', () => sendMonitorDigest(findings))
    }

    return {
      checked: restaurants.length,
      flagged: findings.length,
    }
  }
)
