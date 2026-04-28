import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseStatic } from '@/lib/supabase-static'
import { computeNextDropDate } from '@/lib/dropDate'
import Link from 'next/link'
import ScoopNav from '../components/ScoopNav'
import ScoopFooter from '../components/ScoopFooter'
import AlertsList from './AlertsList'

export const metadata = {
  title: 'The Dish: Drop Alerts',
  description: 'Get notified 5 minutes before a restaurant you are watching opens its reservation window.',
  alternates: { canonical: 'https://scoopd.nyc/alerts' },
}

export const dynamic = 'force-dynamic'

export default async function AlertsPage() {
  const serverSupabase = await createSupabaseServer()
  const { data: { user } } = await serverSupabase.auth.getUser()

  let isPremium = false
  let alertRows = []

  if (user) {
    const { data: sub } = await serverSupabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single()
    isPremium = sub?.status === 'active'

    if (isPremium) {
      const { data: alerts } = await serverSupabase
        .from('alerts')
        .select('restaurant_slug, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const slugs = (alerts || []).map(a => a.restaurant_slug)
      if (slugs.length) {
        const stat = createSupabaseStatic()
        const { data: restaurants } = await stat
          .from('restaurants')
          .select('slug, restaurant, neighborhood, platform, release_time, observed_days, release_schedule')
          .in('slug', slugs)
        const byslug = new Map((restaurants || []).map(r => [r.slug, r]))
        alertRows = slugs
          .map(slug => byslug.get(slug))
          .filter(Boolean)
          .map(r => {
            const { display: dropDate } = computeNextDropDate(r)
            return { ...r, dropDate }
          })
      }
    }
  }

  return (
    <main style={{ background: '#0f0f0d', minHeight: '100vh', color: '#e8e4dc', fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`
        .td-wrap { max-width: 720px; margin: 0 auto; padding: 4rem 2rem; }
        .td-eyebrow { font-family: var(--font-dm-mono), monospace; font-size: 11px; letter-spacing: 2.5px; color: #c9a96e; text-transform: uppercase; margin-bottom: 1.25rem; }
        .td-headline { font-family: var(--font-playfair), serif; font-size: 40px; line-height: 1.1; color: #e8e4dc; margin: 0 0 1.25rem; }
        .td-sub { font-size: 15px; color: #8a8a80; line-height: 1.7; margin: 0 0 2.5rem; max-width: 520px; }
        .td-card { background: #1a1a16; border: 0.5px solid #2a2a26; border-radius: 12px; padding: 2rem; }
        .td-list { padding: 0.5rem 1.5rem; }
        .td-empty { font-size: 15px; color: #8a8a80; line-height: 1.7; }
        .td-empty strong { color: #e8e4dc; font-weight: 600; }
        .td-cta { display: inline-block; background: #c9a96e; color: #0f0f0d; border-radius: 8px; padding: 0.85rem 1.5rem; font-size: 14px; font-weight: 600; text-decoration: none; margin-top: 1rem; transition: opacity 0.15s; }
        .td-cta:hover { opacity: 0.9; }
        .td-row { display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center; padding: 1.25rem 0; border-bottom: 0.5px solid #2a2a26; }
        .td-row:last-child { border-bottom: none; }
        .td-row-main { min-width: 0; }
        .td-row-meta { font-family: var(--font-dm-mono), monospace; font-size: 11px; color: #6b6b60; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 0.4rem; }
        .td-row-name { font-family: var(--font-playfair), serif; font-size: 20px; color: #e8e4dc; text-decoration: none; }
        .td-row-name:hover { color: #c9a96e; }
        .td-row-date { font-family: var(--font-dm-mono), monospace; font-size: 12px; color: #c9a96e; margin-top: 0.45rem; letter-spacing: 0.5px; }
        .td-row-date.muted { color: #6b6b60; }
        .td-remove { background: transparent; border: 0.5px solid #c9a96e; color: #c9a96e; padding: 0.5rem 0.85rem; border-radius: 999px; cursor: pointer; font-family: var(--font-dm-sans), sans-serif; font-size: 12px; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 0.4rem; transition: opacity 0.15s; }
        .td-remove:hover { opacity: 0.85; }
        .td-lock-card { text-align: center; padding: 2.5rem 2rem; }
        .td-lock-icon { font-size: 24px; margin-bottom: 1rem; opacity: 0.6; }
      `}</style>

      <ScoopNav />

      <div className="td-wrap">
        <div className="td-eyebrow">The Dish</div>
        <h1 className="td-headline">Drop alerts.</h1>
        <p className="td-sub">
          Five minutes before a restaurant you are watching opens its reservation window, you get a digest email. One per release time. All your watched restaurants grouped together.
        </p>

        {!user && (
          <div className="td-card td-lock-card">
            <div className="td-lock-icon">🔒</div>
            <p className="td-empty"><strong>Drop alerts are a premium feature.</strong></p>
            <Link href="/signup" className="td-cta">Get access</Link>
          </div>
        )}

        {user && !isPremium && (
          <div className="td-card td-lock-card">
            <div className="td-lock-icon">🔒</div>
            <p className="td-empty"><strong>Subscribe to set drop alerts.</strong></p>
            <Link href="/account" className="td-cta">View subscription</Link>
          </div>
        )}

        {isPremium && alertRows.length === 0 && (
          <div className="td-card">
            <p className="td-empty">No alerts yet. Find a restaurant and hit the bell.</p>
            <Link href="/" className="td-cta">Browse restaurants</Link>
          </div>
        )}

        {isPremium && alertRows.length > 0 && <AlertsList rows={alertRows} />}
      </div>
      <ScoopFooter />
    </main>
  )
}
