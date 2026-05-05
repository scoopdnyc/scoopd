# Scoopd — Session Log

Working document. Updated every session. Tracks what was built, what's pending, current phase status, and file structure. For deep technical reference (schema, monitor algorithms, design system, founding system, legal) see scoopd-reference.md.

---

## Current Status — May 2026

- Phase 1: Complete
- Phase 2: Complete
- Phase 3: Complete (including alerts)
- Phase 4: Complete (SEO + editorial)
- Phase 5: Not started
- Availability monitor: Live (Resy + SevenRooms). OpenTable not built.
- 192 restaurants in DB. All notes complete as of May 2026.

---

## Open Tasks

- **OpenTable monitor** — not built. Requires GraphQL query body captured from network tab before implementation can begin.
- **Blog content** — only one post live (`/blog/the-reservation-economy`). High ROI backlog item.
- **Need to Know box system** — deferred. Needs full policy data sourced across 192 restaurants before building.
- **Catch Hospitality blog post** — deferred. Mechanic needs to be properly understood before writing.
- **Backlink outreach** — Eater NY, Grub Street, The Infatuation, NYC food newsletters. Not started.

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
- Resy: Live. 119 restaurants, daily at 12:30 PM ET via Inngest.
- SevenRooms rolling: Live. Adda, Dhamaka, Semma, Masalawala & Sons, Noz 17.
- SevenRooms long calendar: Live. Marea, Rezdora. Daily at 12:30 PM ET.
- SevenRooms monthly: Live. Sushi Noz only. Runs 1st and 15th of month at 2 PM UTC.
- NSI opportunistic: Live. Corner Store, Or'Esh, The 86. Every 5 minutes noon–6 PM ET via GitHub Actions.
- OpenTable: Not built. Requires GraphQL query body from network tab first.

### Infrastructure
- Inngest (free tier): resy-daily-check, sevenrooms-daily-check, sevenrooms-longcal-monthly-check, alert-digest (4 functions total, confirmed in dashboard)
- GitHub Actions: `.github/workflows/opportunistic-check.yml` — NSI check every 5 minutes noon–6 PM ET, secured via CRON_SECRET bearer token
- Resend: digest emails to support@scoopd.nyc
- All monitor state written to `monitor_log` table

### Known Issues
- Lilia: known false positive (closed day compression)
- Cafe Spaghetti: known false positive (temporary closure)
- Rezdora: observed_days corrected from 30 to 31 (first monitor catch)

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
- `inngest/route.js` — serves 4 Inngest functions
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
