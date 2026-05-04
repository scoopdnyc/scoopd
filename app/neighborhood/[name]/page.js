import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseStatic } from '../../../lib/supabase-static'
import { slugify, NEIGHBORHOOD_MAP } from '../../../lib/slugify'
import ScoopNav from '../../components/ScoopNav'
import ScoopFooter from '../../components/ScoopFooter'
import './neighborhood.css'

export const revalidate = 3600

const DIFFICULTY_ORDER = { 'Extremely Hard': 0, 'Very Hard': 1, 'Hard': 2, 'Medium': 3, 'Easy': 4 }

export async function generateStaticParams() {
  const supabase = createSupabaseStatic()
  const { data } = await supabase.from('restaurants').select('neighborhood')
  const seen = new Set()
  const result = []
  for (const r of data ?? []) {
    if (!r.neighborhood) continue
    const slug = slugify(r.neighborhood)
    if (!seen.has(slug)) {
      seen.add(slug)
      result.push({ name: slug })
    }
  }
  return result
}

export async function generateMetadata({ params }) {
  const { name } = await params
  const neighborhood = NEIGHBORHOOD_MAP[name]
  if (!neighborhood) return {}
  return {
    title: `${neighborhood} Restaurants — Reservations & Drop Times`,
    description: `Every ${neighborhood} restaurant on Scoopd, with exact drop times and booking windows. Know exactly when tables open at the hardest spots in ${neighborhood}.`,
    alternates: { canonical: `https://scoopd.nyc/neighborhood/${name}` },
    openGraph: {
      title: `${neighborhood} Restaurants — Reservations & Drop Times | Scoopd`,
      description: `Every ${neighborhood} restaurant on Scoopd, with exact drop times and booking windows.`,
      url: `https://scoopd.nyc/neighborhood/${name}`,
      siteName: 'Scoopd',
      type: 'website',
    },
  }
}

export default async function NeighborhoodPage({ params }) {
  const { name } = await params
  const neighborhood = NEIGHBORHOOD_MAP[name]
  if (!neighborhood) notFound()

  const supabase = createSupabaseStatic()
  const { data } = await supabase
    .from('restaurants')
    .select('id, restaurant, platform, release_time, observed_days, release_schedule, difficulty, slug')
    .eq('neighborhood', neighborhood)

  if (!data || data.length === 0) notFound()

  const restaurants = [...data].sort((a, b) => {
    const diffA = DIFFICULTY_ORDER[a.difficulty] ?? 99
    const diffB = DIFFICULTY_ORDER[b.difficulty] ?? 99
    return diffA - diffB
  })

  const pageUrl = `https://scoopd.nyc/neighborhood/${name}`

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${neighborhood} Restaurant Reservations`,
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
      { '@type': 'ListItem', position: 2, name: 'Neighborhoods', item: 'https://scoopd.nyc/neighborhoods' },
      { '@type': 'ListItem', position: 3, name: neighborhood, item: pageUrl },
    ],
  }

  return (
    <div className="np-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ScoopNav />
      <div className="np-container">
        <nav className="np-breadcrumb">
          <Link href="/">Home</Link>
          <span className="np-sep">/</span>
          <span>Neighborhoods</span>
          <span className="np-sep">/</span>
          <span>{neighborhood}</span>
        </nav>
        <h1 className="np-heading">{neighborhood} Restaurant Reservations</h1>
        <p className="np-intro">Every {neighborhood} restaurant on Scoopd, with exact drop times and booking windows.</p>
        <div className="np-table">
          <div className="np-thead">
            <div className="np-th">Restaurant</div>
            <div className="np-th">Platform</div>
            <div className="np-th">Drop Time</div>
            <div className="np-th">Days Out</div>
            <div className="np-th">Difficulty</div>
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
              <Link key={r.id} href={`/restaurant/${r.slug}`} className="np-row">
                <div className="np-name">{r.restaurant}</div>
                <div className="np-cell">{r.platform || '—'}</div>
                <div className="np-time">{r.release_time || '—'}</div>
                <div className="np-cell">{daysOut}</div>
                <div>
                  {r.difficulty
                    ? <span className="np-badge" style={{ color: diffColor }}>{r.difficulty}</span>
                    : <span className="np-cell">—</span>
                  }
                </div>
              </Link>
            )
          })}
        </div>
        <div className="np-cta">
          <p className="np-cta-text">Get the exact date to book — from $9.99/month.</p>
          <Link href="/signup" className="np-cta-link">Get access →</Link>
        </div>
      </div>
      <ScoopFooter />
    </div>
  )
}
