// One-time script — populate google_place_id for all restaurants.
// Run: node scripts/fetch-place-ids.mjs
// Do not commit this file.

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const SUPABASE_URL       = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY   = env.SUPABASE_SERVICE_ROLE_KEY
const GOOGLE_PLACES_KEY  = env.GOOGLE_PLACES_API_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !GOOGLE_PLACES_KEY) {
  console.error('Missing env vars — check .env.local')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const { data: restaurants, error } = await db
  .from('restaurants')
  .select('id, restaurant, address')
  .is('google_place_id', null)

if (error) {
  console.error('DB fetch failed:', error.message)
  process.exit(1)
}

console.log(`Fetching place IDs for ${restaurants.length} restaurants...\n`)

let found = 0
let notFound = 0

for (const r of restaurants) {
  const input = [r.restaurant, r.address].filter(Boolean).join(' ')
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(input)}&inputtype=textquery&fields=place_id&key=${GOOGLE_PLACES_KEY}`

  let placeId = null
  try {
    const res = await fetch(url)
    const json = await res.json()
    placeId = json.candidates?.[0]?.place_id ?? null
  } catch (e) {
    console.error(`  [ERROR] ${r.restaurant}: ${e.message}`)
  }

  if (placeId) {
    const { error: updateErr } = await db
      .from('restaurants')
      .update({ google_place_id: placeId })
      .eq('id', r.id)
    if (updateErr) {
      console.error(`  [DB ERROR] ${r.restaurant}: ${updateErr.message}`)
    } else {
      console.log(`  FOUND     ${r.restaurant} → ${placeId}`)
      found++
    }
  } else {
    console.log(`  NOT FOUND ${r.restaurant}`)
    notFound++
  }

  await new Promise(resolve => setTimeout(resolve, 200))
}

console.log(`\nDone. Found: ${found} | Not found: ${notFound}`)
