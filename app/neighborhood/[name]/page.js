import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseStatic } from '../../../lib/supabase-static'
import { slugify, NEIGHBORHOOD_MAP } from '../../../lib/slugify'
import ScoopNav from '../../components/ScoopNav'
import ScoopFooter from '../../components/ScoopFooter'
import './neighborhood.css'

export const revalidate = 3600

const NEIGHBORHOOD_PROSE = {
  'west-village': [
    "The West Village has the deepest concentration of hard reservations in New York. Twenty-five restaurants tracked, more Very Hard and Extremely Hard ratings than any other neighborhood. The Eighty Six, 4 Charles Prime Rib, Don Angie, Via Carota, and Jeju Noodle Bar are all here. Wild Cherry is newer and already at Very Hard. The neighborhood rewards consistency. Most of these restaurants run rolling windows, which means showing up at the right time every morning is the strategy, not luck.",
    "The booking landscape is fragmented by platform. Don Angie moved from Resy to OpenTable in May 2025. The Eighty Six is on DoorDash. 4 Charles and Via Carota are on Resy. Knowing which platform each restaurant uses before you try is the first step. The wrong app at the right time is the same as missing the drop entirely.",
  ],
  'williamsburg': [
    "Williamsburg punches above its weight for serious dining. Lilia and Aska are the two hardest tables in the neighborhood, sitting at Very Hard, and the Hard tier is dense: Four Horsemen, Maison Premiere, Misi, Francie, Peter Luger, Laser Wolf, Shota Omakase. The neighborhood has a range that few others match, from a 7 AM drop at Four Horsemen to a 60-day window at Shota Omakase.",
    "Most Williamsburg restaurants run standard rolling windows on Resy, which makes the neighborhood approachable if you understand the system. Lilia is the exception. Bar and patio walk-in seats are available nightly, and same-day cancellations tend to surface around 2 PM. For everything else, 10 AM on Resy is the recurring answer.",
  ],
  'lower-east-side': [
    "The Lower East Side has a distinct character in the reservation landscape: short windows and late drops. Double Chicken Please opens at midnight, 7 days out. Bistrot Ha at midnight, 14 days out. Ha's Snack Bar at noon, 21 days out. The neighborhood skews toward restaurants that release close in and at unconventional times, which means the standard morning-alarm strategy doesn't always apply here.",
    "Three of the hardest tables are Very Hard. The Hard tier includes Cervo's, Bar Contra, Una Pizza Napoletana, and Kisa. Corima runs a 60-day window, unusual for the neighborhood. Dhamaka is on DoorDash with a 7-day window. Katz's and Scarr's are walk-in only and operate entirely outside the reservation system.",
  ],
  'soho': [
    "SoHo has two Extremely Hard restaurants, Corner Store and Or'Esh, both on DoorDash with non-standard inventory systems that don't follow a predictable release pattern. Below that, the neighborhood is anchored by Torrisi at Very Hard on Resy, and a strong Hard tier: Le Coucou, Raoul's, Roscioli NYC, Sartiano's, Sushi Ikumi, and Ambassadors Clubhouse.",
    "The SoHo booking landscape skews toward 10 AM drops on Resy for most restaurants, with Raoul's opening at 8 AM and Corner Store and Or'Esh operating on their own schedule entirely. Balthazar is the neighborhood institution. Medium difficulty, 31-day window, reliably bookable.",
  ],
  'midtown': [
    "Midtown is where New York's most established fine dining rooms concentrate. Le Bernardin, Chef's Table at Brooklyn Fare, Gabriel Kreuther, Blue Box Cafe, Cote 550, Joji. The difficulty spread runs from Hard to Very Hard at the top, with a cluster of Medium restaurants that are genuinely bookable with reasonable planning.",
    "Drop times here skew early or unconventional. Le Bernardin opens at 7 AM. Chef's Table and Blue Box Cafe open at midnight. Most others are on standard Resy windows. The neighborhood has fewer walk-in options than the West Village or Lower East Side. Midtown fine dining is almost entirely reservation-dependent.",
  ],
}

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
    title: `${neighborhood} Restaurant Reservations and Drop Times`,
    description: `Every ${neighborhood} restaurant on Scoopd, with exact drop times and booking windows. Know exactly when tables open at the hardest spots in ${neighborhood}.`,
    alternates: { canonical: `https://scoopd.nyc/neighborhood/${name}` },
    openGraph: {
      title: `${neighborhood} Restaurant Reservations and Drop Times | Scoopd`,
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

  const prose = NEIGHBORHOOD_PROSE[name] || null
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
      { '@type': 'ListItem', position: 2, name: neighborhood, item: pageUrl },
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
          <span>{neighborhood}</span>
        </nav>
        <h1 className="np-heading">{neighborhood} Restaurant Reservations</h1>
        <p className="np-intro">Every {neighborhood} restaurant on Scoopd, with exact drop times and booking windows.</p>
        {prose && (
          <div className="np-editorial">
            {prose.map((p, i) => <p key={i} className="np-editorial-p">{p}</p>)}
          </div>
        )}
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
              : r.release_schedule || '-'
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
                <div className="np-cell">{r.platform || '-'}</div>
                <div className="np-time">{r.release_time || '-'}</div>
                <div className="np-cell">{daysOut}</div>
                <div>
                  {r.difficulty
                    ? <span className="np-badge" style={{ color: diffColor }}>{r.difficulty}</span>
                    : <span className="np-cell">-</span>
                  }
                </div>
              </Link>
            )
          })}
        </div>
        <div className="np-cta">
          <p className="np-cta-text">Get the exact date to book. From $9.99/month.</p>
          <Link href="/signup" className="np-cta-link">Get access →</Link>
        </div>
      </div>
      <ScoopFooter />
    </div>
  )
}
