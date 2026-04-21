import { createClient } from '@supabase/supabase-js'
import { inngest } from '../inngest'
import { checkResyRestaurant } from '../monitors/resy'
import { sendMonitorDigest } from '../email/monitorDigest'

export const resyDailyCheck = inngest.createFunction(
  {
    id: 'resy-daily-check',
    name: 'Resy Daily Check',
    // Retry up to 2 times on unexpected failure
    retries: 2,
  },
  // 5 PM UTC = 1 PM ET (well after morning drop windows have fired)
  { cron: '0 17 * * *' },
  async ({ step }) => {
    // --- Step 1: Fetch all active Resy restaurants from DB ---
    const restaurants = await step.run('fetch-resy-restaurants', async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      const { data, error } = await supabase
        .from('restaurants')
        .select('slug, restaurant, resy_venue_id, release_time, observed_days')
        .in('platform', ['Resy', 'Resy/OpenTable', 'Resy/Tock'])
        .not('slug', 'is', null)
      if (error) throw new Error(`DB fetch failed: ${error.message}`)
      return data || []
    })

    // --- Step 2: Check each restaurant against the Resy API ---
    // Run checks serially to avoid hammering the Resy API
    const findings = await step.run('check-all-restaurants', async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      const results = []

      for (const restaurant of restaurants) {
        const changes = await checkResyRestaurant(restaurant)

        if (changes.length > 0) {
          // Log each discrepancy to monitor_log
          const logRows = changes.map(c => ({
            restaurant_slug: restaurant.slug,
            source: 'resy',
            field: c.field,
            old_value: c.stored,
            new_value: c.observed,
          }))
          await supabase.from('monitor_log').insert(logRows)

          results.push({
            slug: restaurant.slug,
            name: restaurant.restaurant,
            changes,
          })
        }
      }

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
