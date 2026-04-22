import { createClient } from '@supabase/supabase-js'
import { inngest } from '../inngest'
import { checkCornerStoreOpportunistic } from '../monitors/sevenrooms-opportunistic'

export const sevenroomsOpportunisticCheck = inngest.createFunction(
  // Every 5 minutes from 4 PM UTC (noon ET) to 10 PM UTC (6 PM ET)
  { id: 'sevenrooms-opportunistic-check', triggers: [{ cron: '*/5 16-22 * * *' }] },
  async ({ step }) => {
    const result = await step.run('check-corner-store', async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      return checkCornerStoreOpportunistic(supabase)
    })

    return result
  }
)
