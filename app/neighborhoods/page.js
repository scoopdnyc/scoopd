import Link from 'next/link'
import { createSupabaseStatic } from '../../lib/supabase-static'
import { slugify, NEIGHBORHOOD_MAP } from '../../lib/slugify'
import ScoopNav from '../components/ScoopNav'
import ScoopFooter from '../components/ScoopFooter'
import './neighborhoods.css'

export const revalidate = 3600

export const metadata = {
  title: 'Browse NYC Restaurants by Neighborhood',
  description: 'Find the hardest reservations in New York by neighborhood. West Village, Williamsburg, Lower East Side, and more.',
  alternates: { canonical: 'https://scoopd.nyc/neighborhoods' },
  openGraph: {
    title: 'Browse NYC Restaurants by Neighborhood',
    description: 'Find the hardest reservations in New York by neighborhood. West Village, Williamsburg, Lower East Side, and more.',
    url: 'https://scoopd.nyc/neighborhoods',
    siteName: 'Scoopd',
    type: 'website',
  },
}

async function getNeighborhoods() {
  const client = createSupabaseStatic()
  const { data, error } = await client
    .from('restaurants')
    .select('neighborhood')
    .not('neighborhood', 'is', null)
  if (error) {
    console.error(error)
    return []
  }
  const seen = new Set()
  const unique = []
  for (const row of data) {
    if (row.neighborhood && !seen.has(row.neighborhood)) {
      seen.add(row.neighborhood)
      unique.push(row.neighborhood)
    }
  }
  return unique.sort((a, b) => a.localeCompare(b))
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://scoopd.nyc' },
    { '@type': 'ListItem', position: 2, name: 'Neighborhoods', item: 'https://scoopd.nyc/neighborhoods' },
  ],
}

export default async function NeighborhoodsPage() {
  const neighborhoods = await getNeighborhoods()

  const REVERSE_MAP = Object.fromEntries(
    Object.entries(NEIGHBORHOOD_MAP).map(([slug, name]) => [name, slug])
  )

  return (
    <main style={{ background: '#0f0f0d', minHeight: '100vh', color: '#e8e4dc', fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ScoopNav />
      <div className="nb-hero">
        <div className="nb-eyebrow">Browse</div>
        <h1 className="nb-headline">By Neighborhood</h1>
      </div>
      <div className="nb-content">
        <ul className="nb-list">
          {neighborhoods.map((name) => {
            const slug = REVERSE_MAP[name] || slugify(name)
            return (
              <li key={name} className="nb-item">
                <Link href={`/neighborhood/${slug}`} className="nb-link">
                  {name}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
      <ScoopFooter />
    </main>
  )
}
