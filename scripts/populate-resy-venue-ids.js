// One-time script — populate resy_venue_id for all Resy restaurants.
// Run: node scripts/populate-resy-venue-ids.js
// Do not commit this file.

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// --- Load .env.local ---
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => l.split('=').map((p, i) => i === 0 ? p.trim() : l.slice(l.indexOf('=') + 1).trim()))
)

const SUPABASE_URL     = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const RESY_API_KEY     = 'VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5'

const SLUG_OVERRIDES = {
  'cote':         'cote-nyc',
  'saga':         'saga-ny',
  'saga-lounge':  'saga-the-lounge-and-terraces',
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function fetchResyVenueId(slug) {
  const url = `https://api.resy.com/3/venue?url_slug=${encodeURIComponent(slug)}&location=new-york-ny`
  const res = await fetch(url, {
    headers: {
      Authorization: `ResyAPI api_key="${RESY_API_KEY}"`,
      Accept: 'application/json',
      Origin: 'https://resy.com',
      Referer: 'https://resy.com/',
    },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data?.id?.resy ?? null
}

async function main() {
  // Fetch all Resy restaurants without a venue ID already set
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, restaurant, slug')
    .in('platform', ['Resy', 'Resy/OpenTable', 'Resy/Tock'])
    .is('resy_venue_id', null)

  if (error) {
    console.error('DB fetch failed:', error.message)
    process.exit(1)
  }

  console.log(`Found ${restaurants.length} Resy restaurants without a venue ID.\n`)

  let succeeded = 0
  let failed = 0

  for (const r of restaurants) {
    const venueId = await fetchResyVenueId(SLUG_OVERRIDES[r.slug] ?? r.slug)

    if (venueId) {
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ resy_venue_id: String(venueId) })
        .eq('id', r.id)

      if (updateError) {
        console.log(`✗ ${r.restaurant} — DB update failed: ${updateError.message}`)
        failed++
      } else {
        console.log(`✓ ${r.restaurant} — ${venueId}`)
        succeeded++
      }
    } else {
      console.log(`✗ ${r.restaurant} — not found`)
      failed++
    }

    await sleep(300)
  }

  console.log(`\nDone. ${succeeded} updated, ${failed} failed/not found.`)
}

main()
