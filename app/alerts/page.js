import { createSupabaseServer } from '../../lib/supabase-server'
import Link from 'next/link'
import ScoopNav from '../components/ScoopNav'
import ScoopFooter from '../components/ScoopFooter'

export const metadata = {
  title: 'The Dish — Drop Alerts',
  description: 'Get notified 5 minutes before a restaurant you\'re watching opens its reservation window. Coming soon to Scoopd.',
  alternates: { canonical: 'https://scoopd.nyc/alerts' },
}

export default async function AlertsPage() {
  const serverSupabase = await createSupabaseServer()
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

  return (
    <main style={{ background: '#0f0f0d', minHeight: '100vh', color: '#e8e4dc', fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`
        .td-wrap { max-width: 560px; margin: 0 auto; padding: 5rem 2rem; }
        .td-eyebrow { font-family: var(--font-dm-mono), monospace; font-size: 11px; letter-spacing: 2.5px; color: #c9a96e; text-transform: uppercase; margin-bottom: 1.25rem; }
        .td-headline { font-family: var(--font-playfair), serif; font-size: 48px; line-height: 1.05; color: #e8e4dc; margin: 0 0 1.5rem; }
        .td-sub { font-size: 16px; color: #8a8a80; line-height: 1.8; margin: 0 0 3rem; max-width: 480px; }
        .td-card { background: #1a1a16; border: 0.5px solid #2a2a26; border-radius: 12px; padding: 2rem; }
        .td-card-label { font-family: var(--font-dm-mono), monospace; font-size: 10px; letter-spacing: 2px; color: #6b6b60; text-transform: uppercase; margin-bottom: 1rem; }
        .td-lock { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
        .td-lock-icon { font-size: 20px; line-height: 1; flex-shrink: 0; margin-top: 2px; opacity: 0.5; }
        .td-lock-text { font-size: 14px; color: #8a8a80; line-height: 1.65; }
        .td-lock-text strong { color: #e8e4dc; font-weight: 600; }
        .td-divider { border: none; border-top: 0.5px solid #2a2a26; margin: 1.5rem 0; }
        .td-feature-list { list-style: none; padding: 0; margin: 0 0 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .td-feature { display: flex; gap: 0.75rem; font-size: 13px; color: #6b6b60; line-height: 1.5; align-items: flex-start; }
        .td-feature-arrow { color: #2a2a26; font-family: var(--font-dm-mono), monospace; font-size: 11px; flex-shrink: 0; margin-top: 1px; }
        .td-cta { display: inline-block; background: #c9a96e; color: #0f0f0d; border-radius: 8px; padding: 0.85rem 1.5rem; font-size: 14px; font-weight: 600; text-decoration: none; font-family: var(--font-dm-sans), sans-serif; transition: opacity 0.15s; }
        .td-cta:hover { opacity: 0.9; }
        .td-premium-note { font-size: 13px; color: #6b6b60; line-height: 1.6; }
        .td-premium-note strong { color: #c9a96e; }
      `}</style>

      <ScoopNav />

      <div className="td-wrap">
        <div className="td-eyebrow">The Dish</div>
        <h1 className="td-headline">Know before<br />the window opens.</h1>
        <p className="td-sub">
          Drop alerts fire 5 minutes before a restaurant you are watching opens its reservation window.
          No more setting alarms, refreshing at the wrong time, or missing a table by seconds.
        </p>

        <div className="td-card">
          <div className="td-card-label">Coming soon</div>

          <div className="td-lock">
            <span className="td-lock-icon">🔔</span>
            <div className="td-lock-text">
              <strong>Alerts are in development.</strong> When this launches, you will be able to watch any restaurant in the directory and get a notification the moment its next reservation window is about to open.
            </div>
          </div>

          <ul className="td-feature-list">
            <li className="td-feature">
              <span className="td-feature-arrow">→</span>
              Fires 5 minutes before the drop — enough time to be ready, not so early you forget
            </li>
            <li className="td-feature">
              <span className="td-feature-arrow">→</span>
              Watch any restaurant in the directory, unlimited alerts
            </li>
            <li className="td-feature">
              <span className="td-feature-arrow">→</span>
              Digest format — one email per release time, all your watched restaurants grouped together
            </li>
            <li className="td-feature">
              <span className="td-feature-arrow">→</span>
              Manage your watches from your account page
            </li>
          </ul>

          <hr className="td-divider" />

          {isPremium ? (
            <p className="td-premium-note">
              <strong>You will have access.</strong> Alerts are a premium feature and your subscription covers it.
              When this goes live you will be able to set up watches directly from any restaurant page.
            </p>
          ) : user ? (
            <>
              <p className="td-premium-note" style={{ marginBottom: '1.25rem' }}>
                Alerts are a premium feature. Subscribe now and you will have access the day this launches.
              </p>
              <Link href="/account" className="td-cta">View subscription options</Link>
            </>
          ) : (
            <>
              <p className="td-premium-note" style={{ marginBottom: '1.25rem' }}>
                Alerts are a premium feature. Create an account and subscribe to get access when this launches.
              </p>
              <Link href="/register" className="td-cta">Create an account</Link>
            </>
          )}
        </div>
      </div>
      <ScoopFooter />
    </main>
  )
}
