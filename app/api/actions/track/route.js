import { createClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  const serverSupabase = await createSupabaseServer()
  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) return Response.json({ ok: false }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { action_type, metadata = {} } = body
  if (!action_type) return Response.json({ error: 'missing action_type' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  await supabase.from('user_actions').insert({ user_id: user.id, action_type, metadata })

  return Response.json({ ok: true })
}
