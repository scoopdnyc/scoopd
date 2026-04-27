import { supabase } from '../lib/supabase'
import { slugify } from '../lib/slugify'

export default async function sitemap() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return []
  }

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('slug, neighborhood, platform, last_updated_at')

  const rows = restaurants || []

  const restaurantPages = rows
    .filter(r => r.slug)
    .map(r => ({
      url: `https://scoopd.nyc/restaurant/${r.slug}`,
      lastModified: r.last_updated_at ? new Date(r.last_updated_at) : new Date('2026-04-21'),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

  // Neighborhood pages — lastmod = most recent restaurant update in that neighborhood
  const neighborhoodMap = new Map()
  for (const r of rows) {
    if (!r.neighborhood) continue
    const key = slugify(r.neighborhood)
    const ts = r.last_updated_at ? new Date(r.last_updated_at) : new Date('2026-04-21')
    if (!neighborhoodMap.has(key) || ts > neighborhoodMap.get(key).lastmod) {
      neighborhoodMap.set(key, { name: r.neighborhood, lastmod: ts })
    }
  }
  const neighborhoodPages = [...neighborhoodMap.entries()].map(([slug, { lastmod }]) => ({
    url: `https://scoopd.nyc/neighborhood/${slug}`,
    lastModified: lastmod,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // Platform pages — lastmod = most recent restaurant update on that platform
  const platformMap = new Map()
  for (const r of rows) {
    if (!r.platform) continue
    const key = slugify(r.platform)
    const ts = r.last_updated_at ? new Date(r.last_updated_at) : new Date('2026-04-21')
    if (!platformMap.has(key) || ts > platformMap.get(key).lastmod) {
      platformMap.set(key, { platform: r.platform, lastmod: ts })
    }
  }
  const platformPages = [...platformMap.entries()].map(([slug, { lastmod }]) => ({
    url: `https://scoopd.nyc/platform/${slug}`,
    lastModified: lastmod,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    {
      url: 'https://scoopd.nyc',
      lastModified: new Date('2026-04-27'),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://scoopd.nyc/how-it-works',
      lastModified: new Date('2026-04-21'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://scoopd.nyc/drops',
      lastModified: new Date('2026-04-27'),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: 'https://scoopd.nyc/plan',
      lastModified: new Date('2026-04-27'),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...restaurantPages,
    ...neighborhoodPages,
    ...platformPages,
  ]
}
