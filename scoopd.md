---
PURPOSE: Working session log. Updated every session.
CONTAINS: Session log, open tasks, current phase status, file structure map, database schema (app-facing fields only), Supabase client rules, editorial rules, monitor status summary.
DOES NOT CONTAIN: Monitor algorithms, design system values, founding system spec, legal, competitive context, environment variables, permanent operational rules. Those live in scoopd-reference.md.
---

# Scoopd — Session Log

This is the working session log. Update this file every session.
Contains: session log, open tasks, current phase status, file structure map, database schema (app-facing fields only), supabase client rules, editorial rules, monitor status summary.
Does not contain: monitor algorithms, design system values, founding system spec, legal, competitive context, environment variables, permanent operational rules. Those live in scoopd-reference.md.

---

## Current Status — May 2026

- Phase 1: Complete
- Phase 2: Complete
- Phase 3: Complete (including alerts)
- Phase 4: Complete (SEO + editorial)
- Phase 5: Not started
- Availability monitor: Live (Resy + SevenRooms + OpenTable).
- 192 restaurants in DB. All notes complete as of May 2026.

---

## Open Tasks

- **Blog content** — four posts live: `/blog/the-reservation-economy`, `/blog/rolling-windows-and-monthly-drops`, `/blog/reservation-shadow-market`, `/blog/who-gets-the-table`. High ROI backlog continues.
- **SEO action plan** — audit run May 17 2026 at 67/100. L3 (blog author byline) and L8 (ItemList on /drops) shipped May 18. Remaining open: M1 (neighborhood editorial), M6 (how-to-book sections on top 6 restaurants — next needle-mover per GSC data), M7 (expand rolling-windows post), L2 (/about page), L6 (static homepage restaurant list).
- **ScoopNote** — scoop column live, content populated for 6 restaurants (carbone, lilia, via-carota, don-angie, torrisi, 4-charles-prime-rib). Component renders in right column of Booking Intelligence section when non-null. Design not final, deferred until traffic warrants revisiting.
- **Need to Know box system** — deferred.
- **Catch Hospitality blog post** — deferred.
- **Backlink outreach** — not started.
- **Social account rebrand** — not started.

---

## Phase Status

### Phase 1 — Core Directory (Complete)
Restaurant directory, restaurant pages, difficulty badge system, admin add-restaurant tool. 192 active restaurant rows in DB.

### Phase 2 — Auth + Monetization (Complete)
Supabase Auth, Stripe subscriptions (monthly + yearly), premium blur/unlock pattern on drop date, /account page, /signup flow, /founding founding member system, /forgot-password + /reset-password, ScoopNav two-bar system, ScoopFooter sitewide, /terms + /privacy, Zoho Mail + Resend configured.

### Phase 3 — Dynamic Features (Complete)
- `/drops` — live view of today's drops, sorted by release time ET. Opens For column premium-gated.
- `/plan` — plan by target dinner date. Drop Date column premium-gated.
- Alerts system — Complete. Inngest cron every 5 minutes, Resend email digest, bell icon on restaurant pages (premium only, suppressed for walk-in restaurants), /account alert management. `restaurant_alerts` and `alert_log` tables live with RLS.
- Availability monitor — Live. See Monitor System section.

### Phase 4 — Editorial + SEO (Complete)

**SEO — Complete:**
- Title deduplication: no trailing | Scoopd on any page
- Canonical URLs on all pages
- OG images: sitewide default + per-restaurant with difficulty badge color (Next.js ImageResponse)
- twitter:card summary_large_image sitewide
- ISR caching: revalidate=3600 on restaurant pages; force-static on /how-it-works; supabase-static.js for cookie-free fetches; PremiumReveal.js handles auth-gated content client-side
- Homepage JSON-LD: WebSite (SearchAction) + Organization
- Restaurant JSON-LD: name, servesCuisine, address, priceRange, acceptsReservations, BreadcrumbList
- FAQPage schema on /how-it-works
- H1/H2 semantic headings on restaurant pages; H1 = "[Name] Reservations"
- /signup noindexed and removed from sitemap
- Sitemap with real lastmod timestamps via last_updated_at column
- Neighborhood category pages at /neighborhood/[name] with ItemList + BreadcrumbList JSON-LD
- Platform category pages at /platform/[name] with ItemList + BreadcrumbList JSON-LD
- Blog system: /blog index + /blog/[slug] MDX with Article schema, ISR, canonical
- First post: /blog/the-reservation-economy (links to Torrisi and Don Angie)
- /how-it-works Further Reading section linking to blog
- public/llms.txt for AI crawler signal
- IndexNow key file, verified with Bing, bulk URL submission complete
- Google Search Console: top 25 pages manually submitted
- Bing Webmaster Tools: sitemap submitted
- Restaurant photos live on all pages; /admin/photos picker with lazy load, focal point cropper, height slider
- robots.txt, Google Analytics, Google site verification, neighborhood internal linking, share button

