import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function isAdminAuthed(request) {
  const cookieHeader = request.headers.get('cookie') || ''
  return cookieHeader.split(';').some(c => c.trim() === 'admin_auth=1')
}

export async function POST(request) {
  if (!isAdminAuthed(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    if (!body.restaurant || !body.slug) {
      return Response.json({ error: 'Restaurant name is required' }, { status: 400 })
    }

    const cleaned = Object.fromEntries(
      Object.entries(body).map(([k, v]) => [k, v === '' ? null : v])
    )

    const { data, error } = await supabase
      .from('restaurants')
      .insert([cleaned])
      .select()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, data })
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
