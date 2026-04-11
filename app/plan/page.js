import { createSupabaseServer } from '../../lib/supabase-server'
import Link from 'next/link'
import ScoopNav from '../components/ScoopNav'
import ScoopFooter from '../components/ScoopFooter'
import PlanClient from './PlanClient'
import './plan.css'

export const metadata = {
  title: 'Plan by Date | Scoopd',
  description: 'Enter a target dinner date and see every NYC restaurant whose reservation window hasn\'t opened yet — and exactly when it will.',
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default async function PlanPage() {
  const serverSupabase = await createSupabaseServer()

  const [{ data: restaurants }, { data: { user } }] = await Promise.all([
    serverSupabase
      .from('restaurants')
      .select('restaurant, slug, neighborhood, platform, release_time, observed_days, difficulty')
      .neq('platform', 'CLOSED')
      .neq('platform', 'Walk-in')
      .neq('platform', 'Phone')
      .neq('platform', 'Phone/Relationships')
      .not('observed_days', 'is', null)
      .not('release_time', 'is', null)
      .neq('release_time', '—'),
    serverSupabase.auth.getUser(),
  ])

  let isPremium = false
  if (user) {
    const { data: sub } = await serverSupabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single()
    isPremium = sub?.status === 'active'
  }

  // Current ET time
  const now = new Date()
  const etTimeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const etHour = parseInt(etTimeParts.find(p => p.type === 'hour').value, 10)
  const etMinute = parseInt(etTimeParts.find(p => p.type === 'minute').value, 10)
  const currentETMinutes = etHour * 60 + etMinute

  // Current ET calendar date
  const etDateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const etYear  = parseInt(etDateParts.find(p => p.type === 'year').value, 10)
  const etMonth = parseInt(etDateParts.find(p => p.type === 'month').value, 10) - 1
  const etDay   = parseInt(etDateParts.find(p => p.type === 'day').value, 10)

  // Default: 2 weeks from today in ET; min: tomorrow in ET
  const etToday = new Date(etYear, etMonth, etDay)
  const defaultDate = toDateStr(new Date(etYear, etMonth, etDay + 14))
  const minDate = toDateStr(new Date(etYear, etMonth, etDay + 1))

  return (
    <main style={{ background: '#0f0f0d', minHeight: '100vh', color: '#e8e4dc', fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <ScoopNav />

      <PlanClient
        restaurants={restaurants || []}
        isPremium={isPremium}
        defaultDate={defaultDate}
        minDate={minDate}
        etYear={etYear}
        etMonth={etMonth}
        etDay={etDay}
        currentETMinutes={currentETMinutes}
      />
      <ScoopFooter />
    </main>
  )
}