**Editorial — Complete:**
- All 192 restaurant notes complete as of May 2026
- lib/dropDate.js created as single source of truth for drop date calculation (L004: /drops and /plan still have inline copies — pending migration)
- Non-standard inventory system: NsiField.js component, blue-gray tint + info callout on release time and days-out fields for NSI restaurants

### Phase 4A — Traffic + Marketing (Active)

**Track 1: Blog Content**
- Ecosystem-level editorial pieces where Scoopd has genuine knowledge and original voice. Not per-restaurant repetitive content.
- Priority topics: platform explainers, reservation economy pieces, data journalism when difficulty scoring is defensible, timely pieces around Restaurant Week and new openings
- SEO strategy: embed high-search restaurant names naturally within editorial content
- All content bylined as Scoopd, drafted by Claude
- Posts live: /blog/the-reservation-economy, /blog/rolling-windows-and-monthly-drops, /blog/reservation-shadow-market, /blog/who-gets-the-table
- Each post submitted to GSC and IndexNow on publish

**Track 2: Social (slow burn)**
- X and Reddit accounts: personal aged accounts (10 year history) rebranded
- Voice: personal persona, not brand voice. Organic recommendations, not promotion.
- Claude drafts all content, manual post only
- Reddit targets: r/FoodNYC, r/AskNYC, r/finedining
- Activate after accounts are rebranded

**Track 3: Press + Backlinks**
- Targets: Eater NY, Grub Street, The Infatuation, NYC food newsletters
- Pitch angle: original data and reservation intelligence nobody else publishes
- Claude drafts all outreach
- Activate after 3-4 blog posts are live

**Track 4: New Restaurant Openings**
- Monitor new NYC restaurant openings and publish drop time intelligence fast
- Source: NYC food Instagram influencers — automation needed to avoid manual daily monitoring
- Build: automated pipeline to detect new openings and alert for DB addition
- Status: approach TBD, automation not yet built

**Track 5: Community**
- Product Hunt launch
- Hacker News Show HN
- EA and corporate assistant communities
- Hotel concierge outreach
- Timing: after 4-5 blog posts live and social accounts active

**Track 6: Data Journalism (deferred)**
- "The NYC Reservation Report" — hardest restaurants, platform breakdown, release time patterns
- Blocked on: difficulty score methodology needs to be defensible first
- Revisit when crowdsourced booking outcome data available in Phase 5

### Phase 5 — Growth (Not Started)
- AdSense and sponsorships
- scoopd.com domain acquisition
- Expansion beyond NYC
- Monitor Snag Reservations for SEO competition
- Amex Platinum and Chase Sapphire Reserve affiliate links
- Native iOS/Android app
  - Dual pricing: $12.99/month in-app, $9.99/month web
  - Token/reward system tied to data contributions (verified drop times, schedule changes, referrals, reviews, birthday, restaurant suggestions)
  - In-app token balance and redemption UI
  - Rewards: free months, account credits, premium access extensions, early alert access
  - Crowdsourced data model: users earn by improving platform intelligence, keeping drop times current
  - Push notifications for token earnings, reward milestones, and drop alerts
  - Token/reward system is native app only, not built on web

---

## Monitor System

