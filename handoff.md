# Scoopd Agent Handoff

## How to use this file
Paste the full contents of this file at the start of a new chat session to onboard the agent instantly. At the end of every session, run the handoff prompt from scoopd.md to update the Session section below.

---

## Permanent Context

**Product:** Scoopd (scoopd.nyc) — NYC restaurant reservation intelligence platform. Tracks exact drop times and booking windows for 192 restaurants. Freemium, $9.99/month premium tier.

**Stack:** Next.js 16.2.1 (App Router), Supabase, Stripe, Vercel Hobby, Inngest, Resend, GitHub Actions. GitHub: scoopdnyc/scoopd. Supabase project ID: zztiidefywmsinssmxiy.

**Key files to read first:**
- scoopd.md — working session log, current phase status, open tasks, file structure
- scoopd-reference.md — permanent technical gospel: full schema, monitor algorithms, design system, founding system, legal

**Supabase clients — critical:**
- lib/supabase-browser.js — client components only
- lib/supabase-server.js — server components and API routes with user auth
- lib/supabase-static.js — ISR/static pages, no auth context
- lib/supabase.js — sitemap only

**How Fred works:**
- Direct, minimal explanation unless asked
- Always verify DB state before making changes — query first, change second
- Never auto-update observed_days or any DB field based solely on a monitor flag — flags trigger manual investigation only
- Never overwrite existing restaurant notes with scripts without explicit instruction
- Do not touch do-not-touch restaurant notes: 4 Charles Prime Rib, Bemelmans Bar, Bistrot Ha, Carbone, Cote, Double Chicken Please, Eleven Madison Park, Ha's Snack Bar, Jeju Noodle Bar, Joo Ok, Lilia, Minetta Tavern, Tatiana, Theodora, Torrisi, Via Carota
- No em dashes anywhere in copy — ever
- Scoopd voice: specific, insider, no marketing language, no generic adjectives
- When in doubt about file placement: session logs go in scoopd.md, permanent technical reference goes in scoopd-reference.md

**Monitor system:**
- Resy: Inngest, daily 12:30 PM ET, 119 restaurants
- SevenRooms: Inngest, daily + monthly
- OpenTable: GitHub Actions, daily 5 PM UTC — currently non-functional, Akamai blocks all automated requests. Active investigation in progress.
- NSI opportunistic: GitHub Actions, every 5 min noon-6 PM ET

**Active platforms:** Resy, OpenTable, SevenRooms (rolling/long-cal/monthly), Tock, DoorDash, Phone, Walk-in

---

## Session

**Last updated:** May 14, 2026

**What was done:**
- Built OpenTable availability monitor: `lib/monitors/opentable.js` with full response pattern handling (BlockedAvailability, NoTimesExist/fully-booked, experience-only/Aska+Yingtao)
- Populated all 29 opentable_restaurant_ids in DB including jean-georges (3154)
- Monitor went through three infrastructure pivots trying to bypass Akamai:
  1. Inngest → http_403 (Akamai blocks Vercel IPs)
  2. GitHub Actions curl → /api/opentable-check → still Vercel's IP making the actual OT request
  3. GitHub Actions running `scripts/opentable-check.mjs` directly → still 403 (direct fetch, not browser)
- Pivoted to Playwright-based approach to use a real browser session
- Playwright POC iterated: plain headless → stealth plugin → OT login form → cookie injection
- Current test: `scripts/opentable-playwright-test.mjs` with stealth plugin + pre-authenticated cookie injection via `OT_COOKIES` env var
- Workflow `.github/workflows/opentable-daily-check.yml` now runs the Playwright test (not the production monitor)
- `scripts/opentable-check.mjs` exists as the production-ready direct-fetch script (shelved pending Playwright outcome)
- scoopd.md, scoopd-reference.md, handoff.md updated throughout

**Files actively edited this session:**
- `lib/monitors/opentable.js` — created and rewritten
- `lib/inngest/opentableDailyCheck.js` — created then deleted
- `app/api/inngest/route.js` — updated (back to 4 functions)
- `app/api/opentable-check/route.js` — created then deleted
- `.github/workflows/opentable-daily-check.yml` — multiple rewrites
- `scripts/opentable-check.mjs` — created (production script, shelved)
- `scripts/opentable-playwright-test.mjs` — created, 4 iterations
- `scoopd.md`, `docs/scoopd-reference.md`, `handoff.md`

**Everything that failed:**
- Direct `fetch` to `dapi/fe/gql` from any server context (Inngest/Vercel, GitHub Actions) → Akamai returns http_403
- Routing through Vercel API route from GitHub Actions → doesn't help, Vercel's IP is still the one calling OT
- Playwright headless Chromium without stealth → Akamai detects via TLS fingerprinting / navigator.webdriver
- Playwright with stealth plugin but no session cookies → still blocked
- Playwright with login form automation → replaced with cookie injection (form automation is fragile, OT login flow may have CAPTCHA)

**In progress:**
- Playwright + pre-authenticated cookie injection test. Waiting on: (1) OT_COOKIES GitHub secret to be set, (2) workflow trigger, (3) result

**Open tasks (priority order):**
1. **Set OT_COOKIES secret and run Playwright test** — export cookies from logged-in opentable.com session via DevTools console, paste as GitHub secret OT_COOKIES, trigger workflow manually
2. **If Playwright+cookies works:** rewrite `scripts/opentable-playwright-test.mjs` into full production monitor that checks all 28 restaurants, writes to monitor_log, sends Resend digest on flags. Update workflow to run production script, restore cron schedule + production env secrets.
3. **If Playwright+cookies fails:** accept OpenTable monitoring is not viable without a paid residential proxy. Document the decision in scoopd-reference.md and close the investigation.
4. **Blog post #3** — high ROI for organic traffic. Target: "How to Get a Reservation at [specific hard restaurant]" with exact drop time intel. Activate press outreach after 3-4 posts.
5. **Social accounts** — X and Reddit rebranding. Not yet activated.
6. **Backlink outreach** — Eater NY, Grub Street, The Infatuation. After 3-4 posts.

**Live issues:**
- OpenTable monitor non-functional. `lib/monitors/opentable.js` exists and works correctly in isolation — the problem is purely network-level Akamai blocking. All monitor_log entries for `source = 'opentable'` are either empty or old http_403 rows (cleared).
- OT_COOKIES will expire (typically 30-90 days). If Playwright approach succeeds, a cookie refresh strategy is needed — either a separate login workflow that re-exports cookies, or periodic manual refresh.
- Inngest back to 4 functions. Dashboard may show stale 5-function count until it re-syncs.

**Next step:**
Export OT cookies from a logged-in browser session and set as `OT_COOKIES` GitHub secret:
```js
// Run in DevTools console on opentable.com while logged in:
JSON.stringify(document.cookie.split('; ').map(c => {
  const [name, ...rest] = c.split('=')
  return { name, value: rest.join('='), domain: '.opentable.com', path: '/' }
}))
```
Then: Actions tab → "OpenTable Daily Check" → "Run workflow". Check logs for `[ot-playwright] SUCCESS`.
