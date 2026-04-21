# Agent Infrastructure Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the Claude Code agent infrastructure for Scoopd: restructured CLAUDE.md, admin security fix, three core skills (write-note, security-audit, ship), six commands, and a lessons log.

**Architecture:** Split CLAUDE.md into operating rules (CLAUDE.md) and reference material (docs/scoopd-reference.md). Fix the admin password security hole by moving validation server-side. Implement skills as SKILL.md files in `.claude/skills/scoopd/` and commands as markdown files in `.claude/commands/`.

**Tech Stack:** Next.js 16.2.1 App Router, httpOnly cookies for admin session, markdown skill files

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `CLAUDE.md` | Trim to operating rules only |
| Create | `docs/scoopd-reference.md` | All reference content extracted from CLAUDE.md |
| Create | `app/api/admin/auth/route.js` | Server-side admin password validation |
| Modify | `app/api/admin/add-restaurant/route.js` | Add auth cookie check |
| Modify | `app/admin/page.js` | Remove hardcoded password, call auth API |
| Modify | `.env.local` | Add `ADMIN_PASSWORD=<current password>` |
| Create | `.claude/skills/scoopd/write-note/SKILL.md` | Note-writing workflow |
| Create | `.claude/skills/scoopd/security-audit/SKILL.md` | Security audit workflow |
| Create | `.claude/skills/scoopd/ship/SKILL.md` | Pre-push gate workflow |
| Create | `.claude/commands/debug.md` | /debug command |
| Create | `.claude/commands/note.md` | /note command |
| Create | `.claude/commands/add.md` | /add command |
| Create | `.claude/commands/audit.md` | /audit command |
| Create | `.claude/commands/ship.md` | /ship command |
| Create | `.claude/commands/verify.md` | /verify command |
| Create | `tasks/lessons.md` | Failure pattern log |

---

## Task 1: Create docs/scoopd-reference.md

**Files:**
- Create: `docs/scoopd-reference.md`

- [ ] **Step 1: Create the reference doc with all content extracted from CLAUDE.md**

Create `docs/scoopd-reference.md` with this exact content:

