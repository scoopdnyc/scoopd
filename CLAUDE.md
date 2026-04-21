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

## Non-Standard Inventory (NSI)

Restaurants with `non_standard_inventory=true` open their booking window on a set
schedule but without an observable general availability pattern.
Currently flagged: `corner-store`, `the-86`, `oresh`
- Render release time and days-out fields with blue-gray tint (`rgba(80, 110, 140, 0.15)`)
- Use `NsiField` component (`app/components/NsiField.js`) for those two fields
- Suppress the asterisk on the days-out value for NSI restaurants
- Info callout text: "This restaurant opens its booking window on a set schedule but has
  not released general availability inventory with an observable pattern. Read how booking
  actually works here."

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
See `docs/scoopd-reference.md` for schema, phase history, design system, env vars.
See `docs/superpowers/specs/2026-04-20-agent-infrastructure-design.md` for full system design.
