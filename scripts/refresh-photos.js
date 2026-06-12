// Refresh photo_override_url for all restaurants with a google_place_id.
// URLs from Google Places expire — this fetches fresh ones.
// Run: node scripts/refresh-photos.js

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const SUPABASE_URL     = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const PLACES_API_KEY   = env.GOOGLE_PLACES_API_KEY

if (!PLACES_API_KEY) {
  console.error('GOOGLE_PLACES_API_KEY not set in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function fetchFreshPhotoUrl(placeId) {
  const detailsRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${PLACES_API_KEY}`
  )
  const details = await detailsRes.json()
  const photos = details.result?.photos ?? []
  if (!photos.length) return null

  const best = photos.slice().sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]
  const photoRef = best?.photo_reference
  if (!photoRef) return null

  const photoRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=4800&photo_reference=${photoRef}&key=${PLACES_API_KEY}`,
    { redirect: 'follow' }
  )
  const finalUrl = photoRes.url
  if (!finalUrl || !finalUrl.includes('googleusercontent.com')) return null
  return finalUrl
}

const { data: restaurants, error } = await supabase
  .from('restaurants')
  .select('slug, google_place_id')
  .not('google_place_id', 'is', null)

if (error) { console.error('DB query failed:', error.message); process.exit(1) }

console.log(`Refreshing photos for ${restaurants.length} restaurants...`)

let updated = 0
let failed = 0

for (const r of restaurants) {
  try {
    const url = await fetchFreshPhotoUrl(r.google_place_id)
    if (!url) {
      console.log(`  skip (no photo): ${r.slug}`)
      continue
    }
    const { error: updateErr } = await supabase
      .from('restaurants')
      .update({ photo_override_url: url })
      .eq('slug', r.slug)
    if (updateErr) throw updateErr
    console.log(`  ok: ${r.slug}`)
    updated++
  } catch (err) {
    console.error(`  error: ${r.slug}: ${err.message}`)
    failed++
  }
  await new Promise(res => setTimeout(res, 120)) // ~8 req/s, under Places API limit
}

console.log(`\nDone. ${updated} updated, ${failed} failed.`)