### Status
- Resy: Live. 119 restaurants, daily 12:30 PM ET via Inngest.
- SevenRooms rolling: Live. Adda, Dhamaka, Semma, Masalawala & Sons, Noz 17.
- SevenRooms long calendar: Live. Marea, Rezdora. Daily at 12:30 PM ET.
- SevenRooms monthly: Live. Sushi Noz only. Runs 1st and 15th of month at 2 PM UTC.
- NSI opportunistic (SevenRooms): Live. Corner Store, Or'Esh, The 86. Every 5 min noon–6 PM ET via GitHub Actions (self-hosted Mac runner).
- DoorDash: Live. Corner Store, The Eighty Six, Or'Esh. Every 5 min noon–6 PM ET via GitHub Actions (self-hosted Mac runner). DD_WEB_TOKEN expires ~June 20 — refresh by June 19.
- OpenTable: Live. 28 restaurants, daily 5 PM UTC via GitHub Actions (self-hosted Mac runner). Moved from Inngest — Akamai blocks datacenter IPs, bypassed via residential IP.

### Infrastructure
- Inngest (free tier): 4 functions — resy-daily-check, sevenrooms-daily-check, sevenrooms-longcal-monthly-check, alert-digest
- GitHub Actions self-hosted (Mac runner): opportunistic-check.yml, doordash-check.yml, opentable-daily-check.yml — all require residential IP to bypass platform bot detection
- Resend: digest emails to support@scoopd.nyc
- All monitor state written to `monitor_log` table

### Known Issues
- Lilia: known false positive (closed day compression)
- Cafe Spaghetti: known false positive (temporary closure)
- Rezdora: observed_days corrected from 30 to 31 (first monitor catch)
- DD_WEB_TOKEN expires ~June 20. Extract fresh token from Chrome DevTools (Application > Cookies > doordash.com > ddweb_token) and update DD_WEB_TOKEN GitHub Actions secret.

### Algorithm Detail
See scoopd-reference.md for full algorithm-level documentation of each monitor.

---

## Supabase Clients — Critical
- `lib/supabase-browser.js` — client components only
- `lib/supabase-server.js` — server components and API routes with user auth context
- `lib/supabase-static.js` — cookie-free client for ISR/static pages; use for any server fetch that does not require user auth context
- `lib/supabase.js` — sitemap only, nowhere else

---

## File Structure

### lib/
- `lib/dropDate.js` — single source of truth for drop date calculation
- `lib/slugify.js` — NEIGHBORHOOD_MAP (44 entries), EXCLUDED_PLATFORM_VALUES, apostrophe stripping
- `lib/places.js` — Google Places API helpers
- `lib/supabase-browser.js`, `lib/supabase-server.js`, `lib/supabase-static.js`, `lib/supabase.js`
- `lib/email/alertDigest.js` — Resend alert email sender
- `lib/inngest/alertDigest.js` — alert digest cron function
- `lib/monitors/resy.js`, `lib/monitors/sevenrooms.js`, `lib/monitors/sevenrooms-opportunistic.js`
- `lib/inngest/sevenroomsLongCalMonthlyCheck.js`

### app/components/
- `AlertBell.js` / `AlertBell.css` — drop alert bell, five states (loading/guest/free/active/inactive)
- `NsiField.js` — non-standard inventory field with info callout
- `ScoopNav.js` — top nav bar
- `ScoopSubBar.js` — secondary auth bar
- `ScoopFooter.js` — footer
- `NavSignOut.js` — client component, sign out action
- `ShareButton.js`

### app/ routes
- `page.js` — homepage directory
- `layout.js` — root layout, fonts, metadata base, Google Analytics
- `restaurant/[slug]/` — ISR, revalidate=3600; PremiumReveal.js co-located here
- `neighborhood/[name]/` — neighborhood category pages, ISR, ItemList + BreadcrumbList JSON-LD
- `platform/[name]/` — platform category pages, ISR, ItemList + BreadcrumbList JSON-LD
- `blog/` — blog index, ISR
- `blog/[slug]/` — MDX blog posts, Article schema, ISR, canonical
- `drops/` — force-dynamic, premium gate on Opens For column
- `plan/` — force-dynamic, premium gate on Drop Date column
- `alerts/` — force-dynamic, premium-only; AlertsList.js client component
- `how-it-works/`
- `signup/` — noindex
- `login/`, `register/`, `account/`, `founding/`
- `forgot-password/`, `reset-password/`
- `terms/`, `privacy/` — both noindex
- `admin/` — password-gated
- `admin/photos/` — photo picker (page.js, PhotoPicker.js, photos.css)

