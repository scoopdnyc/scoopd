import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESY_LOCATION = 'new-york-ny'
const DELAY_MS = 800

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Map of current DB slug -> correct Resy slug
const SLUG_FIXES = {
  'balthazar': 'balthazar-nyc',
  'buvette': 'buvette-nyc',
  'lartusi': 'lartusi-ny',
  'pdt-please-dont-tell': 'pdt',
  'joji': 'joji',
  '63-clinton': 'sixty-three-clinton',
  '69-leonard-street': '69leonardstreet',
  'ambassadors-clubhouse': 'ambassadors-clubhouse-new-york',
  'blue-box-cafe': 'bluebox-cafe-by-daniel-boulud',
  'blue-hill': 'family-meal-at-blue-hill',
  'bungalow': 'bungalow-ny',
  'cafe-mogador': 'cafe-mogador-williamsburg',
  'cafe-spaghetti': 'cafe-spaghetti',
  'casino': 'casino-new-york',
  'dead-rabbit': 'the-dead-rabbit',
  'emily-brooklyn': 'emily',
  'employees-only': 'employees-only-nyc',
  'four-horsemen': 'the-four-horsemen',
  'huso': 'huso-nyc',
  'il-cavallini': 'i-cavallini',
  'laser-wolf': 'laser-wolf-brooklyn',
  'le-cafe-louis-vuitton': 'le-cafe-louis-vuitton',
  'le-chene': 'le-chene',
  'monkey-bar': 'monkey-bar-nyc',
  'noksu': 'noksu',
  'osteria-carlina': 'osteria-carlina-tribeca',
  'peasant': 'peasant-nyc',
  'peter-luger': 'peter-luger-steak-house',
  'place-des-fetes': 'place-des-fetes',
  'raouls': 'raoulsrestaurant',
  'saint-julivert-fisherie': 'saint-julivert-fisherie',
  'sip-and-guzzle': 'guzzle',
  'sushi-katsuei': 'sushi-katsuei-west-village',
  'the-grill': 'the-grill-ny',
  'waverly-inn': 'the-waverly-inn',
  'cafe-boulud': 'cafe-boulud-at-maison-barnes',
}

async function fetchResyVenue(resySlug) {
  const url = `https://api.resy.com/3/venue?url_slug=${resySlug}&location=${RESY_LOCATION}`
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Authorization': 'ResyAPI api_key="VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5"',
        'Origin': 'https://resy.com',
        'Referer': 'https://resy.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Origin': 'https://resy.com'
      }
    })
    if (!res.ok) return { error: `HTTP ${res.status}` }
    const data = await res.json()
    const content = data.content ?? []
    const about = content.find(c => c.name === 'about')?.body?.trim() || ''
    const whyWeLikeIt = content.find(c => c.name === 'why_we_like_it')?.body?.trim() || ''
    return { about, whyWeLikeIt }
  } catch (err) {
    return { error: err.message }
  }
}

function combineFields(about, whyWeLikeIt) {
  const parts = []
  if (about) parts.push(about)
  if (whyWeLikeIt) parts.push(whyWeLikeIt)
  return parts.join('\n\n')
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing env vars')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const results = { success: [], slugOnly: [], skipped: [], errors: [] }

  for (const [dbSlug, resySlug] of Object.entries(SLUG_FIXES)) {
    process.stdout.write(`${dbSlug} -> ${resySlug}... `)

    // Find the restaurant in DB by slug
    const { data: rows, error: fetchError } = await supabase
      .from('restaurants')
      .select('id, restaurant, slug, notes')
      .eq('slug', dbSlug)
      .single()

    if (fetchError || !rows) {
      console.log(`NOT FOUND IN DB (slug may already be different)`)
      results.errors.push({ dbSlug, error: 'not found in DB' })
      await sleep(DELAY_MS)
      continue
    }

    const restaurant = rows

    // Fetch Resy data
    const resy = await fetchResyVenue(resySlug)

    if (resy.error) {
      // Slug is wrong — just update the slug, no description
      console.log(`Resy error: ${resy.error} — updating slug only`)
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ slug: resySlug })
        .eq('id', restaurant.id)
      if (updateError) {
        results.errors.push({ dbSlug, error: updateError.message })
      } else {
        results.slugOnly.push({ dbSlug, resySlug })
      }
    } else if (!resy.about && !resy.whyWeLikeIt) {
      console.log(`No content — updating slug only`)
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ slug: resySlug })
        .eq('id', restaurant.id)
      if (updateError) {
        results.errors.push({ dbSlug, error: updateError.message })
      } else {
        results.skipped.push({ dbSlug, resySlug })
      }
    } else if (restaurant.notes) {
      // Has existing description — update slug but don't overwrite notes
      console.log(`Has existing description — updating slug only`)
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ slug: resySlug })
        .eq('id', restaurant.id)
      if (updateError) {
        results.errors.push({ dbSlug, error: updateError.message })
      } else {
        results.slugOnly.push({ dbSlug, resySlug, reason: 'existing description preserved' })
      }
    } else {
      // No existing description — update slug AND write notes
      const notes = combineFields(resy.about, resy.whyWeLikeIt)
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ slug: resySlug, notes })
        .eq('id', restaurant.id)
      if (updateError) {
        console.log(`DB ERROR: ${updateError.message}`)
        results.errors.push({ dbSlug, error: updateError.message })
      } else {
        console.log(`✓ Slug + description written`)
        results.success.push({ dbSlug, resySlug, restaurant: restaurant.restaurant })
      }
    }

    await sleep(DELAY_MS)
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Slug + description written: ${results.success.length}`)
  console.log(`Slug only updated: ${results.slugOnly.length}`)
  console.log(`Skipped (no Resy content): ${results.skipped.length}`)
  console.log(`Errors: ${results.errors.length}`)

  if (results.errors.length > 0) {
    console.log(`\nErrors:`)
    results.errors.forEach(r => console.log(`  - ${r.dbSlug}: ${r.error}`))
  }

  if (results.slugOnly.length > 0) {
    console.log(`\nSlug-only updates (review descriptions manually):`)
    results.slugOnly.forEach(r => console.log(`  - ${r.dbSlug} -> ${r.resySlug}${r.reason ? ` (${r.reason})` : ''}`))
  }

  console.log(`\nDone.`)
}

main()