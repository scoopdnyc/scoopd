import { supabase } from '../lib/supabase'
import { slugify } from '../lib/slugify'

export default async function sitemap() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return []
  }

  const [{ data: restaurants }, { data: neighborhoodRows }, { data: platformRows }] = await Promise.all([
    supabase.from('restaurants').select('slug'),
    supabase.from('restaurants').select('neighborhood'),
    supabase.from('restaurants').select('platform'),
  ])

  const restaurantPages = (restaurants || [])
    .filter(r => r.slug)
    .map(r => ({
      url: `https://scoopd.nyc/restaurant/${r.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

  const neighborhoods = [...new Set((neighborhoodRows || []).map(r => r.neighborhood).filter(Boolean))]
  const neighborhoodPages = neighborhoods.map(n => ({
    url: `https://scoopd.nyc/neighborhood/${slugify(n)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const platforms = [...new Set((platformRows || []).map(r => r.platform).filter(Boolean))]
  const platformPages = platforms.map(p => ({
    url: `https://scoopd.nyc/platform/${slugify(p)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    {
      url: 'https://scoopd.nyc',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://scoopd.nyc/how-it-works',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://scoopd.nyc/drops',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: 'https://scoopd.nyc/plan',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...restaurantPages,
    ...neighborhoodPages,
    ...platformPages,
  ]
}
