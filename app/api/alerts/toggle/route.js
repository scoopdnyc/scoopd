import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .single()
  if (sub?.status !== 'active') {
    return NextResponse.json({ error: 'premium_required' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const slug = typeof body.restaurant_slug === 'string' ? body.restaurant_slug.trim() : ''
  if (!slug) return NextResponse.json({ error: 'restaurant_slug required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('alerts')
    .select('id')
    .eq('user_id', user.id)
    .eq('restaurant_slug', slug)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('alerts').delete().eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ active: false })
  }

  const { error } = await supabase
    .from('alerts')
    .insert({ user_id: user.id, restaurant_slug: slug })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ active: true })
}