### app/api/
- `stripe/checkout/route.js`, `stripe/portal/route.js`, `stripe/webhook/route.js`
- `inngest/route.js` — serves 4 Inngest functions (resy-daily-check, sevenrooms-daily-check, sevenrooms-longcal-monthly-check, alert-digest)
- `alerts/route.js` — GET (list alerts), POST toggle (upsert/delete)
- `alerts/toggle/route.js`
- `opportunistic-check/route.js` — NSI monitor endpoint, CRON_SECRET auth
- `admin/auth/route.js`
- `admin/add-restaurant/route.js`
- `admin/photos/[placeId]/route.js`
- `admin/set-photo/route.js`, `admin/set-photo-position/route.js`, `admin/set-photo-height/route.js`

### public/
- `llms.txt` — AI crawler signal
- `80563e7a19f14b0189e97bab4a8ab0db.txt` — IndexNow key file

---

## Database Schema (key fields)

Full schema including monitor columns in scoopd-reference.md. Fields actively used in app code:

### restaurants table
- `restaurant`, `slug`, `neighborhood`, `platform`, `cuisine`
- `release_time` — ET time string (e.g. "10:00 AM")
- `observed_days` — integer; only public-facing days-out field
- `release_schedule` — internal use only; never exposed as a number
- `seat_count`, `michelin_stars`, `price_tier`, `difficulty`
- `notes` — editorial copy; all 192 populated as of May 2026
- `address`, `google_place_id`
- `non_standard_inventory` — boolean; true for Corner Store, The Eighty Six, Or'Esh
- `photo_override_url`, `photo_position`, `photo_height` (default 420)
- `last_updated_at` — used by sitemap for real lastmod values
- `beli_score`

### subscriptions table
- `user_id`, `stripe_customer_id`, `stripe_subscription_id`
- `status` — active or inactive
- `current_period_end`
- `founding_member` — boolean; true if subscribed via /founding at founding rate

### restaurant_alerts table
- `user_id`, `restaurant_slug`, UNIQUE(user_id, restaurant_slug)

### alert_log table
- `user_id`, `restaurant_slug`, `release_window_key` (UNIQUE), `sent_at`

### monitor_log table
- `id`, `restaurant_id` (integer FK), `platform`, `checked_at`, `api_verified_days`, `expected_days`, `flagged`, `flag_reason`, `raw_value`

---

## Editorial Rules
- Scoopd voice: specific, insider, no marketing language, no generic adjectives
- No em dashes anywhere in copy. Ever. Use a period, colon, or restructure the sentence.
- Minimum 3 sources per note (Michelin, restaurant website, press). Never fabricate. Never plagiarize. Rewrite from scratch.
- Auto-generated booking sentence when notes field is null — do not overwrite populated notes with null
- observed_days is the only public-facing days-out field; release_schedule is internal only
- Booking intel must always come from observed_days and release_time in Supabase DB, never from third-party sources
- Do-not-touch list (notes must never be overwritten by scripts): 4 Charles Prime Rib, Bemelmans Bar, Bistrot Ha, Carbone, Cote, Double Chicken Please, Eleven Madison Park, Ha's Snack Bar, Jeju Noodle Bar, Joo Ok, Lilia, Minetta Tavern, Tatiana, Theodora, Torrisi, Via Carota
- The do-not-touch restriction applies to editorial voice, sourcing, and rewriting. Factual corrections such as day counts that conflict with observed_days are permitted and should be made directly in the DB with last_updated_at updated.

---

## Session Handoff

To generate a handoff.md at the end of any session, paste this prompt into Claude Code:

"Before we end this session, write a handoff.md file that captures:
- the goal we're working toward
- current state of the code
- files you actively edited this session
- everything you tried that failed
- open tasks in priority order
- any live issues to watch
- the single next step to take

Write it to the repo root as handoff.md and commit with "docs: update handoff.md""

