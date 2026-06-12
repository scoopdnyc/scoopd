import { createClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '../../../lib/supabase-server'

export async function POST(request) {
  const serverSupabase = await createSupabaseServer()
  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const refCode = body.ref_code || null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  let referredBy = null
  if (refCode) {
    const { data: referrer } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('referral_code', refCode)
      .maybeSingle()
    if (referrer) referredBy = referrer.user_id
  }

  const expiresAt = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
  const referralCode = `ref_${user.id.replace(/-/g, '').slice(0, 12)}`

  const { error } = await supabase.from('subscriptions').upsert({
    user_id: user.id,
    status: 'active',
    current_period_end: expiresAt,
    referral_code: referralCode,
    ...(referredBy ? { referred_by: referredBy } : {}),
  }, { onConflict: 'user_id' })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
