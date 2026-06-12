import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('referral_code')
    .eq('user_id', user.id)
    .single()

  if (!sub?.referral_code) return Response.json({ referral_link: null })

  return Response.json({ referral_link: `https://scoopd.nyc/signup?ref=${sub.referral_code}` })
}
