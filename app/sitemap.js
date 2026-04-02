import { supabase } from '../lib/supabase'

export default async function sitemap() {
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('slug')

  const restaurantPages = (restaurants || [])
    .filter(r => r.slug)
    .map(r => ({
      url: `https://scoopd.nyc/restaurant/${r.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
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
      url: 'https://scoopd.nyc/signup',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...restaurantPages,
  ]
}