```markdown
# Scoopd Reference

Full reference material for the Scoopd platform. Extracted from CLAUDE.md so the
operating rules file stays scannable. Read this when you need schema details,
phase history, design system values, or environment variable reference.

---

## Stack

- Next.js 16.2.1 (App Router, Turbopack)
- Supabase (Postgres DB + Auth)
- Stripe (subscriptions, live mode active)
- Vercel Hobby (hosting)
- GitHub: scoopdnyc/scoopd

## Environment Variables

Required in .env.local and Vercel:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_STRIPE_PRICE_ID (standard monthly $9.99)
- STRIPE_STANDARD_PRICE_YEAR (standard yearly $60)
- STRIPE_FOUNDING_PRICE_MONTH (founding monthly $2.99)
- STRIPE_FOUNDING_PRICE_YEAR (founding yearly $18)
- STRIPE_WEBHOOK_SECRET
- NEXT_PUBLIC_SITE_URL
- RESEND_API_KEY
- GOOGLE_PLACES_API_KEY
- ADMIN_PASSWORD (server-only, no NEXT_PUBLIC_ prefix)

## Database Schema

### restaurants table
- restaurant — display name
- slug — URL slug (e.g. carbone)
- neighborhood — NYC neighborhood
- platform — Resy, OpenTable, DoorDash, Walk-in, Phone, CLOSED
- cuisine — cuisine type
- release_time — e.g. 10:00 AM, 12:00 AM
- observed_days — integer, rolling window in days
- release_schedule — text, for monthly restaurants only e.g. 1st of the month
- seat_count — integer
- michelin_stars — text
- price_tier — $, $$, $$$, $$$$
- difficulty — Easy, Medium, Hard, Very Hard, Extremely Hard
- notes — editorial description (~140 restaurants have hand-written copy)
- address — full street address
- beli_score — numeric
- non_standard_inventory — boolean
- confidence — ✅ Confirmed, ⚠️ Probable, ❌ Unconfirmed
- last_verified — text e.g. Apr 2026
- notify_demand — Very High, High, Medium, Low

### subscriptions table
- user_id — references auth.users
- stripe_customer_id
- stripe_subscription_id
- status — active or inactive
- current_period_end
- founding_member — boolean

## Design System

- Background: #0f0f0d
- Text primary: #e8e4dc
- Text secondary: #8a8a80
- Gold accent: #c9a96e
- Border: #2a2a26
- Font headings: Playfair Display (var --font-playfair)
- Font body: DM Sans (var --font-dm-sans)
- Font mono: DM Mono (var --font-dm-mono)

### Difficulty Badge Colors
- Easy: #6ec9a0
- Medium: #c9b882
- Hard: #e38f09
- Very Hard: #c96e6e
- Extremely Hard: #a855f7

## Phase Status

### Phase 1 — Complete
Directory, restaurant pages, badge system, admin form, five-tier difficulty badge,
auto-generated booking sentences, ~192 active restaurant rows.

### Phase 2 — Complete
Stripe live mode, founding member system, ScoopNav two-bar system, /signup,
/alerts placeholder, ScoopFooter, /terms, /privacy, Resend domain verified,
Zoho Mail support@scoopd.nyc live.

### Phase 3 — Complete
/drops (what drops today, premium gated), /plan (plan by date, premium gated).
Alerts system deferred to Phase 4.

### Phase 4 — In Progress
SEO complete. Editorial in progress (walk-in notes, remaining OpenTable notes).
Backlink strategy, restaurant photos, blog layer not started.

### Phase 5 — Not Started
AdSense, scoopd.com domain, expansion beyond NYC, iOS/Android app.

## Founding Member System

- Rate: $2.99/month or $18/year — permanent while active
- Forfeiture: permanently lost if subscription is ever canceled
- Standard rate: $9.99/month or $60/year
- founding_member boolean set to true by webhook on checkout.session.completed
- Re-entry gate: canceled founding members cannot reclaim founding rate

## Alerts System Design (Deferred to Phase 4)

- Inngest for scheduling
- Resend for email (3,000/month free tier, noreply@scoopd.nyc)
- Digest format: one email per release time group
- Fires 5 minutes before drop time ET
- Bell icon on restaurant page, premium only

## Competitive Context

- Resy API: https://api.resy.com/3/venue?url_slug={slug}&location=new-york-ny
- Resy auth header: ResyAPI api_key="VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5"
- Competitors: Resx (TOS violations), Quenelle.ai (content farm), Snag Reservations (SEO)
- Scoopd position: verified intelligence, diner-side, no restaurant advertising

## Legal

- Governing law: State of New York
- Arbitration: JAMS, New York County, binding individual arbitration, class action waiver
- Effective date: April 10, 2026
- Contact: support@scoopd.nyc

## Non-Standard Inventory (NSI)

Restaurants with non_standard_inventory=true: corner-store, the-86, oresh.
NsiField component at app/components/NsiField.js.
Blue-gray tint on release time and days-out cards.
Callout: "This restaurant opens its booking window on a set schedule but has not
released general availability inventory with an observable pattern."

## Content Status (as of April 2026)

~192 restaurants total. Editorial notes complete for all Tock, Resy, OpenTable,
DoorDash, Phone, and Own Site restaurants. Walk-in notes in progress (14 remaining).
OpenTable notes: 13 remaining. Deferred: Crown Shy, Hillstone, Sushi Ginza Onodera,
Don Peppe, Din Tai Fung.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/piggy/scoopd
git add docs/scoopd-reference.md
git commit -m "docs: add scoopd-reference.md with extracted reference material"
```

---

## Task 2: Rewrite CLAUDE.md to operating rules only

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Replace CLAUDE.md with operating-rules-only version**

Replace the entire contents of `CLAUDE.md` with:

```markdown
# Scoopd — Operating Rules for Claude Code

Reference material (schema, phase history, design system, env vars) is in
`docs/scoopd-reference.md`. Read it when you need specifics. This file is
operating rules only — read every session.

---

## Critical Invariants (Never Violate)

### Supabase Client Selection
Wrong client = broken auth. No exceptions.
- `lib/supabase-browser.js` — client components only
- `lib/supabase-server.js` — server components and API routes with user context
- `lib/supabase-static.js` — sitemap only, never use anywhere else

### Drop Date Calculation
Single source of truth: `app/restaurant/[slug]/page.js`.
Never reimplement this logic. Never modify it without also updating `app/drops/page.js`
and `app/plan/PlanClient.js`. The logic: current ET time → if before release_time,
restaurant date is yesterday; next bookable = restaurant date + observed_days - 1.

### Do-Not-Touch Restaurant Notes
Never overwrite notes for these restaurants with scripts or automation:
4 Charles Prime Rib, Bemelmans Bar, Bistrot Ha, Carbone, Cote, Double Chicken Please,
Eleven Madison Park, Ha's Snack Bar, Jeju Noodle Bar, Joo Ok, Lilia, Minetta Tavern,
Tatiana, Theodora, Torrisi, Via Carota

### No Em Dashes
No em dashes (—) anywhere in Scoopd copy. Ever. Use a period, colon, or restructure.

### observed_days Is the Only Public Days-Out Field
Do not expose release_schedule as a days-out number. observed_days only.

---

## Auth Pattern (Server Components + API Routes)

```js
const serverSupabase = await createSupabaseServer()
const { data: { user } } = await serverSupabase.auth.getUser()
const { data: sub } = await serverSupabase
  .from('subscriptions')
  .select('status')
  .eq('user_id', user.id)
  .single()
