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
- Full SEO overhaul complete — title deduplication, canonicals, OG images, ISR caching, JSON-LD, FAQPage, H1/H2, /signup noindexed
- Neighborhood and platform category pages live
- Blog system live — /blog/the-reservation-economy and /blog/rolling-windows-and-monthly-drops published
- llms.txt, IndexNow, GSC and Bing submissions complete
- Restaurant photos live on all pages — /admin/photos picker built
- All 192 restaurant notes complete
- OpenTable availability monitor built — currently non-functional due to Akamai bot protection blocking all automated requests (Vercel, GitHub Actions, Playwright headless, stealth plugin, pre-authenticated cookies all blocked)
- OpenTable restaurant IDs populated for all 28 restaurants (Aska and Yingtao excluded from monitoring — experience-only slots)
- Resy and SevenRooms monitors operational and sending digest emails
- sendMonitorDigest schema mismatch fixed — digest emails now working
- NSI SevenRooms slugs corrected: thecornerstore, theeightysix, 450wbroadway
- L004 closed — /drops and /plan migrated to computeNextDropDate from lib/dropDate.js
- GA4 key events wired: signup, subscribe, alert_set
- Google Signals enabled
- Phase 4A Traffic + Marketing spec added to scoopd.md
- scoopd.md and scoopd-reference.md fully reconciled and updated
- handoff.md created with permanent context template
- Mobile layout fixes: ScoopSubBar mobile alignment, /drops and /plan horizontal scroll fixed with 70% zoom
- Shadow market blog post written and ready to publish — Fred has not yet signed off
- The Campbell restaurant note updated in DB

**In progress:**
- OpenTable mobile API capture via Proxyman — stopped because Fred is on hotel WiFi (client isolation prevents iPhone and Mac from communicating). Resume when on home WiFi or iPhone personal hotspot. Goal: capture the mobile API endpoint which may bypass Akamai.
- Shadow market blog post — written, pending Fred's sign-off before publishing

**Open tasks (priority order):**
1. Resume Proxyman mobile API capture on home WiFi or iPhone hotspot — Mac connects to iPhone hotspot, Proxyman gets new IP, update iPhone proxy settings to new IP port 9090, open OpenTable app, capture mobile API endpoint
2. Sign off and publish shadow market blog post
3. Social account rebrand (X and Reddit — 10 year aged personal accounts) — activate after 3-4 blog posts live
4. Press outreach (Eater NY, Grub Street, Infatuation) — after blog content builds up
5. Need to Know box system — deferred, needs policy data for 192 restaurants
6. Catch Hospitality blog post — deferred, mechanic not fully understood
7. OpenTable monitor — deferred until mobile API captured or proxy budget available

**Live issues:**
- OpenTable monitor writes http_403 to monitor_log on every run — expected, Akamai blocks all automated requests. Not a bug, a known limitation. Do not flag as an error.
- Corima flagged by Resy monitor — 1-day drift (stored 61, observed 60). Monitor and investigate before any DB change.
- Lilia flagged by Resy monitor — known closed-day compression pattern. Observe before acting.
- monitor_log has residual http_403 rows from OpenTable testing — can be cleared with: DELETE FROM monitor_log WHERE source = 'opentable' AND flag_reason LIKE 'http_403%';

**Next step:**
Connect Mac to iPhone personal hotspot → Proxyman shows new IP (172.20.10.x range) → update iPhone proxy settings to new IP port 9090 → open OpenTable app on iPhone → capture mobile API requests in Proxyman → paste full request URL, headers, and response into chat.
