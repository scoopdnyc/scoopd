import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 3600

async function getRestaurant(slug) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
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
  const diffColor = r.difficulty === 'Very Hard' ? '#c96e6e' : r.difficulty === 'Hard' ? '#c9a96e' : '#6b6b60'

  return (
    <main style={{background:'#0f0f0d',minHeight:'100vh',color:'#e8e4dc',fontFamily:"'DM Sans', sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Mono:wght@300;400&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}body{background:#0f0f0d}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:1.25rem 2rem;border-bottom:0.5px solid #2a2a26}
        .logo{font-family:'Playfair Display',serif;font-size:22px;color:#e8e4dc;text-decoration:none}
        .nav-links{display:flex;gap:1.5rem;font-size:13px;color:#6b6b60}
        .nav-signup{color:#c9a96e;cursor:pointer}
        .back{display:inline-flex;align-items:center;gap:0.4rem;font-size:13px;color:#6b6b60;text-decoration:none;padding:1.5rem 2rem 0}
        .hero{padding:2rem 2rem 1.5rem;border-bottom:0.5px solid #2a2a26}
        .eyebrow{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;margin-bottom:0.75rem}
        .restaurant-name{font-family:'Playfair Display',serif;font-size:40px;line-height:1.1;color:#e8e4dc;margin-bottom:0.5rem}
        .restaurant-meta{font-size:14px;color:#6b6b60}
        .content{padding:2rem;display:grid;grid-template-columns:1fr 1fr;gap:1rem;max-width:800px}
        .info-card{background:#1a1a16;border:0.5px solid #2a2a26;border-radius:8px;padding:1.25rem}
        .info-label{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1.5px;color:#444440;text-transform:uppercase;margin-bottom:0.4rem}
        .info-value{font-size:15px;color:#e8e4dc;font-weight:500}
        .info-value.mono{font-family:'DM Mono',monospace;color:#c9a96e;font-size:18px}
        .info-value.na{color:#444440}
        .upsell{margin:0 2rem 2rem;background:#1a1a16;border:0.5px solid #2a2a26;border-left:2px solid #c9a96e;border-radius:8px;padding:1rem 1.25rem;font-size:13px;color:#6b6b60;display:flex;justify-content:space-between;align-items:center}
        .upsell-cta{color:#c9a96e;cursor:pointer;font-weight:500;white-space:nowrap;margin-left:1rem}
        .notes-card{margin:0 2rem 2rem;background:#1a1a16;border:0.5px solid #2a2a26;border-radius:8px;padding:1.25rem}
        .notes-label{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1.5px;color:#444440;text-transform:uppercase;margin-bottom:0.5rem}
        .notes-text{font-size:14px;color:#6b6b60;line-height:1.6}
        .closed-notice{margin:2rem;background:#1a0f0f;border:0.5px solid #3a1f1f;border-radius:8px;padding:1.25rem;font-size:14px;color:#c96e6e}
        .walkin-notice{margin:2rem;background:#0f1a16;border:0.5px solid #1f3a2a;border-radius:8px;padding:1.25rem;font-size:14px;color:#6ec9a0}
      `}</style>
      <nav className="nav">
        <Link href="/" className="logo">Scoopd</Link>
        <div className="nav-links"><span>Directory</span><span>How it works</span><span className="nav-signup">Sign up</span></div>
      </nav>
      <Link href="/" className="back">← Back to directory</Link>
      <div className="hero">
        <div className="eyebrow">{r.neighborhood} · {r.cuisine}</div>
        <h1 className="restaurant-name">{r.restaurant}</h1>
        <div className="restaurant-meta">{r.platform}{r.michelin_stars && r.michelin_stars !== '—' ? ` · ${r.michelin_stars}` : ''}{r.price_tier ? ` · ${r.price_tier}` : ''}</div>
      </div>
      {isClosed && <div className="closed-notice">This restaurant is permanently closed.</div>}
      {isWalkin && <div className="walkin-notice">Walk-in only — no reservations accepted. Arrive early.</div>}
      {!isClosed && <>
        <div className="content">
          <div className="info-card"><div className="info-label">Release Time</div><div className={`info-value ${r.release_time ? 'mono' : 'na'}`}>{r.release_time || (isWalkin ? 'Walk-in only' : isPhone ? 'Phone only' : 'TBD')}</div></div>
          <div className="info-card"><div className="info-label">Days Out</div><div className={`info-value ${r.stated_days_out ? 'mono' : 'na'}`}>{r.stated_days_out ? `${r.stated_days_out} days*` : (isWalkin ? '—' : 'TBD')}</div></div>
          <div className="info-card"><div className="info-label">Platform</div><div className="info-value">{r.platform || '—'}</div></div>
          <div className="info-card"><div className="info-label">Difficulty</div><div className="info-value" style={{color:diffColor}}>{r.difficulty || '—'}</div></div>
          {r.seat_count && <div className="info-card"><div className="info-label">Seats</div><div className="info-value">{r.seat_count}</div></div>}
          <div className="info-card"><div className="info-label">Confidence</div><div className="info-value" style={{fontSize:'13px'}}>{r.confidence || '—'}</div></div>
        </div>
        <div className="upsell"><span>* Release windows vary by platform — we do the math for you.</span><span className="upsell-cta">Unlock exact drop dates →</span></div>
        {r.notes && <div className="notes-card"><div className="notes-label">Notes</div><div className="notes-text">{r.notes}</div></div>}
      </>}
    </main>
  )
}
