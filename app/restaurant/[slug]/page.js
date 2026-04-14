import { createSupabaseServer } from '../../../lib/supabase-server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ScoopNav from '../../components/ScoopNav'
import ScoopFooter from '../../components/ScoopFooter'
import './restaurant.css'

async function getRestaurant(slug, client) {
  const { data, error } = await client
    .from('restaurants')
    .select('restaurant, neighborhood, platform, cuisine, release_time, observed_days, release_schedule, seat_count, michelin_stars, price_tier, difficulty, notes, slug, address')
    .eq('slug', slug)
    .single()
  if (error || !data) return null
  return data
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const serverSupabase = await createSupabaseServer()
  const r = await getRestaurant(slug, serverSupabase)
  if (!r) return { title: 'Not Found' }

  const title = `${r.restaurant} Reservations — Drop Time & Booking Intelligence | Scoopd`

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
    openGraph: {
      title,
      description,
      url,
      siteName: 'Scoopd',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function RestaurantPage({ params }) {
  const { slug } = await params
  const serverSupabase = await createSupabaseServer()
  const r = await getRestaurant(slug, serverSupabase)
  if (!r) notFound()
  const { data: { user } } = await serverSupabase.auth.getUser()
  let isPremium = false
  if (user) {
    const { data: sub } = await serverSupabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single()
    isPremium = sub?.status === 'active'
  }

  // Calculate next drop date for premium users with rolling window restaurants
  let dropDateDisplay = null
  if (isPremium && r.observed_days) {
    const now = new Date()

    // Current ET time as 0-23 hour and minute
    const etTimeParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now)
    const etHour = parseInt(etTimeParts.find(p => p.type === 'hour').value, 10)
    const etMinute = parseInt(etTimeParts.find(p => p.type === 'minute').value, 10)

    // Parse release_time string e.g. "9:00 AM", "12:00 AM", "11:59 PM"
    let releaseHour = 0
    let releaseMinute = 0
    if (r.release_time) {
      const match = r.release_time.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
      if (match) {
        let h = parseInt(match[1], 10)
        const m = parseInt(match[2], 10)
        const meridiem = match[3].toUpperCase()
        if (meridiem === 'AM' && h === 12) h = 0
        else if (meridiem === 'PM' && h !== 12) h += 12
        releaseHour = h
        releaseMinute = m
      }
    }

    // Build ET calendar date as a local midnight Date (no timezone shift on output)
    const etDateParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now)
    const etYear  = parseInt(etDateParts.find(p => p.type === 'year').value, 10)
    const etMonth = parseInt(etDateParts.find(p => p.type === 'month').value, 10) - 1
    const etDay   = parseInt(etDateParts.find(p => p.type === 'day').value, 10)

    // If current ET time is before release time, the window hasn't advanced yet —
    // treat yesterday as the restaurant's current date
    const restaurantDate = new Date(etYear, etMonth, etDay)
    if (etHour * 60 + etMinute < releaseHour * 60 + releaseMinute) {
      restaurantDate.setDate(restaurantDate.getDate() - 1)
    }

    // Next bookable date = restaurant current date + observed_days - 1
    restaurantDate.setDate(restaurantDate.getDate() + r.observed_days - 1)

    const formatted = restaurantDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    dropDateDisplay = r.release_time ? `${formatted} at ${r.release_time} ET` : formatted
  }

  const isClosed = r.platform === 'CLOSED'
  const isWalkin = r.platform === 'Walk-in'
  const isPhone = r.platform === 'Phone' || r.platform === 'Phone/Relationships'

  const diffColor =
    r.difficulty === 'Extremely Hard' ? '#a855f7'
    : r.difficulty === 'Very Hard' ? '#c96e6e'
    : r.difficulty === 'Hard' ? '#e38f09'
    : r.difficulty === 'Medium' ? '#c9b882'
    : r.difficulty === 'Easy' ? '#6ec9a0'
    : '#8a8a80'

  // Days out display logic
  const daysOutValue = r.observed_days
    ? `${r.observed_days} days*`
    : r.release_schedule
    ? r.release_schedule
    : isWalkin
    ? '—'
    : '—'

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
  const postalCode = r.address ? (r.address.match(/\b\d{5}\b/) || [])[0] : undefined
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
  }

  return (
    <main style={{background:'#0f0f0d',minHeight:'100vh',color:'#e8e4dc',fontFamily:"var(--font-dm-sans), sans-serif"}}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ScoopNav />
      <Link href="/" className="rp-back">← Back to directory</Link>
      <div className="rp-hero">
        <div className="rp-eyebrow">{r.neighborhood} · {r.cuisine}</div>
        <h1 className="rp-restaurant-name">{r.restaurant}</h1>
        <div className="rp-restaurant-meta">{r.platform}{r.michelin_stars && r.michelin_stars !== '—' ? ` · ${r.michelin_stars}` : ''}{r.price_tier ? ` · ${r.price_tier}` : ''}</div>
      </div>
      {isClosed && <div className="rp-closed-notice">This restaurant is permanently closed.</div>}
      {isWalkin && <div className="rp-walkin-notice">Walk-in only — no reservations accepted. Arrive early.</div>}
      {!isClosed && <>
        <div className="rp-content">
          <div className="rp-info-card"><div className="rp-info-label">Release Time</div><div className={`rp-info-value ${r.release_time ? 'mono' : 'na'}`}>{r.release_time || (isWalkin ? 'Walk-in only' : isPhone ? 'Phone only' : '—')}</div></div>
          <div className="rp-info-card"><div className="rp-info-label">Days Out</div><div className={daysOutClass}>{daysOutValue}</div></div>
          <div className="rp-info-card"><div className="rp-info-label">Platform</div><div className="rp-info-value">{r.platform || '—'}</div></div>
          <div className="rp-info-card"><div className="rp-info-label">Difficulty</div><div className="rp-info-value" style={{color:diffColor}}>{r.difficulty || '—'}</div></div>
          <div className="rp-info-card"><div className="rp-info-label">Seats</div><div className={`rp-info-value ${r.seat_count ? '' : 'na'}`}>{r.seat_count || '—'}</div></div>
        </div>
                {!isWalkin && (
          isPremium && r.observed_days ? (
            <div className="rp-drop-card">
              <div className="rp-drop-label">Next Drop Date</div>
              <div style={{fontFamily:"'DM Mono',monospace",color:'#c9a96e',fontSize:'18px',fontWeight:400,letterSpacing:'0.5px',marginTop:'0.5rem'}}>
                {dropDateDisplay}
              </div>
            </div>
          ) : isPremium && r.release_schedule ? (
            <div className="rp-drop-card">
              <div className="rp-drop-label">Next Drop Date</div>
              <div style={{fontFamily:"'DM Mono',monospace",color:'#c9a96e',fontSize:'15px',fontWeight:400,letterSpacing:'0.5px',marginTop:'0.5rem'}}>
                {r.release_schedule}
              </div>
            </div>
          ) : (
            <div className="rp-drop-card">
              <div className="rp-drop-label">Next Drop Date</div>
              <div className="rp-drop-blurred">Tuesday, April 15 at 10:00 AM ET</div>
              <div className="rp-drop-overlay">
                <span className="rp-drop-lock">🔒</span>
                <span className="rp-drop-overlay-text">Sign up to unlock exact drop dates</span>
                <Link href="/signup" className="rp-drop-cta">Get access →</Link>
              </div>
            </div>
          )
        )}
        {r.notes
          ? <div className="rp-description">{r.notes}</div>
          : autoSentence && <div className="rp-description">{autoSentence}</div>
        }

      </>}
      <ScoopFooter />
    </main>
  )
}