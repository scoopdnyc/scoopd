import { createClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase-server'
import { extendAccess } from '@/lib/access'

export async function POST() {
  const serverSupabase = await createSupabaseServer()
  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) return Response.json({ ok: false })

  const { data: sub } = await serverSupabase
    .from('subscriptions')
    .select('referred_by')
    .eq('user_id', user.id)
    .single()

  if (!sub?.referred_by) return Response.json({ ok: true })

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: triggered } = await serviceClient
    .from('user_actions')
    .select('id')
    .eq('user_id', user.id)
    .eq('action_type', 'referral_triggered')
    .maybeSingle()

  if (triggered) return Response.json({ ok: true })

  await serviceClient.from('user_actions').insert({
    user_id: user.id,
    action_type: 'referral_triggered',
    metadata: { referrer_id: sub.referred_by },
  })

  extendAccess(sub.referred_by, 14, 'referral_converted', { referred_user: user.id }).catch(() => {})

  return Response.json({ ok: true })
}
