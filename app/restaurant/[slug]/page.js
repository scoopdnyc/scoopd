import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import './restaurant.css'

export const revalidate = 3600

async function getRestaurant(slug) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('restaurant, neighborhood, platform, cuisine, release_time, observed_days, release_schedule, seat_count, michelin_stars, price_tier, difficulty, notes, slug')
    .eq('slug', slug)
    .single()
  if (error || !data) return null
  return data
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const r = await getRestaurant(slug)
  if (!r) return { title: 'Not Found' }
  return {
    title: `${r.restaurant} Reservation Tips | Scoopd`,
    description: `Find out exactly when ${r.restaurant} reservations drop in NYC. Release time, platform, and booking tips on Scoopd.`,
  }
}

export default async function RestaurantPage({ params }) {
  const { slug } = await params
  const r = await getRestaurant(slug)
  if (!r) notFound()

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

  return (
    <main style={{background:'#0f0f0d',minHeight:'100vh',color:'#e8e4dc',fontFamily:"var(--font-dm-sans), sans-serif"}}>
      <nav className="rp-nav">
        <Link href="/" className="rp-logo">Scoopd</Link>
        <div className="rp-nav-links">
          <Link href="/how-it-works" style={{color:'#8a8a80',textDecoration:'none'}}>How it works</Link>
          <Link href="/signup" className="rp-nav-signup">Sign up</Link>
        </div>
      </nav>
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
        {r.notes
          ? <div className="rp-description">{r.notes}</div>
          : autoSentence && <div className="rp-description">{autoSentence}</div>
        }
        <div className="rp-upsell"><span>* Release windows vary by platform — we do the math for you.</span><Link href="/signup" className="rp-upsell-cta">Unlock exact drop dates →</Link></div>
      </>}
    </main>
  )
}