const isPremium = sub?.status === 'active'
```

---

## Premium Gate Pattern

Free users see blurred placeholder + lock icon + "Get access →" CTA linking to /signup.
Implemented on: /restaurant/[slug] (drop date), /drops (Opens For column), /plan (Drop Date column).
Free users always see: restaurant name, neighborhood, platform, drop time, difficulty.
Only the exact date is locked.

---

## Admin Security

- No plaintext passwords in any client-side JS file
- Admin password must be validated server-side via `/api/admin/auth`
- `/api/admin/add-restaurant` requires valid `admin_auth` httpOnly cookie
- `ADMIN_PASSWORD` is a server-only env var (no `NEXT_PUBLIC_` prefix)

---

## CSS Conventions

- No Tailwind utility classes in new components (Tailwind preflight is active and conflicts)
- Each page has its own co-located CSS file
- Class prefix per page: rp- restaurant, su- signup, lg- login, ac- account, dr- drops,
  sc- dropdown, sb- subbar, sf- footer, fm- founding, pw- reset-password, fp- forgot-password,
  td- alerts, lg- legal

---

## Editorial Rules

- Scoopd voice: specific, insider, no marketing language, no generic adjectives
- Minimum 3 sources for any restaurant note (Michelin, restaurant website, press)
- Never fabricate. Never plagiarize. Rewrite from scratch using sources as reference.
- Auto-generated booking sentence when notes field is null — do not overwrite with null
- Slug for "Sartiano's" is sartriano in DB (legacy typo — do not change)

---

## Workflow

Before pushing to main: run `/ship`
When writing a restaurant note: run `/note [slug]`
When adding a restaurant: run `/add`
After any bulk data change: run `/verify`
Before any new API route or auth change: run `/audit`
When debugging: run `/debug`

See `tasks/lessons.md` for captured failure patterns from prior sessions.
See `docs/superpowers/specs/2026-04-20-agent-infrastructure-design.md` for full system design.
```

- [ ] **Step 2: Verify the file looks right**

Read CLAUDE.md and confirm it is under 100 lines and contains no phase history, schema field lists, or session logs.

- [ ] **Step 3: Commit**

```bash
cd /Users/piggy/scoopd
git add CLAUDE.md
git commit -m "docs: restructure CLAUDE.md to operating rules only"
```

---

## Task 3: Fix admin security — create auth route

**Files:**
- Create: `app/api/admin/auth/route.js`

- [ ] **Step 1: Add ADMIN_PASSWORD to .env.local**

Open `.env.local` and add this line. Use the current admin password value — and since that value was previously exposed in client-side JS visible to any browser, **change it to a new strong password at the same time**:

```
ADMIN_PASSWORD=<new-strong-password>
```

Do not commit `.env.local`. Verify it is in `.gitignore`:
```bash
cd /Users/piggy/scoopd && grep ".env" .gitignore
```

If `.env.local` is not in `.gitignore`, add it before proceeding.

- [ ] **Step 2: Create the auth route**

Create `app/api/admin/auth/route.js`:

```js
export async function POST(request) {
  try {
    const { password } = await request.json()

    if (!process.env.ADMIN_PASSWORD) {
      return Response.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = Response.json({ ok: true })
    response.headers.set(
      'Set-Cookie',
      'admin_auth=1; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=28800'
    )
    return response
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Verify the route exists**

```bash
ls /Users/piggy/scoopd/app/api/admin/
```

Expected output includes `auth/` and `add-restaurant/`.

- [ ] **Step 4: Commit**

```bash
cd /Users/piggy/scoopd
git add app/api/admin/auth/route.js
git commit -m "security: add server-side admin auth route"
```

---

## Task 4: Fix admin security — protect add-restaurant route

**Files:**
- Modify: `app/api/admin/add-restaurant/route.js`

- [ ] **Step 1: Add the auth check helper and guard to the route**

Replace the full contents of `app/api/admin/add-restaurant/route.js` with:

```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function isAdminAuthed(request) {
  const cookieHeader = request.headers.get('cookie') || ''
  return cookieHeader.split(';').some(c => c.trim() === 'admin_auth=1')
}

