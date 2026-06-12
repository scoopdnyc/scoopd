import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase-server'
import { extendAccess } from '@/lib/access'
import SignOutButton from './SignOutButton'
import StripeSuccessEvent from './StripeSuccessEvent'
import EarningActions from './EarningActions'
import ScoopNav from '../components/ScoopNav'
import ScoopFooter from '../components/ScoopFooter'
import CopyButton from '../components/CopyButton'

export const metadata = {
  title: 'My Account',
  alternates: { canonical: 'https://scoopd.nyc/account' },
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export default async function AccountPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceClient = getServiceClient()

  // Log daily login — deduplicated by 23-hour window
  const recentCutoff = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
  const { data: recentLogin } = await serviceClient
    .from('user_actions')
    .select('id')
    .eq('user_id', user.id)
    .eq('action_type', 'daily_login')
    .gte('created_at', recentCutoff)
    .maybeSingle()
  if (!recentLogin) {
    await serviceClient.from('user_actions').insert({ user_id: user.id, action_type: 'daily_login' })
  }

  // Fetch all account data in parallel
  const [
    { data: subscription },
    { count: clickCount },
    { count: referralCount },
    { data: socialFollowAction },
    { data: loginActions },
  ] = await Promise.all([
    supabase.from('subscriptions').select('status, current_period_end, referral_code').eq('user_id', user.id).single(),
    supabase.from('user_actions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('action_type', 'click_through'),
    supabase.from('user_actions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('action_type', 'referral_converted'),
    supabase.from('user_actions').select('id').eq('user_id', user.id).eq('action_type', 'social_follow').maybeSingle(),
    supabase.from('user_actions').select('created_at').eq('user_id', user.id).eq('action_type', 'daily_login')
      .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false }),
  ])

  // Calculate login streak (ET days, consecutive back from today)
  const loginDays = new Set(
    (loginActions || []).map(a =>
      new Date(a.created_at).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    )
  )
  let streak = 0
  for (let i = 0; i < 14; i++) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    if (loginDays.has(d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }))) {
      streak++
    } else if (i === 0) {
      continue // today not yet in set (race with insert above) — don't break streak
    } else {
      break
    }
  }

  // Fire streak reward if newly at 7
  let streakRewardFired = false
  if (streak >= 7) {
    const { data: recentStreakReward } = await serviceClient
      .from('user_actions')
      .select('id')
      .eq('user_id', user.id)
      .eq('action_type', 'login_streak_7')
      .gte('created_at', new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle()
    if (!recentStreakReward) {
      extendAccess(user.id, 14, 'login_streak_7').catch(() => {})
    }
    streakRewardFired = true
  }

  const isActive = subscription?.status === 'active'

  const daysRemaining = subscription?.current_period_end
    ? Math.max(0, Math.ceil((new Date(subscription.current_period_end) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0

  const referralLink = subscription?.referral_code
    ? `https://scoopd.nyc/signup?ref=${subscription.referral_code}`
    : null

  return (
    <main style={{ background: '#0f0f0d', minHeight: '100vh', color: '#e8e4dc', fontFamily: "'DM Sans', sans-serif" }}>
      <Suspense><StripeSuccessEvent /></Suspense>
      <style>{`
        .ac-wrap{max-width:560px;margin:0 auto;padding:3rem 2rem}
        .ac-eyebrow{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;color:#c9a96e;text-transform:uppercase;margin-bottom:0.75rem}
        .ac-headline{font-family:'Playfair Display',serif;font-size:32px;color:#e8e4dc;margin-bottom:2rem;line-height:1.2}
        .ac-card{background:#1a1a16;border:0.5px solid #2a2a26;border-radius:12px;padding:2rem;margin-bottom:1.25rem}
        .ac-card-label{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;color:#8a8a80;text-transform:uppercase;margin-bottom:0.75rem}
        .ac-card-value{font-size:15px;color:#e8e4dc}
        .ac-badge-active{display:inline-block;background:#0f2016;border:0.5px solid #1f4a2a;border-radius:20px;padding:0.25rem 0.85rem;font-size:12px;color:#6ec9a0;font-family:'DM Mono',monospace;letter-spacing:1px;margin-bottom:1.25rem}
        .ac-badge-inactive{display:inline-block;background:#1a1a10;border:0.5px solid #2a2a1a;border-radius:20px;padding:0.25rem 0.85rem;font-size:12px;color:#8a8a80;font-family:'DM Mono',monospace;letter-spacing:1px;margin-bottom:1.25rem}
        .ac-renews{font-size:13px;color:#8a8a80;margin-top:0.75rem}
        .ac-btn-outline{display:block;width:100%;background:transparent;color:#8a8a80;border:0.5px solid #2a2a26;border-radius:8px;padding:0.9rem;font-size:14px;cursor:pointer;font-family:'DM Sans',sans-serif;text-align:center;text-decoration:none;transition:all 0.15s;margin-top:0.75rem;box-sizing:border-box}
        .ac-btn-outline:hover{border-color:#8a8a80;color:#e8e4dc}
        .ac-divider{border:none;border-top:0.5px solid #2a2a26;margin:1.75rem 0}
        .ac-stat-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:0.5rem;font-size:14px}
        .ac-stat-label{color:#8a8a80}
        .ac-stat-value{color:#e8e4dc;font-family:'DM Mono',monospace;font-size:13px}
        .ac-ref-row{display:flex;gap:0.5rem;align-items:center;margin-top:0.5rem}
        .ac-ref-code{flex:1;background:#0f0f0d;border:0.5px solid #2a2a26;border-radius:6px;padding:0.5rem 0.75rem;font-size:12px;color:#c9a96e;font-family:'DM Mono',monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .ac-copy-btn{background:#c9a96e;color:#0f0f0d;border:none;border-radius:6px;padding:0.5rem 0.9rem;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap;transition:opacity 0.15s}
        .ac-copy-btn:hover{opacity:0.85}
        .ac-action-row{display:flex;justify-content:space-between;align-items:flex-start;padding:0.85rem 0;border-bottom:0.5px solid #1e1e1a}
        .ac-action-row:last-child{border-bottom:none}
        .ac-action-name{font-size:14px;color:#8a8a80}
        .ac-action-status-available{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;color:#c9a96e;white-space:nowrap}
        .ac-action-status-done{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;color:#6ec9a0;white-space:nowrap}
        .ac-social-link{font-size:13px;color:#c9a96e;text-decoration:none;font-family:'DM Mono',monospace;letter-spacing:0.5px}
        .ac-social-link:hover{opacity:0.8}
      `}</style>

      <ScoopNav />

      <div className="ac-wrap">
        <div className="ac-eyebrow">My Account</div>
        <h1 className="ac-headline">
          {isActive ? "You're all set." : 'Unlock drop dates.'}
        </h1>

        {/* Email + sign out */}
        <div className="ac-card">
          <div className="ac-card-label">Signed in as</div>
          <div className="ac-card-value">{user.email}</div>
          <hr className="ac-divider" />
          <SignOutButton />
        </div>

        {/* Access status */}
        <div className="ac-card">
          <div className="ac-card-label">Access</div>
          {isActive
            ? <div className="ac-badge-active">ACTIVE</div>
            : <div className="ac-badge-inactive">INACTIVE</div>
          }
          <div className="ac-stat-row">
            <span className="ac-stat-label">Days remaining</span>
            <span className="ac-stat-value">{daysRemaining}</span>
          </div>
          <div className="ac-stat-row">
            <span className="ac-stat-label">Availability checks</span>
            <span className="ac-stat-value">{clickCount ?? 0}</span>
          </div>
          <div className="ac-renews" style={{ marginTop: '1rem' }}>Free access period. No billing required.</div>
          <Link href="/alerts" className="ac-btn-outline" style={{ marginTop: '1.25rem' }}>Manage drop alerts →</Link>
        </div>

        {/* Earning actions (client component — social follow click tracking + streak display) */}
        <EarningActions
          referralLink={referralLink}
          socialFollowed={!!socialFollowAction}
          streak={streak}
          streakRewardFired={streakRewardFired}
        />
      </div>
      <ScoopFooter />
    </main>
  )
}
