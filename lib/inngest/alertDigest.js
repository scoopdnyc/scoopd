import { createClient } from '@supabase/supabase-js'
import { inngest } from '../inngest'
import { sendAlertDigest } from '../email/alertDigest'

function releaseTimeToMinutes(str) {
  if (!str) return null
  const m = str.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
  if (!m) return null
  let h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  const meridiem = m[3].toUpperCase()
  if (meridiem === 'AM' && h === 12) h = 0
  else if (meridiem === 'PM' && h !== 12) h += 12
  return h * 60 + min
}

function nowETParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: 'numeric', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now)
  const get = t => parts.find(p => p.type === t).value
  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    hour: parseInt(get('hour'), 10),
    minute: parseInt(get('minute'), 10),
  }
}

export const alertDigest = inngest.createFunction(
  { id: 'alert-digest', triggers: [{ cron: '*/5 * * * *' }] },
  async ({ step }) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // --- Step 1: Find restaurants firing in (now, now+5min] ET ---
    const candidates = await step.run('find-firing-restaurants', async () => {
      const et = nowETParts()
      const nowMinutes = et.hour * 60 + et.minute

      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('slug, restaurant, neighborhood, platform, release_time, observed_days')
        .not('release_time', 'is', null)
        .not('platform', 'eq', 'CLOSED')
        .not('platform', 'eq', 'Walk-in')
      if (error) throw new Error(`restaurants fetch: ${error.message}`)

      return (restaurants || [])
        .map(r => ({ ...r, release_minutes: releaseTimeToMinutes(r.release_time) }))
        .filter(r => r.release_minutes != null && r.release_minutes > nowMinutes && r.release_minutes <= nowMinutes + 5)
    })

    if (candidates.length === 0) return { firing: 0, sent: 0 }

    // --- Step 2: Build per-user send plan ---
    const sendPlan = await step.run('build-send-plan', async () => {
      const slugs = candidates.map(r => r.slug)
      const { data: alertRows, error: aerr } = await supabase
        .from('alerts')
        .select('user_id, restaurant_slug')
        .in('restaurant_slug', slugs)
      if (aerr) throw new Error(`alerts fetch: ${aerr.message}`)
      if (!alertRows?.length) return []

      const userIds = [...new Set(alertRows.map(a => a.user_id))]

      const { data: subs, error: serr } = await supabase
        .from('subscriptions')
        .select('user_id, status')
        .in('user_id', userIds)
        .eq('status', 'active')
      if (serr) throw new Error(`subs fetch: ${serr.message}`)
      const activeUserIds = new Set((subs || []).map(s => s.user_id))

      const et = nowETParts()
      const dateStr = `${et.year}-${String(et.month).padStart(2, '0')}-${String(et.day).padStart(2, '0')}`

      const byUser = new Map()
      for (const a of alertRows) {
        if (!activeUserIds.has(a.user_id)) continue
        const r = candidates.find(c => c.slug === a.restaurant_slug)
        if (!r) continue

        const hh = Math.floor(r.release_minutes / 60)
        const mm = r.release_minutes % 60
        const timeStr = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
        const window_key = `${dateStr} ${timeStr}`

        const key = `${a.user_id}|${window_key}`
        if (!byUser.has(key)) {
          byUser.set(key, { user_id: a.user_id, window_key, restaurants: [] })
        }
        byUser.get(key).restaurants.push(r)
      }

      const out = []
      for (const entry of byUser.values()) {
        const { data: u, error: uerr } = await supabase.auth.admin.getUserById(entry.user_id)
        if (uerr) {
          console.error(`[alert-digest] user lookup failed: ${uerr.message}`)
          continue
        }
        const email = u?.user?.email
        if (!email) continue
        out.push({ ...entry, email })
      }
      return out
    })

    if (sendPlan.length === 0) return { firing: candidates.length, sent: 0 }

    // --- Step 3: Insert dedup row, then send. Roll back log on failure. ---
    const sent = await step.run('send-and-log', async () => {
      let count = 0
      for (const plan of sendPlan) {
        const slugs = plan.restaurants.map(r => r.slug)
        const { data: inserted, error: ierr } = await supabase
          .from('alert_log')
          .insert({
            user_id: plan.user_id,
            release_window_key: plan.window_key,
            restaurant_slugs: slugs,
            email: plan.email,
          })
          .select('id')
          .single()

        if (ierr) {
          if (ierr.code === '23505') continue
          console.error(`[alert-digest] log insert error: ${ierr.message}`)
          continue
        }
        if (!inserted) continue

        const res = await sendAlertDigest({
          to: plan.email,
          restaurants: plan.restaurants,
        })
        if (!res.ok) {
          await supabase.from('alert_log').delete().eq('id', inserted.id)
          console.error(`[alert-digest] send failed for ${plan.email}: ${res.error}`)
          continue
        }
        count++
      }
      return count
    })

    return { firing: candidates.length, sent }
  }
)