export async function POST(request) {
  if (!isAdminAuthed(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    if (!body.restaurant || !body.slug) {
      return Response.json({ error: 'Restaurant name is required' }, { status: 400 })
    }

    const cleaned = Object.fromEntries(
      Object.entries(body).map(([k, v]) => [k, v === '' ? null : v])
    )

    const { data, error } = await supabase
      .from('restaurants')
      .insert([cleaned])
      .select()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, data })
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/piggy/scoopd
git add app/api/admin/add-restaurant/route.js
git commit -m "security: require admin auth cookie on add-restaurant route"
```

---

## Task 5: Fix admin security — update admin page

**Files:**
- Modify: `app/admin/page.js`

- [ ] **Step 1: Remove hardcoded password, update handlePasswordSubmit, add credentials to fetch**

Replace the top of `app/admin/page.js` — remove the `ADMIN_PASSWORD` constant and replace `handlePasswordSubmit` with the async version. The complete updated file:

```js
'use client'
import { useState } from 'react'
import './admin.css'

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const EMPTY_FORM = {
  restaurant: '',
  neighborhood: '',
  platform: '',
  cuisine: '',
  release_time: '',
  observed_days: '',
  release_schedule: '',
  seat_count: '',
  michelin_stars: '',
  beli_score: '',
  notify_demand: '',
  price_tier: '',
  difficulty: '',
  confidence: '',
  last_verified: '',
  notes: '',
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      })
      if (res.ok) {
        setAuthed(true)
        setPasswordError(false)
      } else {
        setPasswordError(true)
      }
    } catch {
      setPasswordError(true)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    const slug = generateSlug(form.restaurant)
    const payload = {
      ...form,
      slug,
      observed_days: form.observed_days ? parseInt(form.observed_days) : null,
      seat_count: form.seat_count ? parseInt(form.seat_count) : null,
      beli_score: form.beli_score ? parseFloat(form.beli_score) : null,
    }

    try {
      const res = await fetch('/api/admin/add-restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        setStatus({ type: 'success', message: `${form.restaurant} added successfully. Slug: ${slug}` })
        setForm(EMPTY_FORM)
      } else {
        setStatus({ type: 'error', message: data.error || 'Something went wrong.' })
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error. Try again.' })
    }
    setLoading(false)
  }

  if (!authed) {
    return (
      <div className="admin-auth">
        <div className="admin-auth-box">
          <div className="admin-logo">Scoopd</div>
          <div className="admin-auth-label">Admin Access</div>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`admin-auth-input ${passwordError ? 'error' : ''}`}
              autoFocus
            />
            {passwordError && <div className="admin-auth-error">Incorrect password</div>}
            <button type="submit" className="admin-auth-btn">Enter</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <div className="admin-logo">Scoopd</div>
        <div className="admin-header-label">Add Restaurant</div>
      </div>

      {status && (
        <div className={`admin-status ${status.type}`}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-form">

        <div className="admin-section-label">Core Info</div>
        <div className="admin-grid-2">
          <div className="admin-field">
            <label>Restaurant Name *</label>
            <input name="restaurant" value={form.restaurant} onChange={handleChange} required placeholder="e.g. Carbone" />
            {form.restaurant && <div className="admin-slug-preview">slug: {generateSlug(form.restaurant)}</div>}
          </div>
          <div className="admin-field">
            <label>Neighborhood</label>
            <input name="neighborhood" value={form.neighborhood} onChange={handleChange} placeholder="e.g. West Village" />
          </div>
          <div className="admin-field">
            <label>Platform</label>
            <select name="platform" value={form.platform} onChange={handleChange}>
              <option value="">Select</option>
              <option>Resy</option>
              <option>OpenTable</option>
              <option>DoorDash</option>
              <option>Tock</option>
              <option>Tock/OpenTable</option>
              <option>Resy/OpenTable</option>
              <option>Resy/Tock</option>
              <option>Phone/Relationships</option>
              <option>Walk-in</option>
              <option>Own Site</option>
              <option>Yelp</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Cuisine</label>
            <input name="cuisine" value={form.cuisine} onChange={handleChange} placeholder="e.g. Italian" />
          </div>
        </div>

        <div className="admin-section-label">Reservation Details</div>
        <div className="admin-grid-2">
          <div className="admin-field">
            <label>Release Time (ET)</label>
            <select name="release_time" value={form.release_time} onChange={handleChange}>
              <option value="">Select</option>
              <option>12:00 AM</option>
              <option>7:00 AM</option>
              <option>8:00 AM</option>
              <option>9:00 AM</option>
              <option>10:00 AM</option>
              <option>11:00 AM</option>
              <option>12:00 PM</option>
              <option>8:00 PM</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Observed Days Out</label>
            <input name="observed_days" type="number" value={form.observed_days} onChange={handleChange} placeholder="e.g. 31" />
          </div>
          <div className="admin-field">
            <label>Release Schedule (monthly)</label>
            <input name="release_schedule" value={form.release_schedule} onChange={handleChange} placeholder="e.g. 1st of Month, 2 absolute months" />
          </div>
          <div className="admin-field">
            <label>Seat Count</label>
            <input name="seat_count" type="number" value={form.seat_count} onChange={handleChange} placeholder="e.g. 60" />
          </div>
        </div>

        <div className="admin-section-label">Ratings & Classification</div>
        <div className="admin-grid-3">
          <div className="admin-field">
            <label>Difficulty</label>
            <select name="difficulty" value={form.difficulty} onChange={handleChange}>
              <option value="">Select</option>
              <option>Extremely Hard</option>
              <option>Very Hard</option>
              <option>Hard</option>
              <option>Medium</option>
              <option>Easy</option>
              <option>Walk-in Only</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Notify Demand</label>
            <select name="notify_demand" value={form.notify_demand} onChange={handleChange}>
              <option value="">Select</option>
              <option>Very High</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Price Tier</label>
            <select name="price_tier" value={form.price_tier} onChange={handleChange}>
              <option value="">Select</option>
              <option>$</option>
              <option>$$</option>
              <option>$$$</option>
              <option>$$$$</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Beli Score</label>
            <input name="beli_score" type="number" step="0.1" value={form.beli_score} onChange={handleChange} placeholder="e.g. 8.9" />
          </div>
          <div className="admin-field">
            <label>Michelin Stars</label>
            <select name="michelin_stars" value={form.michelin_stars} onChange={handleChange}>
              <option value="">None</option>
              <option value="—">—</option>
              <option value="⭐">⭐ 1 Star</option>
              <option value="⭐⭐">⭐⭐ 2 Stars</option>
              <option value="⭐⭐⭐">⭐⭐⭐ 3 Stars</option>
              <option value="Bib">Bib Gourmand</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Confidence</label>
            <select name="confidence" value={form.confidence} onChange={handleChange}>
              <option value="">Select</option>
              <option value="✅ Confirmed">✅ Confirmed</option>
              <option value="⚠️ Probable">⚠️ Probable</option>
              <option value="❌ Unconfirmed">❌ Unconfirmed</option>
            </select>
          </div>
        </div>

        <div className="admin-section-label">Notes & Verification</div>
        <div className="admin-grid-2">
          <div className="admin-field">
            <label>Last Verified</label>
            <input name="last_verified" value={form.last_verified} onChange={handleChange} placeholder="e.g. Apr 2026" />
          </div>
        </div>
        <div className="admin-field">
          <label>Notes (public description)</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Write the public-facing description here..." rows={4} />
        </div>

        <button type="submit" className="admin-submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Restaurant'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Verify the hardcoded password is gone**

```bash
grep -n "ADMIN_PASSWORD\|scoopd2026" /Users/piggy/scoopd/app/admin/page.js
```

Expected: no output. If any line is returned, the fix did not apply correctly.

- [ ] **Step 3: Verify the new auth flow works manually**

Start the dev server and navigate to `/admin`. Enter the password. Confirm:
1. The password is not visible in browser DevTools → Sources or Network → Initiator
2. The Network tab shows a POST to `/api/admin/auth` when submitting the password
3. A correct password grants access; a wrong password shows the error

- [ ] **Step 4: Commit**

```bash
cd /Users/piggy/scoopd
git add app/admin/page.js
git commit -m "security: remove hardcoded admin password from client-side JS"
```

---

## Task 6: Create skill directory structure

**Files:**
- Create: `.claude/skills/scoopd/` (directory)

- [ ] **Step 1: Create the directory structure**

```bash
mkdir -p /Users/piggy/scoopd/.claude/skills/scoopd/write-note
mkdir -p /Users/piggy/scoopd/.claude/skills/scoopd/security-audit
mkdir -p /Users/piggy/scoopd/.claude/skills/scoopd/ship
mkdir -p /Users/piggy/scoopd/.claude/commands
mkdir -p /Users/piggy/scoopd/tasks
```

- [ ] **Step 2: Verify**

```bash
ls /Users/piggy/scoopd/.claude/skills/scoopd/
```

Expected: `write-note  security-audit  ship`

---

## Task 7: Implement scoopd:write-note skill

**Files:**
- Create: `.claude/skills/scoopd/write-note/SKILL.md`

- [ ] **Step 1: Write the skill file**

Create `.claude/skills/scoopd/write-note/SKILL.md`:

```markdown
---
name: scoopd:write-note
description: Write or update a restaurant notes field on Scoopd. Triggers when asked to write, rewrite, update, or improve any restaurant description or notes field.
---

# Write Restaurant Note

You are writing the `notes` field for a Scoopd restaurant record. This is the public-facing
editorial description displayed on the restaurant's page and used as the SEO meta description.

## Hard Stops — Check Before Writing Anything

**Step 1: Do-not-touch check.**

If the restaurant is ANY of the following, STOP immediately. Do not write, do not suggest
edits, do not continue. Tell the user: "This restaurant is on the do-not-touch list.
Notes cannot be modified without an explicit override instruction."

Do-not-touch list:
4 Charles Prime Rib, Bemelmans Bar, Bistrot Ha, Carbone, Cote, Double Chicken Please,
Eleven Madison Park, Ha's Snack Bar, Jeju Noodle Bar, Joo Ok, Lilia, Minetta Tavern,
Tatiana, Theodora, Torrisi, Via Carota

**Step 2: Source check.**

Confirm at least 3 sources have been provided (Michelin, restaurant website, press coverage
such as Eater, NYT, New Yorker). If fewer than 3 sources are present, ask:
"Please provide at least 3 sources before I write this note."

## Voice Rules

- Specific and insider. Name the chef, the dish, the detail that matters to a serious diner.
- No marketing language: never use "beloved", "acclaimed", "vibrant", "celebrated", "iconic",
  "hidden gem", "must-visit", "culinary journey", or similar generic adjectives.
- No em-dashes (—). Use a period, colon, or restructure the sentence.
- Do not include booking intelligence (release time, days out, platform) — that data is
  displayed separately from the DB.
- Do not fabricate any detail. Do not copy text from sources. Rewrite from scratch.
- Target: 1-3 sentences. Under 155 characters is ideal (fits SEO meta description).

## Steps

1. Read the existing notes field for this restaurant if it exists.
2. Confirm not on do-not-touch list.
3. Confirm 3 sources provided.
4. Draft the note from scratch in Scoopd voice.
5. Self-check: run this mental test on the draft:
   - Does it contain an em-dash? Fix it.
   - Does it contain any generic adjective ("beloved", "acclaimed", etc.)? Replace it.
   - Does it mention a reservation platform, release time, or days out? Remove it.
   - Is it under 155 characters? If not, tighten it.
6. Present the draft to the user in the output format below.
7. Wait for explicit approval. Do not write to the DB.
8. After approval: provide the exact SQL or confirm you will write via the admin route.

## Output Format

```
DRAFT NOTE — [Restaurant Name]
─────────────────────────────
[Draft text here]
─────────────────────────────
Characters: XX | Em-dashes: 0 | Generic adjectives: none
Sources used: [list the 3+ sources]

Awaiting your approval before writing to DB.
```

## After Approval

Write the note using the admin API route or provide the exact Supabase SQL:

```sql
UPDATE restaurants SET notes = '[approved text]' WHERE slug = '[slug]';
```
```

- [ ] **Step 2: Verify the file was created**

```bash
cat /Users/piggy/scoopd/.claude/skills/scoopd/write-note/SKILL.md | head -5
```

Expected: first 5 lines of the SKILL.md including the frontmatter.

- [ ] **Step 3: Commit**

```bash
cd /Users/piggy/scoopd
git add .claude/skills/scoopd/write-note/SKILL.md
git commit -m "feat: add scoopd:write-note skill"
```

---

## Task 8: Implement scoopd:security-audit skill

**Files:**
- Create: `.claude/skills/scoopd/security-audit/SKILL.md`

- [ ] **Step 1: Write the skill file**

Create `.claude/skills/scoopd/security-audit/SKILL.md`:

```markdown
---
name: scoopd:security-audit
description: Security audit for Scoopd. Triggers before any new API route, admin feature, auth change, or when the /audit command is invoked.
---

# Security Audit

Run every check below. Report all findings. Block ship on any Critical finding.

## Check 1: Hardcoded secrets in app/

```bash
grep -rn "ADMIN_PASSWORD\|scoopd2026\|password\s*=\s*['\"][^'\"]\+['\"]" app/ --include="*.js" \
  | grep -v "//.*password" \
  | grep -v "placeholder"
```

Any match is Critical. The specific pattern `const ADMIN_PASSWORD` in a client component
is the exact vulnerability that was previously missed. Flag it by name if found.

## Check 2: Client-side auth validation

```bash
grep -rn "localStorage\|sessionStorage" app/ --include="*.js"
```

Auth state stored in localStorage or sessionStorage is a warning — it can be manipulated.
Auth state in React component state (useState) is acceptable.

Also read `app/admin/page.js` directly and confirm:
- No password string literals (search for quotes around alphanumeric strings near "password")
- `handlePasswordSubmit` calls an API route, not a local comparison

## Check 3: Supabase browser client in server contexts

```bash
grep -rn "supabase-browser" app/api/ --include="*.js"
grep -rn "supabase-browser" app/ --include="page.js" | grep -v "components"
```

API routes using `supabase-browser` is Critical. Server components using it is Critical.
Only client components (`'use client'`) may use `supabase-browser`.

## Check 4: Unauthenticated admin routes

Read each file in `app/api/admin/`. For each route:
- Confirm it calls `isAdminAuthed(request)` or equivalent before processing
- Confirm it returns 401 if auth fails
- Confirm it does NOT trust any userId or admin flag from the request body

## Check 5: User data without auth

Read each file in `app/api/`. For any route that returns user-specific data:
- Confirm `serverSupabase.auth.getUser()` is called
- Confirm the returned user.id is used to scope the query (not a user-supplied ID)

## Reporting Format

```
SECURITY AUDIT — [date]
=======================

CRITICAL (block ship):
  [ ] file:line — description

WARNINGS (fix before next release):
  [ ] file:line — description

PASSED:
  [x] Check 1: No hardcoded secrets
  [x] Check 2: No client-side auth
  [x] Check 3: No browser Supabase in server contexts
  [x] Check 4: All admin routes require auth
  [x] Check 5: User data is auth-scoped

Status: [BLOCKED / CLEAR]
```

Do not mark Status as CLEAR until all Critical items are resolved.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/piggy/scoopd
git add .claude/skills/scoopd/security-audit/SKILL.md
git commit -m "feat: add scoopd:security-audit skill"
```

---

## Task 9: Implement scoopd:ship skill

**Files:**
- Create: `.claude/skills/scoopd/ship/SKILL.md`

- [ ] **Step 1: Write the skill file**

Create `.claude/skills/scoopd/ship/SKILL.md`:

```markdown
---
name: scoopd:ship
description: Pre-push verification gate for Scoopd. Triggers before any push to main, or when the /ship command is invoked.
---

# Ship Gate

Run all checks before pushing to main. All must pass. Block push on any failure.

## Check 1: Lint

```bash
cd /Users/piggy/scoopd && npm run lint 2>&1
```

Expected: exit 0 with no errors. Warnings are acceptable. Fix all errors before continuing.

## Check 2: Hardcoded secrets

```bash
cd /Users/piggy/scoopd && grep -rn "ADMIN_PASSWORD\|scoopd2026\|password\s*=\s*['\"][^'\"]\+['\"]" app/ \
  --include="*.js" | grep -v "placeholder" | grep -v "\/\/"
```

Expected: no output. Any match is a Critical failure. Do not ship.

## Check 3: Em-dashes in modified files

```bash
cd /Users/piggy/scoopd && git diff --name-only HEAD | xargs grep -ln "—" 2>/dev/null
```

Expected: no output. Any match means a modified file contains an em-dash. Find the line,
fix the copy (use a period or colon), then re-run this check.

## Check 4: Drop date logic drift

```bash
cd /Users/piggy/scoopd && git diff --name-only HEAD \
  | grep -v "app/restaurant/\[slug\]/page\.js" \
  | xargs grep -l "releaseHour\|releaseMinute\|parseReleaseMinutes" 2>/dev/null
```

Expected: no output. If any file is returned, drop date logic was modified outside the
canonical file. This requires review: either the change is intentional and must be
propagated to the canonical file, or it must be reverted.

## Check 5: Supabase client correctness

```bash
cd /Users/piggy/scoopd && git diff --name-only HEAD | xargs grep -l "supabase-browser" 2>/dev/null \
  | grep -v "components/"
```

Expected: no output. Any API route or server component using supabase-browser is a failure.

## Check 6: What's shipping

```bash
cd /Users/piggy/scoopd && git log origin/main..HEAD --oneline
cd /Users/piggy/scoopd && git diff origin/main..HEAD --stat
```

Review what commits and files are included. Confirm nothing unexpected is in the diff.

## Report Format

```
SHIP GATE — [date]
==================

[ ] Check 1 Lint:              PASS
[ ] Check 2 Secrets:           PASS
[ ] Check 3 Em-dashes:         PASS
[ ] Check 4 Drop date drift:   PASS
[ ] Check 5 Supabase clients:  PASS
[ ] Check 6 Diff review:       [summary of what's shipping]

Status: CLEAR TO SHIP
```

Replace PASS with FAIL and add the specific finding for any failed check.
Only write "CLEAR TO SHIP" when all checks pass.

## After Clearance

```bash
cd /Users/piggy/scoopd && git push origin main
```
```

- [ ] **Step 2: Commit**

```bash
cd /Users/piggy/scoopd
git add .claude/skills/scoopd/ship/SKILL.md
git commit -m "feat: add scoopd:ship skill"
```

---

## Task 10: Implement six commands

**Files:**
- Create: `.claude/commands/debug.md`
- Create: `.claude/commands/note.md`
- Create: `.claude/commands/add.md`
- Create: `.claude/commands/audit.md`
- Create: `.claude/commands/ship.md`
- Create: `.claude/commands/verify.md`

- [ ] **Step 1: Create debug.md**

```markdown
Invoke the scoopd:debug skill to diagnose the issue described in $ARGUMENTS.

Load the skill and follow it exactly. The symptom or error is: $ARGUMENTS
```

- [ ] **Step 2: Create note.md**

```markdown
Invoke the scoopd:write-note skill for the restaurant with slug: $ARGUMENTS

Before invoking the skill, read the current restaurant record:
- Read app/restaurant/[slug]/page.js to understand the page structure
- The slug to look up is: $ARGUMENTS

Then follow the scoopd:write-note skill exactly.
```

- [ ] **Step 3: Create add.md**

```markdown
Invoke the scoopd:add-restaurant skill to add a new restaurant.

Prompt the user for: restaurant name, neighborhood, platform, release_time, observed_days.
Then follow the skill workflow to validate and insert the record.
```

- [ ] **Step 4: Create audit.md**

```markdown
Invoke the scoopd:security-audit skill on the current working state.

Run against: git diff HEAD (current uncommitted changes) plus any files in app/api/admin/.
Follow the skill exactly and report all findings before doing anything else.
```

- [ ] **Step 5: Create ship.md**

```markdown
Invoke the scoopd:ship skill to verify everything before pushing to main.

Run all checks in the skill. Do not push until all checks pass and you have
confirmed the diff summary with the user.
```

- [ ] **Step 6: Create verify.md**

```markdown
Invoke the scoopd:verify-data skill to check data integrity after a bulk change.

Check for: malformed release_time values, restaurants with observed_days but no
release_time, duplicate slugs, missing required fields (restaurant, slug, platform),
NSI flag consistency.

Report all findings as an actionable list.
```

- [ ] **Step 7: Commit all commands**

```bash
cd /Users/piggy/scoopd
git add .claude/commands/
git commit -m "feat: add six Claude Code commands (debug, note, add, audit, ship, verify)"
```

---

## Task 11: Create tasks/lessons.md

**Files:**
- Create: `tasks/lessons.md`

- [ ] **Step 1: Create the lessons log**

Create `tasks/lessons.md`:

```markdown
# Scoopd — Claude Code Lessons

Patterns captured from session corrections. Reviewed at session start.
Skills are promoted from here when a pattern repeats 2+ times.

---

## L001 — Admin password hardcoded in client JS (2026-04-20)

**Pattern:** A password or secret was placed as a string literal in a React client component.
**Impact:** Visible to any visitor via browser DevTools → Sources.
**Rule:** All secrets must be in env vars with no `NEXT_PUBLIC_` prefix. All auth validation
must happen in API routes, never in client components.
**Skill:** scoopd:security-audit Check 1 and Check 2 now catch this class of issue.
**Status:** Fixed in app/admin/page.js → app/api/admin/auth/route.js

## L002 — Add-restaurant route had no auth check (2026-04-20)

**Pattern:** An API route that writes to the DB had no authentication check. Anyone who
discovered the URL could POST arbitrary data.
**Rule:** Every admin API route must call `isAdminAuthed(request)` at the top and return
401 before processing if auth fails.
**Skill:** scoopd:security-audit Check 4 catches this.
**Status:** Fixed in app/api/admin/add-restaurant/route.js

---

## Adding New Lessons

Format:
## LXXX — Short description (YYYY-MM-DD)
**Pattern:** What was done wrong or what worked unexpectedly well.
**Impact:** What it caused.
**Rule:** The rule to follow going forward.
**Skill:** Which skill (if any) now enforces this.
**Status:** Fixed / Active / Watching
```

- [ ] **Step 2: Commit**

```bash
cd /Users/piggy/scoopd
git add tasks/lessons.md
git commit -m "docs: add tasks/lessons.md with initial security lessons"
```

---

## Final Verification

- [ ] **Run the ship skill manually to verify the full infrastructure**

Run each check from `scoopd:ship` skill in sequence. All should pass on the newly committed state.

```bash
cd /Users/piggy/scoopd && npm run lint 2>&1
```

```bash
cd /Users/piggy/scoopd && grep -rn "ADMIN_PASSWORD\|scoopd2026" app/ --include="*.js"
```

Expected: no output (the password is gone from client JS).

```bash
cd /Users/piggy/scoopd && git log origin/main..HEAD --oneline
```

Expected: list of the commits made in this plan.

- [ ] **Confirm .claude directory is committed**

```bash
cd /Users/piggy/scoopd && git status .claude/
```

Expected: nothing — all skill and command files should be committed.

- [ ] **Confirm tasks/lessons.md is committed**

```bash
cd /Users/piggy/scoopd && git log --oneline tasks/lessons.md
```

Expected: one commit entry.
