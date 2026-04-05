import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()

    if (!body.restaurant || !body.slug) {
      return Response.json({ error: 'Restaurant name is required' }, { status: 400 })
    }

    // Clean up empty strings to null
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
  } catch (err) {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}