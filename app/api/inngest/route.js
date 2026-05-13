import { serve } from 'inngest/next'
import { inngest } from '../../../lib/inngest'
import { resyDailyCheck } from '../../../lib/inngest/resyDailyCheck'
import { sevenroomsDailyCheck } from '../../../lib/inngest/sevenroomsDailyCheck'
import { sevenroomsLongCalMonthlyCheck } from '../../../lib/inngest/sevenroomsLongCalMonthlyCheck'
import { alertDigest } from '../../../lib/inngest/alertDigest'
import { opentableDailyCheck } from '../../../lib/inngest/opentableDailyCheck'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [resyDailyCheck, sevenroomsDailyCheck, sevenroomsLongCalMonthlyCheck, alertDigest, opentableDailyCheck],
})
