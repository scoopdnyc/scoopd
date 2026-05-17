import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseStatic } from '../../../lib/supabase-static'
import { slugify, PLATFORM_MAP, EXCLUDED_PLATFORM_VALUES } from '../../../lib/slugify'
import ScoopNav from '../../components/ScoopNav'
import ScoopFooter from '../../components/ScoopFooter'
import './platform.css'

export const revalidate = 3600

const DIFFICULTY_ORDER = { 'Extremely Hard': 0, 'Very Hard': 1, 'Hard': 2, 'Medium': 3, 'Easy': 4 }

export async function generateStaticParams() {
  const supabase = createSupabaseStatic()
  const { data } = await supabase.from('restaurants').select('platform')
  const seen = new Set()
  const result = []
  for (const r of data ?? []) {
    if (!r.platform || EXCLUDED_PLATFORM_VALUES.has(r.platform)) continue
    const slug = slugify(r.platform)
    if (!seen.has(slug)) {
      seen.add(slug)
      result.push({ name: slug })
    }
  }
  return result
}

export async function generateMetadata({ params }) {
  const { name } = await params
  const platform = PLATFORM_MAP[name]
  if (!platform) return {}
  return {
    title: `${platform} Restaurants NYC: Drop Times and Reservations`,
    description: `Every ${platform} restaurant tracked by Scoopd, with release times and booking windows. Know exactly when reservations open.`,
    alternates: { canonical: `https://scoopd.nyc/platform/${name}` },
    openGraph: {
      title: `${platform} Restaurants NYC: Drop Times and Reservations | Scoopd`,
      description: `Every ${platform} restaurant tracked by Scoopd, with release times and booking windows.`,
      url: `https://scoopd.nyc/platform/${name}`,
      siteName: 'Scoopd',
      type: 'website',
    },
  }
}

export default async function PlatformPage({ params }) {
  const { name } = await params
  const platform = PLATFORM_MAP[name]
  if (!platform) notFound()

  const supabase = createSupabaseStatic()
  const { data } = await supabase
    .from('restaurants')
    .select('id, restaurant, neighborhood, release_time, observed_days, release_schedule, difficulty, slug')
    .eq('platform', platform)

  if (!data || data.length === 0) notFound()

  const restaurants = [...data].sort((a, b) => {
    const diffA = DIFFICULTY_ORDER[a.difficulty] ?? 99
    const diffB = DIFFICULTY_ORDER[b.difficulty] ?? 99
    return diffA - diffB
  })

  const pageUrl = `https://scoopd.nyc/platform/${name}`

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${platform} Restaurants NYC`,
    url: pageUrl,
    numberOfItems: restaurants.length,
    itemListElement: restaurants.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: r.restaurant,
      url: `https://scoopd.nyc/restaurant/${r.slug}`,
    })),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://scoopd.nyc' },
      { '@type': 'ListItem', position: 2, name: platform, item: pageUrl },
    ],
  }

  return (
    <div className="pp-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ScoopNav />
      <div className="pp-container">
        <nav className="pp-breadcrumb">
          <Link href="/">Home</Link>
          <span className="pp-sep">/</span>
          <span>{platform}</span>
        </nav>
        <h1 className="pp-heading">{platform} Restaurants NYC: Drop Times and Reservations</h1>
        <p className="pp-intro">Every {platform} restaurant tracked by Scoopd, with release times and booking windows.</p>
        <div className="pp-table">
          <div className="pp-thead">
            <div className="pp-th">Restaurant</div>
            <div className="pp-th">Neighborhood</div>
            <div className="pp-th">Drop Time</div>
            <div className="pp-th">Days Out</div>
            <div className="pp-th">Difficulty</div>
          </div>
          {restaurants.map(r => {
            const daysOut = r.observed_days
              ? `${r.observed_days} days`
              : r.release_schedule || '—'
            const diffColor =
              r.difficulty === 'Extremely Hard' ? '#a855f7'
              : r.difficulty === 'Very Hard' ? '#c96e6e'
              : r.difficulty === 'Hard' ? '#e38f09'
              : r.difficulty === 'Medium' ? '#c9b882'
              : r.difficulty === 'Easy' ? '#6ec9a0'
              : '#8a8a80'
            return (
              <Link key={r.id} href={`/restaurant/${r.slug}`} className="pp-row">
                <div className="pp-name">{r.restaurant}</div>
                <div className="pp-cell">{r.neighborhood || '—'}</div>
                <div className="pp-time">{r.release_time || '—'}</div>
                <div className="pp-cell">{daysOut}</div>
                <div>
                  {r.difficulty
                    ? <span className="pp-badge" style={{ color: diffColor }}>{r.difficulty}</span>
                    : <span className="pp-cell">—</span>
                  }
                </div>
              </Link>
            )
          })}
        </div>
        <div className="pp-cta">
          <p className="pp-cta-text">Get the exact date to book. From $9.99/month.</p>
          <Link href="/signup" className="pp-cta-link">Get access →</Link>
        </div>
      </div>
      <ScoopFooter />
    </div>
  )
}
