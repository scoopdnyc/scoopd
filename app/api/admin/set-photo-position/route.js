import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function isAdminAuthed(request) {
  const cookieHeader = request.headers.get('cookie') || ''
  return cookieHeader.split(';').some(c => c.trim() === 'admin_auth=1')
}

export async function PATCH(request) {
  if (!isAdminAuthed(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { restaurantId, position } = await request.json()
    if (!restaurantId) {
      return Response.json({ error: 'restaurantId required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('restaurants')
      .update({ photo_position: position ?? null })
      .eq('id', restaurantId)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
