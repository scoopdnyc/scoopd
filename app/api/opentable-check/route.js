import { createClient } from '@supabase/supabase-js'
import { checkOpenTable } from '../../../lib/monitors/opentable'
import { sendMonitorDigest } from '../../../lib/email/monitorDigest'

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('slug, restaurant, platform, observed_days, opentable_restaurant_id')
    .or('platform.ilike.%OpenTable%,platform.ilike.%opentable%')
    .not('opentable_restaurant_id', 'is', null)
    .not('observed_days', 'is', null)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const findings = []
  for (const restaurant of restaurants ?? []) {
    const result = await checkOpenTable(restaurant)
    if (result.flagged) {
      findings.push({
        slug: restaurant.slug,
        name: restaurant.restaurant,
        api_verified_days: result.api_verified_days,
        expected_days: result.expected_days,
        flag_reason: result.flag_reason,
      })
    }
  }

  if (findings.length > 0) {
    await sendMonitorDigest(findings)
  }

  return Response.json({ checked: (restaurants ?? []).length, flagged: findings.length })
}