---

## Session Log

### Session — April 18-19, 2026
- Saga added (slug: saga) — two Michelin stars, Chef Charlie Mitchell, 63rd floor 70 Pine Street Financial District, Resy, 10 AM, 1st of month 2 absolute months, Medium, $$$$
- Cote 550 added (slug: cote-550) — Simon Kim, 550 Madison Avenue Midtown, Resy, 10 AM, 14 days out, Very Hard, $$$
- Notes completed: Corner Store, The Eighty Six, Or'Esh, Jean-Georges, Saga, Cote 550, all Tock/DoorDash/OpenTable restaurants
- Non-standard inventory system built: non_standard_inventory column, NsiField.js component
- 18 booking line errors corrected via targeted replace script
- Blog stub created: app/blog/how-catch-hospitality-reservations-work/page.js (content TBD)

### Session — April 27, 2026
- Alerts system ("The Dish") built from scratch: restaurant_alerts + alert_log tables, RLS, GET/POST API routes, AlertBell.js component (5 states), alert digest Inngest cron, Resend email via lib/email/alertDigest.js
- Inngest now serves 4 functions (confirmed in dashboard)
- lib/dropDate.js created as single source of truth for drop date calc; restaurant page migrated; /drops and /plan still have inline copies (L004 — pending)
- First monitor catch: Rezdora observed_days corrected 30→31
- Notes completed: Una Pizza Napoletana, Crown Shy, Muku, Bar Miller, Kochi
- Sushi Ginza Onodera removed from DB (closed August 2023)
- Muku DB corrected: neighborhood Tribeca, non_standard_inventory true, release_schedule "1st of Month, 2 absolute months", observed_days null

### Session — May 4, 2026
- Full SEO overhaul complete (see Phase 4 for full list)
- Neighborhood + platform category pages live
- lib/slugify.js rewritten: 44-entry NEIGHBORHOOD_MAP, EXCLUDED_PLATFORM_VALUES, apostrophe stripping
- Blog system live: /blog index, /blog/[slug] MDX, first post /blog/the-reservation-economy
- public/llms.txt created; IndexNow verified with Bing; bulk URL submission complete
- Google Search Console top 25 pages submitted; Bing Webmaster sitemap submitted
- Restaurant photos live: google_place_id populated for all 192, photo_override_url/photo_position/photo_height columns added, /admin/photos picker built
- All 192 restaurant notes complete
- L004 closed: /drops and /plan migrated to computeNextDropDate from lib/dropDate.js
- NSI SevenRooms slugs corrected: thecornerstore, theeightysix, 450wbroadway — opportunistic monitor now has valid venue identifiers

### Session — May 17, 2026
- SEO audit run via Claude Code: score 67/100 (up from 58/100 pre-Phase 4). Full report saved as FULL-AUDIT-REPORT.md, action plan as ACTION-PLAN.md in repo root.
- Shipped audit items C1, C2, C3, C4, H1, H2, H3, H4 in one Claude Code pass: fixed stale /how-it-works CTA, added per-post OG images via Next.js ImageResponse, added image to restaurant JSON-LD, removed deprecated sitemap tags, fixed restaurant schema description fallback and mainEntityOfPage, fixed Article schema mainEntityOfPage and publisher.logo, collapsed neighborhood/platform breadcrumbs to 2 levels, fixed PremiumReveal stale placeholder date.
- Shipped audit items M2, M3, M4, M5, L1 (skipped, no telephone column), L4, L5, L7 in second Claude Code pass: homepage hero CTA, restaurant count in hero, Organization schema logo/sameAs/@id, blog CTA destinations fixed to /signup, lock emoji replaced with gold SVG, price added to /drops upsell, last verified signal added to restaurant pages.
- H5 resolved: Carbone and Via Carota notes corrected from "30 days out" to "31 days out" directly in DB via Supabase MCP. observed_days was correct at 31; notes were stale.
- Do-not-touch list clarified: restriction is editorial, not factual. Day count corrections are permitted.
- Two new blog posts published: /blog/reservation-shadow-market and /blog/who-gets-the-table (cultural history piece).
- OpenTable Inngest function failing with "No function ID found in request" — GitHub Actions version is the active monitor. Inngest cron for OpenTable should be investigated and disabled if redundant.
- Corima and Lilia monitor flags resolved.

