import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { supabase } from '../lib/supabase'
import { slugify, EXCLUDED_PLATFORM_VALUES } from '../lib/slugify'

function getBlogPosts() {
  const dir = path.join(process.cwd(), 'content/blog')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.mdx'))
    .map(f => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf-8')
      const { data } = matter(raw)
      return data
    })
}

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
    }))

  // Neighborhood pages
  const neighborhoodSlugs = [...new Set(rows.filter(r => r.neighborhood).map(r => slugify(r.neighborhood)))]
  const neighborhoodPages = neighborhoodSlugs.map(slug => ({
    url: `https://scoopd.nyc/neighborhood/${slug}`,
    lastModified: new Date('2026-05-02'),
  }))

  // Platform pages: exclusion list shared with app/platform/[name]/page.js
  const platformSlugs = [...new Set(
    rows
      .filter(r => r.platform && !EXCLUDED_PLATFORM_VALUES.has(r.platform))
      .map(r => slugify(r.platform))
  )]
  const platformPages = platformSlugs.map(slug => ({
    url: `https://scoopd.nyc/platform/${slug}`,
    lastModified: new Date('2026-05-02'),
  }))

  const blogPosts = getBlogPosts().map(post => ({
    url: `https://scoopd.nyc/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
  }))

  return [
    {
      url: 'https://scoopd.nyc',
      lastModified: new Date('2026-04-27'),
    },
    {
      url: 'https://scoopd.nyc/how-it-works',
      lastModified: new Date('2026-04-21'),
    },
    {
      url: 'https://scoopd.nyc/blog',
      lastModified: new Date('2026-05-02'),
    },
    {
      url: 'https://scoopd.nyc/drops',
      lastModified: new Date('2026-04-27'),
    },
    {
      url: 'https://scoopd.nyc/plan',
      lastModified: new Date('2026-04-27'),
    },
    ...restaurantPages,
    ...neighborhoodPages,
    ...platformPages,
    ...blogPosts,
  ]
}
