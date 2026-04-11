import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import SignOutButton from './SignOutButton'
import ScoopNav from '../components/ScoopNav'
import ScoopFooter from '../components/ScoopFooter'

export const metadata = {
  title: 'My Account | Scoopd',
}

export default async function AccountPage() {
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, current_period_end, stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  const isActive = subscription?.status === 'active'

  const periodEnd = isActive && subscription.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : null

  return (
    <main style={{ background: '#0f0f0d', minHeight: '100vh', color: '#e8e4dc', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .ac-nav{display:flex;justify-content:space-between;align-items:center;padding:1.25rem 2rem;border-bottom:0.5px solid #2a2a26}
        .ac-logo{font-family:'Playfair Display',serif;font-size:22px;color:#e8e4dc;text-decoration:none}
        .ac-wrap{max-width:560px;margin:0 auto;padding:3rem 2rem}
        .ac-eyebrow{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;margin-bottom:0.75rem}
        .ac-headline{font-family:'Playfair Display',serif;font-size:32px;color:#e8e4dc;margin-bottom:2rem;line-height:1.2}
        .ac-card{background:#1a1a16;border:0.5px solid #2a2a26;border-radius:12px;padding:2rem;margin-bottom:1.25rem}
        .ac-card-label{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;color:#8a8a80;text-transform:uppercase;margin-bottom:0.5rem}
        .ac-card-value{font-size:15px;color:#e8e4dc}
        .ac-badge-active{display:inline-block;background:#0f2016;border:0.5px solid #1f4a2a;border-radius:20px;padding:0.25rem 0.85rem;font-size:12px;color:#6ec9a0;font-family:'DM Mono',monospace;letter-spacing:1px;margin-bottom:1.25rem}
        .ac-badge-inactive{display:inline-block;background:#1a1a10;border:0.5px solid #2a2a1a;border-radius:20px;padding:0.25rem 0.85rem;font-size:12px;color:#8a8a80;font-family:'DM Mono',monospace;letter-spacing:1px;margin-bottom:1.25rem}
        .ac-renews{font-size:13px;color:#8a8a80;margin-top:0.75rem}
        .ac-btn-gold{display:block;width:100%;background:#c9a96e;color:#0f0f0d;border:none;border-radius:8px;padding:0.9rem;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;text-align:center;text-decoration:none;transition:opacity 0.15s;margin-top:1.25rem;box-sizing:border-box}
        .ac-btn-gold:hover{opacity:0.9}
        .ac-btn-outline{display:block;width:100%;background:transparent;color:#8a8a80;border:0.5px solid #2a2a26;border-radius:8px;padding:0.9rem;font-size:14px;cursor:pointer;font-family:'DM Sans',sans-serif;text-align:center;text-decoration:none;transition:all 0.15s;margin-top:0.75rem;box-sizing:border-box}
        .ac-btn-outline:hover{border-color:#8a8a80;color:#e8e4dc}
        .ac-perks{list-style:none;padding:0;margin:1rem 0 0}
        .ac-perk{display:flex;align-items:flex-start;gap:0.75rem;margin-bottom:0.65rem;font-size:14px;color:#8a8a80;line-height:1.5}
        .ac-perk-dot{width:5px;height:5px;border-radius:50%;background:#c9a96e;margin-top:7px;flex-shrink:0}
        .ac-divider{border:none;border-top:0.5px solid #2a2a26;margin:1.75rem 0}
      `}</style>

      <ScoopNav />

      <div className="ac-wrap">
        <div className="ac-eyebrow">My Account</div>
        <h1 className="ac-headline">
          {isActive ? 'You\'re all set.' : 'Unlock drop dates.'}
        </h1>

        {/* Email + sign out */}
        <div className="ac-card">
          <div className="ac-card-label">Signed in as</div>
          <div className="ac-card-value">{user.email}</div>
          <hr className="ac-divider" />
          <SignOutButton />
        </div>

        {/* Subscription status */}
        {isActive ? (
          <div className="ac-card">
            <div className="ac-card-label">Subscription</div>
            <div className="ac-badge-active">PREMIUM ACTIVE</div>
            <div className="ac-card-value" style={{ fontSize: '14px', color: '#8a8a80', lineHeight: 1.6 }}>
              You have full access to exact drop dates across all restaurants on Scoopd.
            </div>
            {periodEnd && (
              <div className="ac-renews">Renews {periodEnd}</div>
            )}
            <form action="/api/stripe/portal" method="POST">
              <button type="submit" className="ac-btn-gold">Manage billing</button>
            </form>
          </div>
        ) : (
          <div className="ac-card">
            <div className="ac-card-label">Subscription</div>
            <div className="ac-badge-inactive">NOT SUBSCRIBED</div>
            <div className="ac-card-value" style={{ fontSize: '14px', color: '#8a8a80', lineHeight: 1.6 }}>
              Subscribe to unlock exact drop dates — no more math, no more guessing.
            </div>
            <ul className="ac-perks">
              <li className="ac-perk"><div className="ac-perk-dot"></div><span>Exact calculated drop dates for every restaurant</span></li>
              <li className="ac-perk"><div className="ac-perk-dot"></div><span>Coverage across Resy, OpenTable, DoorDash, and more</span></li>
              <li className="ac-perk"><div className="ac-perk-dot"></div><span>Monthly restaurant calendar drops (EMP, Per Se, Masa)</span></li>
              <li className="ac-perk"><div className="ac-perk-dot"></div><span>Plan by date — see what opens the night you want</span></li>
            </ul>
            <form action="/api/stripe/checkout" method="POST">
              <button type="submit" className="ac-btn-gold">Subscribe for $9.99/month</button>
            </form>
          </div>
        )}
      </div>
      <ScoopFooter />
    </main>
  )
}
