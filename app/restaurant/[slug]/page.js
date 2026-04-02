import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import './restaurant.css'

export const revalidate = 3600

async function getRestaurant(slug) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('restaurant, neighborhood, platform, cuisine, release_time, stated_days_out, seat_count, michelin_stars, price_tier, difficulty, slug')
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
  const diffColor = r.difficulty === 'Very Hard' ? '#c96e6e' : r.difficulty === 'Hard' ? '#c9a96e' : '#8a8a80'

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
          <div className="rp-info-card"><div className="rp-info-label">Release Time</div><div className={`rp-info-value ${r.release_time ? 'mono' : 'na'}`}>{r.release_time || (isWalkin ? 'Walk-in only' : isPhone ? 'Phone only' : 'TBD')}</div></div>
          <div className="rp-info-card"><div className="rp-info-label">Days Out</div><div className={`rp-info-value ${r.stated_days_out ? 'mono' : 'na'}`}>{r.stated_days_out ? `${r.stated_days_out} days*` : (isWalkin ? '—' : 'TBD')}</div></div>
          <div className="rp-info-card"><div className="rp-info-label">Platform</div><div className="rp-info-value">{r.platform || '—'}</div></div>
          <div className="rp-info-card"><div className="rp-info-label">Difficulty</div><div className="rp-info-value" style={{color:diffColor}}>{r.difficulty || '—'}</div></div>
          <div className="rp-info-card"><div className="rp-info-label">Seats</div><div className={`rp-info-value ${r.seat_count ? '' : 'na'}`}>{r.seat_count || '—'}</div></div>
        </div>
        <div className="rp-upsell"><span>* Release windows vary by platform — we do the math for you.</span><Link href="/signup" className="rp-upsell-cta">Unlock exact drop dates →</Link></div>
      </>}
    </main>
  )
}