import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function extendAccess(userId, days, actionType = 'referral_converted', metadata = {}) {
  const supabase = getServiceClient()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('current_period_end')
    .eq('user_id', userId)
    .single()

  const base = sub?.current_period_end ? new Date(sub.current_period_end) : new Date()
  const newEnd = new Date(
    Math.max(base.getTime(), Date.now()) + days * 24 * 60 * 60 * 1000
  ).toISOString()

  await supabase.from('subscriptions').upsert(
    { user_id: userId, status: 'active', current_period_end: newEnd },
    { onConflict: 'user_id' }
  )

  await supabase.from('user_actions').insert({
    user_id: userId,
    action_type: actionType,
    metadata: { days_added: days, ...metadata },
  })
}