### Session — May 13, 2026
- OpenTable availability monitor built: lib/monitors/opentable.js, lib/inngest/opentableDailyCheck.js
- Inngest now serves 5 functions: added opentable-daily-check, daily 5 PM UTC
- opentable_restaurant_id INTEGER column added to restaurants table
- 18 restaurant IDs populated via website scraping (restref parameter from OT widget embeds)
- 10 additional IDs populated: bad-roman, bar-contra, bondst, casa-mono, gage-tollner, le-veau-dor, roscioli-nyc, yingtao, zou-zous, aska (28/29 total; jean-georges still null)
- Monitor handles BlockedAvailability, NoTimesExist, and experience-only (Aska/Yingtao) response patterns
- Jean-Georges opentable_restaurant_id set to 3154 — OpenTable monitor now covers all 28 restaurants (excluding Aska and Yingtao pending experience-slot strategy)
- Mobile layout: /drops and /plan tables scaled 70% on mobile with abbreviated date format
- Blog post published: /blog/rolling-windows-and-monthly-drops
- GA4 key events added: signup, subscribe, alert_set
- Phase 4A Traffic + Marketing strategy documented in scoopd.md

### Session — May 18, 2026
- SEO items L3 and L8 shipped: blog author byline added, ItemList schema on /drops page.
- H5 resolved via Supabase MCP: Carbone and Via Carota notes corrected from "30 days out" to "31 days out." observed_days was authoritative.
- scoop TEXT column added to restaurants table via Supabase MCP.
- ScoopNote component built: renders in right column beside data cards when r.scoop is non-null, invisible when null. Sentence-divider design treatment, gold label, matches data card container styling.
- Six restaurants populated with scoop content via Supabase MCP after editorial review: carbone, lilia, via-carota, don-angie, torrisi, 4-charles-prime-rib.
- Key editorial rules: observed_days is always authoritative regardless of what platforms or restaurants claim. Don Angie moved from Resy to OpenTable in May 2025 — any guide pointing to Resy is out of date. 4 Charles has no walk-in program. Don Angie lunch service Fri-Sun is not called brunch. Via Carota holds walk-in tables at dinner, not fundamentally a walk-in restaurant.
- ScoopNote design is not final — deferred until traffic warrants revisiting. Content is approved and correct.
- OpenTable Inngest cron still failing with No function ID found in request — GitHub Actions version is the active monitor, Inngest version is orphaned. Needs investigation and cleanup.

### Session — May 21, 2026
- DoorDash availability monitor built: lib/monitors/doordash.py, app/api/doordash-check/route.js, .github/workflows/doordash-check.yml. Watches reservation_filters endpoint for Corner Store, The Eighty Six, Or'Esh. Detects when dates leave unavailable_dates array. Slot count via merchant/details endpoint. Auth: ddweb_token cookie only via curl_cffi Chrome TLS impersonation.
- Self-hosted Mac runner registered for GitHub Actions (label: self-hosted,mac). Required for both DoorDash (Cloudflare) and OpenTable (Akamai) monitors — datacenter IPs blocked by both. launchd service with KeepAlive=true at ~/Library/LaunchAgents/actions.runner.scoopdnyc-scoopd.mac-local.plist.
- OpenTable monitor fixed: switched opentable-daily-check.yml from ubuntu-latest to self-hosted runner. Akamai bypass confirmed, HTTP 200 from GraphQL API.
- Inngest opentable-daily-check removed. Was orphaned and failing daily. GitHub Actions is the active monitor. Inngest now serves exactly 4 functions.
- reservation_store_ids confirmed: corner-store 28147fe3-96cf-4826-af76-e54872b4e248, the-86 a0b42bce-c259-483a-bf70-1729bbc3d5e4, oresh 0128c310-5d6e-4cac-95a2-291a356f7dca.
- GSC: average position mid-50s, zero clicks in 2 months. Root cause is page-type mismatch, not technical. M6 content work is the next needle-mover.
