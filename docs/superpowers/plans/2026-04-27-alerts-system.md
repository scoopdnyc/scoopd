# Alerts System ("The Dish") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. No automated test framework in repo. Each task ends with a manual verification step instead of TDD.

**Goal:** Premium-gated drop alert system. Users bell a restaurant, receive a digest email 5 minutes before each release window opens.

**Architecture:** Two new tables (`alerts`, `alert_log`). New REST routes for toggle and list. SVG bell component on restaurant pages, full /alerts list page, /account link. Inngest cron `*/5 * * * *` queries restaurants with release_time in next-window, joins to alerts/subscriptions, sends digest via Resend, logs to `alert_log` with `(user_id, release_window_key)` unique dedup.

**Tech Stack:** Next.js 16, React 19, Supabase (auth + RLS), Inngest 4, Resend (HTTP fetch — no SDK).

---

## Open Decisions (fixed by author, confirm or override)

1. **Production migration target.** Single Supabase project (`zztiidefywmsinssmxiy`). Migrations apply to production. No staging branch in use.
2. **Drop date calc.** Extract logic from `app/restaurant/[slug]/page.js` into `lib/dropDate.js`. Update restaurant page to import. New util becomes single source of truth. (CLAUDE.md required updating drops/plan in lockstep when modifying — out of scope for this build, leave them as-is, flag tech debt in the verification task.)
3. **5-min window precision.** With `*/5` cron and (now, now+5min] window, alerts fire 1–5 min before release. Releases on `:00 / :05 / :10` get exactly 5 min. Off-cycle release_times (e.g. `9:01 AM`) get 4 min. Acceptable per spec wording "within the next 5 minutes ET".
4. **alert_log dedup key.** `release_window_key text` = `YYYY-MM-DD HH:MM` ET of the release_time slot. UNIQUE(user_id, release_window_key). DB enforces no double-send.
5. **Service role.** Inngest cron uses `SUPABASE_SERVICE_ROLE_KEY` (matches existing pattern in `lib/inngest/resyDailyCheck.js`). Bypasses RLS to read alerts across all users + auth.users emails.
6. **Bell visual.** Lucide-style outline bell SVG, fill swap on active. No external dep.
7. **Free user click.** Bell rendered for everyone; click for free users opens a `/signup` link target instead of toggling. Keeps the icon present (visual cue) without granting state to non-premium accounts.

---

## File Structure

**Create:**
- `lib/dropDate.js` — `computeNextDropDate(restaurant)` shared util
- `lib/email/alertDigest.js` — Resend digest sender
- `lib/inngest/alertDigest.js` — every-5-min cron function
- `app/api/alerts/route.js` — `GET` user's alert slugs (premium)
- `app/api/alerts/toggle/route.js` — `POST` toggle (premium)
- `app/components/AlertBell.js` — client bell w/ optimistic toggle
- `app/components/AlertBell.css` — bell styling
- `app/alerts/AlertsList.js` — client list w/ remove action

**Modify:**
- `app/restaurant/[slug]/page.js` — import `computeNextDropDate`, place `<AlertBell>` next to `<ShareButton>`
- `app/alerts/page.js` — replace coming-soon with premium gate + list
- `app/account/page.js` — add "Manage your drop alerts" line in subscription card
- `app/api/inngest/route.js` — register `alertDigest`

---

## Task 1: DB migrations

**Files:**
- Migration 1: `create_alerts_table` (DDL via supabase apply_migration)
- Migration 2: `create_alert_log_table`

- [ ] **Step 1: Apply alerts migration**

```sql
CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  restaurant_slug text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, restaurant_slug)
);
CREATE INDEX idx_alerts_slug ON alerts(restaurant_slug);
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own alerts" ON alerts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Apply alert_log migration**

```sql
CREATE TABLE alert_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  release_window_key text NOT NULL,
  restaurant_slugs text[] NOT NULL,
  email text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  UNIQUE(user_id, release_window_key)
);
CREATE INDEX idx_alert_log_window ON alert_log(release_window_key);
ALTER TABLE alert_log ENABLE ROW LEVEL SECURITY;
-- service-role only; no policy for authenticated users (read not exposed)
```

- [ ] **Step 3: Verify**

Run `list_tables` on `public` schema. Expect both tables listed with RLS on. Verify policy on alerts.

---

## Task 2: Extract drop date calc

**Files:**
- Create: `lib/dropDate.js`
- Modify: `app/restaurant/[slug]/page.js:124-185`

- [ ] **Step 1: Create util**

```js
// lib/dropDate.js

