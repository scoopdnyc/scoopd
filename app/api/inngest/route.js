import { serve } from 'inngest/next'
import { inngest } from '../../../lib/inngest'
import { resyDailyCheck } from '../../../lib/inngest/resyDailyCheck'
import { sevenroomsDailyCheck } from '../../../lib/inngest/sevenroomsDailyCheck'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [resyDailyCheck, sevenroomsDailyCheck],
})
