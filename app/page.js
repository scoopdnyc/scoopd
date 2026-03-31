import { supabase } from '../lib/supabase'
import Link from 'next/link'

export const revalidate = 3600

async function getRestaurants() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('notify_demand', { ascending: false })
  if (error) console.error(error)
  return data || []
}

export default async function Home() {
  const restaurants = await getRestaurants()

  return (
    <main style={{
      background: '#0f0f0d',
      minHeight: '100vh',
      color: '#e8e4dc',
      fontFamily: "'DM Sans', sans-serif",
      padding: '0',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Mono:wght@300;400&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f0f0d; }
        .nav { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 2rem; border-bottom: 0.5px solid #2a2a26; }
        .logo { font-family: 'Playfair Display', serif; font-size: 22px; color: #e8e4dc; text-decoration: none; }
        .nav-links { display: flex; gap: 1.5rem; font-size: 13px; color: #8a8a80; }
        .hero { padding: 3rem 2rem 2rem; }
        .eyebrow { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 2px; color: #c9a96e; text-transform: uppercase; margin-bottom: 0.75rem; }
        .headline { font-family: 'Playfair Display', serif; font-size: 48px; line-height: 1.1; color: #e8e4dc; margin-bottom: 1rem; }
        .sub { font-size: 15px; color: #8a8a80; line-height: 1.6; max-width: 500px; }
        .search-wrap { padding: 1.5rem 2rem; }
        .search-box { background: #1a1a16; border: 0.5px solid #2a2a26; border-radius: 8px; padding: 0.75rem 1rem; display: flex; gap: 1rem; align-items: center; max-width: 700px; }
        .search-box input { background: none; border: none; color: #e8e4dc; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; flex: 1; }
        .search-box input::placeholder { color: #6b6b60; }
        .filters { display: flex; gap: 0.5rem; padding: 0 2rem 1.5rem; flex-wrap: wrap; }
        .filter-btn { font-size: 12px; padding: 5px 14px; border-radius: 20px; border: 0.5px solid #2a2a26; color: #6b6b60; background: transparent; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .filter-btn.active { border-color: #c9a96e; color: #c9a96e; }
        .section-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 2px; color: #a8a49c; text-transform: uppercase; padding: 0 2rem 1rem; }
        .restaurant-list { padding: 0 2rem; }
        .card { background: #1a1a16; border: 0.5px solid #2a2a26; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 0.5rem; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 1rem; text-decoration: none; color: inherit; transition: border-color 0.15s; }
        .card:hover { border-color: #3a3a32; }
        .restaurant-name { font-size: 15px; font-weight: 500; color: #e8e4dc; margin-bottom: 3px; }
        .restaurant-meta { font-size: 12px; color: #8a8a80; }
        .card-right { text-align: right; }
        .release-time { font-family: 'DM Mono', monospace; font-size: 13px; color: #c9a96e; }
        .days-out { font-size: 11px; color: #a8a49c; margin-top: 2px; }
        .badge { display: inline-block; font-size: 10px; padding: 2px 7px; border-radius: 4px; margin-left: 6px; font-family: 'DM Mono', monospace; }
        .badge-vh { background: #2a0f0f; color: #c96e6e; }
        .badge-h { background: #2a1f0f; color: #c9a96e; }
        .badge-m { background: #1a1a16; color: #6b6b60; border: 0.5px solid #2a2a26; }
        .upsell { margin: 2rem; background: #1a1a16; border: 0.5px solid #2a2a26; border-left: 2px solid #c9a96e; border-radius: 8px; padding: 1rem 1.25rem; font-size: 13px; color: #8a8a80; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
        .upsell-cta { color: #c9a96e; font-weight: 500; white-space: nowrap; text-decoration: none; }
        .closed-badge { display: inline-block; font-size: 10px; padding: 2px 7px; border-radius: 4px; margin-left: 6px; background: #1a1a16; color: #6b6b60; border: 0.5px solid #2a2a26; font-family: 'DM Mono', monospace; }
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo">Scoopd</Link>
        <div className="nav-links">
          <Link href="/how-it-works" style={{color:'#8a8a80', textDecoration:'none'}}>How it works</Link>
          <Link href="/signup" style={{color:'#c9a96e', textDecoration:'none'}}>Sign up</Link>
        </div>
      </nav>

      <div className="hero">
        <div className="eyebrow">NYC Reservation Intelligence</div>
        <h1 className="headline">Know when<br />tables drop.</h1>
        <p className="sub">The exact moment reservations open at NYC's hardest tables. No bots. No brokers. Just intelligence.*</p>
      </div>

      <div className="search-wrap">
        <div className="search-box">
          <span style={{color: '#6b6b60', fontSize: '16px'}}>⌕</span>
          <input placeholder="Search restaurants, neighborhoods, cuisine..." id="search-input" />
        </div>
      </div>

      <div className="filters">
        <button className="filter-btn active" data-filter="all">All</button>
        <button className="filter-btn" data-filter="West Village">West Village</button>
        <button className="filter-btn" data-filter="Williamsburg">Williamsburg</button>
        <button className="filter-btn" data-filter="Lower East Side">Lower East Side</button>
        <button className="filter-btn" data-filter="Omakase">Omakase</button>
        <button className="filter-btn" data-filter="Italian">Italian</button>
      </div>

      <div className="section-label">All restaurants</div>

      <div className="restaurant-list" id="restaurant-list">
        {restaurants.map((r) => {
          if (!r.slug) return null
          const badgeClass = r.difficulty === 'Very Hard' ? 'badge badge-vh' : r.difficulty === 'Hard' ? 'badge badge-h' : 'badge badge-m'
          const isClosed = r.platform === 'CLOSED'
          return (
            <Link key={r.id} href={`/restaurant/${r.slug}`} className="card">
              <div>
                <div className="restaurant-name">
                  {r.restaurant}
                  {isClosed
                    ? <span className="closed-badge">Closed</span>
                    : r.difficulty && <span className={badgeClass}>{r.difficulty}</span>
                  }
                </div>
                <div className="restaurant-meta">
                  {[r.neighborhood, r.cuisine, r.platform].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="card-right">
                <div className="release-time">{r.release_time || '—'}</div>
                <div className="days-out">{r.stated_days_out ? `${r.stated_days_out} days out*` : r.platform === 'Walk-in' ? 'Walk-in only' : '—'}</div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="upsell">
        <span>* Release windows vary by platform — we do the math for you.</span>
        <Link href="/signup" className="upsell-cta">Unlock exact drop dates →</Link>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        const input = document.getElementById('search-input');
        const cards = document.querySelectorAll('.card');
        input.addEventListener('input', () => {
          const q = input.value.toLowerCase();
          cards.forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(q) ? 'grid' : 'none';
          });
        });
        document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const f = btn.dataset.filter;
            cards.forEach(card => {
              card.style.display = (f === 'all' || card.textContent.includes(f)) ? 'grid' : 'none';
            });
          });
        });
      `}} />
    </main>
  )
}