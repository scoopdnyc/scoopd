import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('slug')

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const slugs = (restaurants ?? []).filter(r => r.slug).map(r => r.slug)
  for (const slug of slugs) {
    revalidatePath(`/restaurant/${slug}`)
  }

  return Response.json({ revalidated: slugs.length, slugs })
}