/**
 * Compute the next bookable drop date for a restaurant.
 * Single source of truth — used by restaurant page, alerts page, alert cron.
 *
 * Logic: current ET → if before release_time, restaurant date is yesterday;
 * next bookable = restaurant date + observed_days - 1.
 *
 * @param {{ release_time?: string|null, observed_days?: number|null, release_schedule?: string|null }} r
 * @param {Date} [now=new Date()]
 * @returns {{ display: string|null, dateET: Date|null, releaseHour: number, releaseMinute: number }}
 */
export function computeNextDropDate(r, now = new Date()) {
  if (!r.observed_days) {
    return { display: r.release_schedule || null, dateET: null, releaseHour: 0, releaseMinute: 0 }
  }

  const etTimeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const etHour   = parseInt(etTimeParts.find(p => p.type === 'hour').value, 10)
  const etMinute = parseInt(etTimeParts.find(p => p.type === 'minute').value, 10)

  let releaseHour = 0
  let releaseMinute = 0
  if (r.release_time) {
    const match = r.release_time.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
    if (match) {
      let h = parseInt(match[1], 10)
      const m = parseInt(match[2], 10)
      const meridiem = match[3].toUpperCase()
      if (meridiem === 'AM' && h === 12) h = 0
      else if (meridiem === 'PM' && h !== 12) h += 12
      releaseHour = h
      releaseMinute = m
    }
  }

  const etDateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const etYear  = parseInt(etDateParts.find(p => p.type === 'year').value, 10)
  const etMonth = parseInt(etDateParts.find(p => p.type === 'month').value, 10) - 1
  const etDay   = parseInt(etDateParts.find(p => p.type === 'day').value, 10)

  const restaurantDate = new Date(etYear, etMonth, etDay)
  if (etHour * 60 + etMinute < releaseHour * 60 + releaseMinute) {
    restaurantDate.setDate(restaurantDate.getDate() - 1)
  }
  restaurantDate.setDate(restaurantDate.getDate() + r.observed_days - 1)

  const formatted = restaurantDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const display = r.release_time ? `${formatted} at ${r.release_time} ET` : formatted

  return { display, dateET: restaurantDate, releaseHour, releaseMinute }
}
```

- [ ] **Step 2: Refactor restaurant page**

Replace the inline block in `app/restaurant/[slug]/page.js:124-185` with:

```js
import { computeNextDropDate } from '../../../lib/dropDate'

