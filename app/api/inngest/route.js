import { serve } from 'inngest/next'
import { inngest } from '../../../lib/inngest'
import { resyDailyCheck } from '../../../lib/inngest/resyDailyCheck'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [resyDailyCheck],
})
