import { createClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '../../../lib/supabase-server'

export async function POST() {
  const serverSupabase = await createSupabaseServer()
  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const expiresAt = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase.from('subscriptions').upsert({
    user_id: user.id,
    status: 'active',
    current_period_end: expiresAt,
  }, { onConflict: 'user_id' })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