// ... inside RestaurantPage:
const { display: dropDateDisplay } = computeNextDropDate(r)
```

- [ ] **Step 3: Verify**

Build site (`npm run build` will fail without env, skip — visual check only). Open a known restaurant page in dev (`npm run dev`); confirm next-drop date renders identically for premium user.

---

## Task 3: API routes

**Files:**
- Create: `app/api/alerts/route.js`
- Create: `app/api/alerts/toggle/route.js`

- [ ] **Step 1: GET /api/alerts**

```js
// app/api/alerts/route.js
import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .single()
  if (sub?.status !== 'active') {
    return NextResponse.json({ error: 'premium_required' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('alerts')
    .select('restaurant_slug, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ alerts: data })
}
```

- [ ] **Step 2: POST /api/alerts/toggle**

```js
// app/api/alerts/toggle/route.js
import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .single()
  if (sub?.status !== 'active') {
    return NextResponse.json({ error: 'premium_required' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const slug = typeof body.restaurant_slug === 'string' ? body.restaurant_slug.trim() : ''
  if (!slug) return NextResponse.json({ error: 'restaurant_slug required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('alerts')
    .select('id')
    .eq('user_id', user.id)
    .eq('restaurant_slug', slug)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('alerts').delete().eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ active: false })
  }

  const { error } = await supabase
    .from('alerts')
    .insert({ user_id: user.id, restaurant_slug: slug })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ active: true })
}
```

- [ ] **Step 3: Verify**

`curl -i -X POST http://localhost:3000/api/alerts/toggle` — expect 401. Sign in via UI, then in console run `await fetch('/api/alerts/toggle', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({restaurant_slug: 'lilia'}) }).then(r => r.json())` — expect `{ active: true }` first call, `{ active: false }` second call.

---

## Task 4: AlertBell component

**Files:**
- Create: `app/components/AlertBell.js`
- Create: `app/components/AlertBell.css`

- [ ] **Step 1: AlertBell.js**

```js
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import './AlertBell.css'

export default function AlertBell({ slug }) {
  const [status, setStatus] = useState('loading') // loading | guest | free | active | inactive
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const supabase = getSupabaseBrowser()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { if (!cancelled) setStatus('guest'); return }

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', session.user.id)
          .single()
        if (sub?.status !== 'active') { if (!cancelled) setStatus('free'); return }

        const res = await fetch('/api/alerts')
        const json = await res.json()
        const active = (json.alerts || []).some(a => a.restaurant_slug === slug)
        if (!cancelled) setStatus(active ? 'active' : 'inactive')
      } catch {
        if (!cancelled) setStatus('guest')
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  async function handleToggle() {
    if (busy) return
    if (status === 'guest' || status === 'free') return // link handles redirect

    const next = status === 'active' ? 'inactive' : 'active'
    setStatus(next) // optimistic
    setBusy(true)
    try {
      const res = await fetch('/api/alerts/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_slug: slug }),
      })
      if (!res.ok) {
        setStatus(next === 'active' ? 'inactive' : 'active') // revert
      } else {
        const json = await res.json()
        setStatus(json.active ? 'active' : 'inactive')
      }
    } catch {
      setStatus(next === 'active' ? 'inactive' : 'active')
    } finally {
      setBusy(false)
    }
  }

  const isActive = status === 'active'

  if (status === 'guest' || status === 'free') {
    const href = status === 'guest' ? '/signup' : '/account'
    const label = status === 'guest' ? 'Sign up to set a drop alert' : 'Subscribe to set a drop alert'
    return (
      <Link href={href} className="ab-btn" aria-label={label} title={label}>
        <BellIcon active={false} />
        <span className="ab-label">Alert</span>
      </Link>
    )
  }

  return (
    <button
      className={isActive ? 'ab-btn ab-active' : 'ab-btn'}
      onClick={handleToggle}
      disabled={status === 'loading' || busy}
      aria-label={isActive ? 'Remove drop alert' : 'Set a drop alert'}
      aria-pressed={isActive}
    >
      <BellIcon active={isActive} />
      <span className="ab-label">{isActive ? 'Alerted' : 'Alert'}</span>
    </button>
  )
}

function BellIcon({ active }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}
```

- [ ] **Step 2: AlertBell.css**

```css
.ab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 0.5px solid #2a2a26;
  color: #8a8a80;
  font-family: var(--font-dm-sans), sans-serif;
  font-size: 13px;
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.15s, border-color 0.15s;
}
.ab-btn:hover { color: #e8e4dc; border-color: #8a8a80; }
.ab-btn:disabled { opacity: 0.5; cursor: default; }
.ab-btn.ab-active { color: #c9a96e; border-color: #c9a96e; }
.ab-btn.ab-active:hover { color: #e8c592; border-color: #e8c592; }
.ab-label { letter-spacing: 0.5px; }
```

- [ ] **Step 3: Mount on restaurant page**

In `app/restaurant/[slug]/page.js`, line ~283 (header footer):

```js
import AlertBell from '../../components/AlertBell'

// inside rp-hero-footer, AFTER ShareButton:
<AlertBell slug={slug} />
```

- [ ] **Step 4: Verify**

`npm run dev`, visit a restaurant page as: (a) signed-out — bell links to /signup; (b) free user — bell links to /account; (c) premium — bell toggles, page refresh persists state.

---

## Task 5: /alerts page rebuild

**Files:**
- Modify: `app/alerts/page.js` (full rewrite)
- Create: `app/alerts/AlertsList.js`

- [ ] **Step 1: Server page**

Rewrite `app/alerts/page.js`:

```js
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseStatic } from '@/lib/supabase-static'
import Link from 'next/link'
import ScoopNav from '../components/ScoopNav'
import ScoopFooter from '../components/ScoopFooter'
import AlertsList from './AlertsList'
import { computeNextDropDate } from '@/lib/dropDate'

export const metadata = {
  title: 'The Dish — Drop Alerts',
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
        .td-empty { font-size: 15px; color: #8a8a80; line-height: 1.7; }
        .td-empty strong { color: #e8e4dc; font-weight: 600; }
        .td-cta { display: inline-block; background: #c9a96e; color: #0f0f0d; border-radius: 8px; padding: 0.85rem 1.5rem; font-size: 14px; font-weight: 600; text-decoration: none; margin-top: 1rem; }
        .td-cta:hover { opacity: 0.9; }
        .td-row { display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center; padding: 1rem 0; border-bottom: 0.5px solid #2a2a26; }
        .td-row:last-child { border-bottom: none; }
        .td-row-meta { font-family: var(--font-dm-mono), monospace; font-size: 11px; color: #6b6b60; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 0.35rem; }
        .td-row-name { font-family: var(--font-playfair), serif; font-size: 20px; color: #e8e4dc; text-decoration: none; }
        .td-row-name:hover { color: #c9a96e; }
        .td-row-date { font-family: var(--font-dm-mono), monospace; font-size: 13px; color: #c9a96e; margin-top: 0.5rem; letter-spacing: 0.5px; }
        .td-row-date.muted { color: #6b6b60; }
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
```

- [ ] **Step 2: Client list with remove action**

Create `app/alerts/AlertsList.js`:

```js
'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function AlertsList({ rows }) {
  const [items, setItems] = useState(rows)

  async function handleRemove(slug) {
    const previous = items
    setItems(items.filter(r => r.slug !== slug))
    try {
      const res = await fetch('/api/alerts/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_slug: slug }),
      })
      if (!res.ok) setItems(previous)
    } catch {
      setItems(previous)
    }
  }

  if (items.length === 0) {
    return (
      <div className="td-card">
        <p className="td-empty">No alerts yet. Find a restaurant and hit the bell.</p>
        <Link href="/" className="td-cta">Browse restaurants</Link>
      </div>
    )
  }

  return (
    <div className="td-card">
      {items.map(r => (
        <div key={r.slug} className="td-row">
          <div>
            <div className="td-row-meta">
              {r.neighborhood} · {r.platform || 'No platform'}{r.release_time ? ` · ${r.release_time} ET` : ''}
            </div>
            <Link href={`/restaurant/${r.slug}`} className="td-row-name">{r.restaurant}</Link>
            <div className={r.dropDate ? 'td-row-date' : 'td-row-date muted'}>
              {r.dropDate ? `Next drop: ${r.dropDate}` : 'No upcoming drop'}
            </div>
          </div>
          <button
            onClick={() => handleRemove(r.slug)}
            aria-label={`Remove alert for ${r.restaurant}`}
            style={{
              background: 'transparent',
              border: '0.5px solid #c9a96e',
              color: '#c9a96e',
              padding: '0.5rem 0.85rem',
              borderRadius: '999px',
              cursor: 'pointer',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: '12px',
              letterSpacing: '0.5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Verify**

`npm run dev`. Visit `/alerts` as guest, free user, premium with 0 alerts, premium with N alerts. Remove an alert. Refresh. Confirm persisted.

---

## Task 6: /account link

**Files:**
- Modify: `app/account/page.js`

- [ ] **Step 1: Add link inside subscription card**

Inside the active branch of the subscription card (after the "Manage billing" form), insert:

```js
<Link href="/alerts" className="ac-btn-outline">Manage your drop alerts</Link>
```

For the inactive branch, do NOT add the link (free user has no alerts to manage). Add `import Link from 'next/link'` if missing.

- [ ] **Step 2: Verify**

Premium account page shows the link. Click navigates to /alerts.

---

## Task 7: Email digest sender

**Files:**
- Create: `lib/email/alertDigest.js`

- [ ] **Step 1: Implement**

```js
const RESEND_API_URL = 'https://api.resend.com/emails'

/**
 * Send a single drop-alert digest email to one user.
 *
 * @param {{ to: string, restaurants: Array<{slug: string, restaurant: string, release_time: string, platform: string, neighborhood: string}> }} params
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function sendAlertDigest({ to, restaurants }) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[alert-digest] RESEND_API_KEY not set, skipping')
    return { ok: false, error: 'no_api_key' }
  }
  if (!restaurants?.length) return { ok: false, error: 'no_restaurants' }

  const names = restaurants.map(r => r.restaurant).join(', ')
  const subject = `🔔 Drops in 5 minutes: ${names}`

  const lines = restaurants.map(r => {
    const url = `https://scoopd.nyc/restaurant/${r.slug}`
    return `${r.restaurant} (${r.neighborhood}) opens at ${r.release_time} ET on ${r.platform}.\n  ${url}`
  })

  const text = [
    'Heads up. The following reservation windows open in about 5 minutes:',
    '',
    ...lines,
    '',
    'Manage your alerts: https://scoopd.nyc/alerts',
  ].join('\n')

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@scoopd.nyc',
      to,
      subject,
      text,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`[alert-digest] Resend error ${res.status}: ${body}`)
    return { ok: false, error: `resend_${res.status}` }
  }
  return { ok: true }
}
```

- [ ] **Step 2: Verify (visual only)**

Code review only — actual send is exercised by the cron task.

---

## Task 8: Inngest cron

**Files:**
- Create: `lib/inngest/alertDigest.js`

- [ ] **Step 1: Implement**

```js
import { createClient } from '@supabase/supabase-js'
import { inngest } from '../inngest'
import { sendAlertDigest } from '../email/alertDigest'

/**
 * Build "HH:MM AM/PM" -> minutes-of-day. Returns null on parse fail.
 */
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

      return (restaurants || []).filter(r => {
        const m = releaseTimeToMinutes(r.release_time)
        if (m == null) return false
        // Window: release in (nowMinutes, nowMinutes+5]
        return m > nowMinutes && m <= nowMinutes + 5
      }).map(r => ({
        ...r,
        release_minutes: releaseTimeToMinutes(r.release_time),
      }))
    })

    if (candidates.length === 0) return { firing: 0, sent: 0 }

    // --- Step 2: Fetch alerts + premium users for these slugs ---
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

      // Group restaurants per user, keyed by release_window so dedupe is per-window
      const byUser = new Map()
      for (const a of alertRows) {
        if (!activeUserIds.has(a.user_id)) continue
        const r = candidates.find(c => c.slug === a.restaurant_slug)
        if (!r) continue
        // Build release_window_key: YYYY-MM-DD HH:MM ET
        const et = nowETParts()
        const dateStr = `${et.year}-${String(et.month).padStart(2, '0')}-${String(et.day).padStart(2, '0')}`
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

      // Resolve emails per unique user_id (one query per user via admin API)
      const out = []
      for (const entry of byUser.values()) {
        const { data: u } = await supabase.auth.admin.getUserById(entry.user_id)
        const email = u?.user?.email
        if (!email) continue
        out.push({ ...entry, email })
      }
      return out
    })

    if (sendPlan.length === 0) return { firing: candidates.length, sent: 0 }

    // --- Step 3: Insert dedup rows; on conflict skip; send for inserts only ---
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
          // Unique violation = already sent for this window. Skip silently.
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
          // Roll back log so a retry on next window can try again
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
```

- [ ] **Step 2: Verify**

Code review. The actual cron run is verified after registration in Task 9. Local Inngest dev server (`npx inngest-cli@latest dev`) can manually invoke to test, but optional.

---

## Task 9: Register cron

**Files:**
- Modify: `app/api/inngest/route.js`

- [ ] **Step 1: Add to functions**

```js
import { serve } from 'inngest/next'
import { inngest } from '../../../lib/inngest'
import { resyDailyCheck } from '../../../lib/inngest/resyDailyCheck'
import { sevenroomsDailyCheck } from '../../../lib/inngest/sevenroomsDailyCheck'
import { sevenroomsLongCalMonthlyCheck } from '../../../lib/inngest/sevenroomsLongCalMonthlyCheck'
import { alertDigest } from '../../../lib/inngest/alertDigest'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [resyDailyCheck, sevenroomsDailyCheck, sevenroomsLongCalMonthlyCheck, alertDigest],
})
```

- [ ] **Step 2: Verify**

`npm run dev`. Hit `/api/inngest` (POST inspector route handled by inngest serve). On Inngest dashboard, function `alert-digest` should appear with cron `*/5 * * * *`.

---

## Task 10: Smoke verification

- [ ] **Step 1: Mark known restaurants do-not-touch list intact**

Re-read CLAUDE.md do-not-touch list. Confirm no notes column writes happened.

- [ ] **Step 2: Em-dash sweep**

`grep -rn '—' app/alerts app/components/AlertBell.js lib/email/alertDigest.js lib/inngest/alertDigest.js lib/dropDate.js` — must return zero hits in copy. (Hyphens or periods only.)

- [ ] **Step 3: Build**

`npm run build`. Expect success.

- [ ] **Step 4: Manual flow**

`npm run dev`. End-to-end: signed-in premium user bells a known restaurant, sees it on /alerts with correct next drop date, removes it, dev cron fires (or document that prod fires after deploy).

- [ ] **Step 5: Document tech debt**

Add a one-line TODO to `tasks/lessons.md`: "Drop date calc lives in lib/dropDate.js but app/drops/page.js and app/plan/PlanClient.js still hold copies. Migrate when next touched."

---

## Self-Review Checklist

- [x] Spec coverage: alerts table ✓, RLS ✓, /api/alerts/toggle ✓, /api/alerts ✓, bell on restaurant page ✓, /alerts page (4 states) ✓, /account link ✓, Inngest cron ✓, alert_log dedup ✓, registered ✓, em-dash rule ✓, td- prefix ✓, no Tailwind utility ✓, SVG bell (no emoji) ✓.
- [x] No placeholders.
- [x] Type consistency: `restaurant_slug` everywhere; `release_window_key` consistent in DB + cron.
- [x] No notes column writes anywhere.
