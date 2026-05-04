import { unstable_cache } from 'next/cache'
import { createSupabaseStatic } from '../../../lib/supabase-static'
import { computeNextDropDate } from '../../../lib/dropDate'
import { slugify } from '../../../lib/slugify'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ScoopNav from '../../components/ScoopNav'
import ScoopFooter from '../../components/ScoopFooter'
import ShareButton from '../../components/ShareButton'
import AlertBell from '../../components/AlertBell'
import NsiField from '../../components/NsiField'
import PremiumReveal from './PremiumReveal'
import './restaurant.css'

export const revalidate = 3600

// Pre-generate all restaurant slugs at build time so Next.js treats these
// routes as ISR pages (not dynamic). Revalidate = 3600 gives hourly refresh.
export async function generateStaticParams() {
  const db = createSupabaseStatic()
  const { data } = await db.from('restaurants').select('slug')
  return (data ?? []).filter(r => r.slug).map(r => ({ slug: r.slug }))
}

// Cached restaurant fetch — keyed by slug, revalidates every hour.
// Includes non_standard_inventory so the NSI query is eliminated.
const getRestaurantCached = unstable_cache(
  async (slug) => {
    const db = createSupabaseStatic()
    const { data, error } = await db
      .from('restaurants')
      .select('restaurant, neighborhood, platform, cuisine, release_time, observed_days, release_schedule, seat_count, michelin_stars, price_tier, difficulty, notes, slug, address, non_standard_inventory')
      .eq('slug', slug)
      .single()
    if (error || !data) return null
    return data
  },
  ['restaurant-data'],
  { revalidate: 3600, tags: ['restaurant'] }
)

// Cached cross-link fetch — keyed by slug + filters.
const getCrossLinksCached = unstable_cache(
  async (slug, neighborhood, difficulty, platform) => {
    const db = createSupabaseStatic()
    const [
      { data: neighborhoodRaw },
      { data: difficultyRaw },
      { data: platformRaw },
    ] = await Promise.all([
      db.from('restaurants').select('restaurant, slug, difficulty, cuisine').eq('neighborhood', neighborhood).neq('slug', slug),
      difficulty ? db.from('restaurants').select('restaurant, slug, difficulty').eq('difficulty', difficulty).neq('slug', slug) : Promise.resolve({ data: [] }),
      platform   ? db.from('restaurants').select('restaurant, slug, difficulty').eq('platform', platform).neq('slug', slug)   : Promise.resolve({ data: [] }),
    ])
    return {
      neighborhoodRaw: neighborhoodRaw ?? [],
      difficultyRaw:   difficultyRaw   ?? [],
      platformRaw:     platformRaw     ?? [],
    }
  },
  ['restaurant-crosslinks'],
  { revalidate: 3600 }
)

function shuffleTake4(arr) {
  const a = [...(arr || [])]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, 4)
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const r = await getRestaurantCached(slug)
  if (!r) return { title: 'Not Found' }

  const title = `${r.restaurant} Reservations — Drop Time & Booking Intelligence`

  let description
  if (r.notes) {
    description = r.notes.length > 155 ? r.notes.slice(0, 152) + '...' : r.notes
  } else if (r.observed_days && r.release_time && r.platform) {
    description = `${r.restaurant} releases reservations on ${r.platform} at ${r.release_time}, ${r.observed_days} days out. Know exactly when to book on Scoopd.`
  } else {
    description = `Find out exactly when ${r.restaurant} reservations drop in NYC. Release time, platform, and booking intelligence on Scoopd.`
  }

  const url = `https://scoopd.nyc/restaurant/${slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Scoopd',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function RestaurantPage({ params }) {
  const { slug } = await params

  const r = await getRestaurantCached(slug)
  if (!r) notFound()

  const isNonStandardInventory = r.non_standard_inventory === true

  const { neighborhoodRaw, difficultyRaw, platformRaw } = await getCrossLinksCached(
    slug, r.neighborhood, r.difficulty, r.platform
  )

  const neighborhoodRestaurants = shuffleTake4(neighborhoodRaw)
  const difficultyRestaurants   = shuffleTake4(difficultyRaw)
  const platformRestaurants     = shuffleTake4(platformRaw)

  const { display: dropDateDisplay } = computeNextDropDate(r)

  const isClosed = r.platform === 'CLOSED'
  const isWalkin = r.platform === 'Walk-in'
  const isPhone  = r.platform === 'Phone' || r.platform === 'Phone/Relationships'

  const diffColor =
    r.difficulty === 'Extremely Hard' ? '#a855f7'
    : r.difficulty === 'Very Hard' ? '#c96e6e'
    : r.difficulty === 'Hard' ? '#e38f09'
    : r.difficulty === 'Medium' ? '#c9b882'
    : r.difficulty === 'Easy' ? '#6ec9a0'
    : '#8a8a80'

  // Days out display logic — asterisk suppressed for non-standard inventory restaurants
  const daysOutValue = r.observed_days
    ? `${r.observed_days} days${isNonStandardInventory ? '' : '*'}`
    : r.release_schedule
    ? r.release_schedule
    : '—'

  const nsiCardStyle = isNonStandardInventory ? { background: 'rgba(80, 110, 140, 0.15)' } : {}

  const daysOutClass = r.observed_days
    ? 'rp-info-value mono'
    : r.release_schedule
    ? 'rp-info-value'
    : 'rp-info-value na'

  // Auto-generated booking sentence for restaurants without notes
  let autoSentence = null
  if (!r.notes) {
    if (isWalkin) {
      autoSentence = `${r.restaurant} does not take reservations — walk-in only.`
    } else if (isPhone) {
      autoSentence = `${r.restaurant} takes reservations by phone only.`
    } else if (r.observed_days && r.release_time && r.platform) {
      autoSentence = `${r.restaurant} releases reservations on ${r.platform} at ${r.release_time} ET, ${r.observed_days} days in advance.`
    } else if (r.release_schedule && r.platform) {
      autoSentence = `${r.restaurant} releases reservations on ${r.platform} on the ${r.release_schedule}.`
    } else if (r.platform) {
      autoSentence = `${r.restaurant} accepts reservations on ${r.platform}.`
    }
  }

  const streetAddress = r.address ? r.address.split(',')[0].trim() : undefined
  const postalCode    = r.address ? (r.address.match(/\b\d{5}\b/) || [])[0] : undefined
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: r.restaurant,
    ...(r.cuisine && { servesCuisine: r.cuisine }),
    ...(r.address && {
      address: {
        '@type': 'PostalAddress',
        ...(streetAddress && { streetAddress }),
        addressLocality: 'New York',
        addressRegion: 'NY',
        addressCountry: 'US',
        ...(postalCode && { postalCode }),
      },
    }),
    url: `https://scoopd.nyc/restaurant/${slug}`,
    ...(r.notes && { description: r.notes }),
    ...(r.price_tier && { priceRange: r.price_tier }),
    acceptsReservations: r.platform !== 'Walk-in' && r.platform !== 'CLOSED',
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://scoopd.nyc',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: r.restaurant,
        item: `https://scoopd.nyc/restaurant/${slug}`,
      },
    ],
  }

  return (
    <main style={{background:'#0f0f0d',minHeight:'100vh',color:'#e8e4dc',fontFamily:"var(--font-dm-sans), sans-serif"}}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ScoopNav />
      <Link href="/" className="rp-back">← Back to directory</Link>
      <div className="rp-hero">
        <div className="rp-eyebrow">{r.neighborhood} · {r.cuisine}</div>
        <h1 className="rp-restaurant-name">{r.restaurant} Reservations</h1>
        <div className="rp-hero-footer">
          <div className="rp-restaurant-meta">{r.platform}{r.michelin_stars && r.michelin_stars !== '—' ? ` · ${r.michelin_stars}` : ''}{r.price_tier ? ` · ${r.price_tier}` : ''}</div>
          <ShareButton restaurantName={r.restaurant} platform={r.platform} releaseTime={r.release_time} observedDays={r.observed_days} slug={slug} />
        </div>
      </div>
      {isClosed && <div className="rp-closed-notice">This restaurant is permanently closed.</div>}
      {isWalkin && <div className="rp-walkin-notice">Walk-in only — no reservations accepted. Arrive early.</div>}
      {!isClosed && <>
        <div className="rp-section-heading-row">
          <h2 className="rp-section-label">Booking Intelligence</h2>
          {!isWalkin && <AlertBell slug={slug} />}
        </div>
        <div className="rp-content">
          <div className="rp-info-card" style={nsiCardStyle}>
            <div className="rp-info-label">Release Time</div>
            {isNonStandardInventory
              ? <NsiField value={r.release_time || '—'} valueClassName={`rp-info-value ${r.release_time ? 'mono' : 'na'}`} />
              : <div className={`rp-info-value ${r.release_time ? 'mono' : 'na'}`}>{r.release_time || (isWalkin ? 'Walk-in only' : isPhone ? 'Phone only' : '—')}</div>
            }
          </div>
          <div className="rp-info-card" style={nsiCardStyle}>
            <div className="rp-info-label">Days Out</div>
            {isNonStandardInventory
              ? <NsiField value={daysOutValue} valueClassName={daysOutClass} />
              : <div className={daysOutClass}>{daysOutValue}</div>
            }
          </div>
          <div className="rp-info-card"><div className="rp-info-label">Platform</div><div className="rp-info-value">{r.platform || '—'}</div></div>
          <div className="rp-info-card"><div className="rp-info-label">Difficulty</div><div className="rp-info-value" style={{color:diffColor}}>{r.difficulty || '—'}</div></div>
          <div className="rp-info-card"><div className="rp-info-label">Seats</div><div className={`rp-info-value ${r.seat_count ? '' : 'na'}`}>{r.seat_count || '—'}</div></div>
        </div>
        <PremiumReveal dropDate={dropDateDisplay} isPlatformWalkIn={isWalkin} />
        {(r.notes || autoSentence) && (
          <div className="rp-section-heading-row">
            <h2 className="rp-section-label">About</h2>
          </div>
        )}
        {r.notes
          ? <div className="rp-description">{r.notes}</div>
          : autoSentence && <div className="rp-description">{autoSentence}</div>
        }
      </>}
      {neighborhoodRestaurants.length > 0 && (
        <div className="nb-section">
          <h2 className="rp-section-label">More in {r.neighborhood}</h2>
          <div className="nb-row">
            {neighborhoodRestaurants.map(nr => {
              const badgeColor =
                nr.difficulty === 'Extremely Hard' ? '#a855f7'
                : nr.difficulty === 'Very Hard' ? '#c96e6e'
                : nr.difficulty === 'Hard' ? '#e38f09'
                : nr.difficulty === 'Medium' ? '#c9b882'
                : nr.difficulty === 'Easy' ? '#6ec9a0'
                : '#8a8a80'
              return (
                <Link key={nr.slug} href={`/restaurant/${nr.slug}`} className="nb-card">
                  <span className="nb-name">{nr.restaurant}</span>
                  {nr.difficulty && <span className="nb-badge" style={{color: badgeColor}}>{nr.difficulty}</span>}
                </Link>
              )
            })}
          </div>
        </div>
      )}
      {r.neighborhood && (
        <div className="nb-cat-row">
          <Link href={`/neighborhood/${slugify(r.neighborhood)}`} className="nb-cat-link">
            View all {r.neighborhood} restaurants →
          </Link>
        </div>
      )}
      {difficultyRestaurants.length > 0 && r.difficulty && (
        <div className="nb-section">
          <h2 className="nb-heading">More {r.difficulty} restaurants</h2>
          <div className="nb-row">
            {difficultyRestaurants.map(nr => {
              const badgeColor =
                nr.difficulty === 'Extremely Hard' ? '#a855f7'
                : nr.difficulty === 'Very Hard' ? '#c96e6e'
                : nr.difficulty === 'Hard' ? '#e38f09'
                : nr.difficulty === 'Medium' ? '#c9b882'
                : nr.difficulty === 'Easy' ? '#6ec9a0'
                : '#8a8a80'
              return (
                <Link key={nr.slug} href={`/restaurant/${nr.slug}`} className="nb-card">
                  <span className="nb-name">{nr.restaurant}</span>
                  {nr.difficulty && <span className="nb-badge" style={{color: badgeColor}}>{nr.difficulty}</span>}
                </Link>
              )
            })}
          </div>
        </div>
      )}
      {platformRestaurants.length > 0 && r.platform && (
        <div className="nb-section">
          <h2 className="nb-heading">More on {r.platform}</h2>
          <div className="nb-row">
            {platformRestaurants.map(nr => {
              const badgeColor =
                nr.difficulty === 'Extremely Hard' ? '#a855f7'
                : nr.difficulty === 'Very Hard' ? '#c96e6e'
                : nr.difficulty === 'Hard' ? '#e38f09'
                : nr.difficulty === 'Medium' ? '#c9b882'
                : nr.difficulty === 'Easy' ? '#6ec9a0'
                : '#8a8a80'
              return (
                <Link key={nr.slug} href={`/restaurant/${nr.slug}`} className="nb-card">
                  <span className="nb-name">{nr.restaurant}</span>
                  {nr.difficulty && <span className="nb-badge" style={{color: badgeColor}}>{nr.difficulty}</span>}
                </Link>
              )
            })}
          </div>
        </div>
      )}
      {r.platform && !['Walk-in', 'Phone', 'Phone/Relationships', 'CLOSED'].includes(r.platform) && (
        <div className="nb-cat-row">
          <Link href={`/platform/${slugify(r.platform)}`} className="nb-cat-link">
            View all {r.platform} restaurants on Scoopd →
          </Link>
        </div>
      )}
      <ScoopFooter />
    </main>
  )
}
