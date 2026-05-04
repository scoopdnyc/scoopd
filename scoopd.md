# Scoopd Session Log

---

## Session — April 27, 2026

### Alerts System ("The Dish") — Shipped

Full build from scratch. Two DB migrations: `restaurant_alerts` table (user_id, restaurant_slug, UNIQUE constraint) and `alert_log` table (user_id, restaurant_slug, release_window_key UNIQUE, sent_at). RLS policies on both.

API routes:
- `GET /api/alerts` — auth + premium check, returns alert list
- `POST /api/alerts/toggle` — auth + premium check, upserts/deletes alert, returns `{ active }`

Components:
- `app/components/AlertBell.js` — client component, five states (loading/guest/free/active/inactive), optimistic toggle with revert on failure. Guest links to /signup, free links to /account. Bell SVG always gold (#c9a96e), active state fills button gold.
- `app/components/AlertBell.css` — gold outline pill, gold fill when active

Pages:
- `app/alerts/page.js` — server component, force-dynamic, four render states (guest/free/empty/list), drop date via computeNextDropDate, td- CSS prefix
- `app/alerts/AlertsList.js` — client component, optimistic remove
- `app/account/page.js` — added "Manage your drop alerts" link inside active subscription card

Email:
- `lib/email/alertDigest.js` — Resend send via fetch, mirrors monitorDigest.js pattern
- `lib/inngest/alertDigest.js` — cron every 5 minutes, step 1: find restaurants with release_time in (now, now+5min] ET, step 2: join alerts + subscriptions + resolve emails, step 3: INSERT alert_log with dedup on release_window_key (unique violation = skip), rollback log row on Resend failure
- `app/api/inngest/route.js` — alertDigest added, now serves 4 functions

Inngest synced: 3 functions to 4 functions confirmed in dashboard.

Restaurant page layout updated: AlertBell moved from hero footer to new "Booking Intelligence" heading row, suppressed for walk-in restaurants.

### Drop Date Calc — Extracted

`lib/dropDate.js` created as single source of truth for drop date calculation. Restaurant page now imports `computeNextDropDate`. Alerts page and alertDigest cron also import it. L004 added to `tasks/lessons.md`: `app/drops/page.js` and `app/plan/PlanClient.js` still have inline copies — migrate next time those files are touched.

### Monitor System

All four Inngest functions live: resy-daily-check, sevenrooms-daily-check, sevenrooms-longcal-monthly-check, alert-digest. First monitor catch: Rezdora observed_days corrected 30 to 31.

### Editorial Notes

Una Pizza Napoletana: note pushed (naturally leavened dough, 30+ hour ferment, Thursday-Saturday only, world's best 2022/2024/2025, one pizza per diner, 9 AM / 15 days out). michelin_stars set to null (no star, never awarded).

Crown Shy: note pushed. Jassimran Singh context, James Kent obit, bhatura/pork katsu/char siu lamb shoulder, Resy 10 AM 29 days out.

Muku: note pushed. Asanuma background (o.d.o., Uchu), Tribeca September 2025, Michelin star two months post-open (fastest on record NYC), 10-course $295, five classical Japanese techniques, OpenTable midnight, 1st of month. DB corrected: neighborhood Tribeca, non_standard_inventory true, release_schedule "1st of Month, 2 absolute months", observed_days null.

Bar Miller: note pushed. Jeff Miller and TJ Provenzano, follow-up to Rosella, all-American sourcing (NC bigeye, MA mackerel, ME uni, Hudson Valley rice, CT soy sauce), 8-seat counter, 15 courses $250, OpenTable midnight 31 days out.

Kochi: note pushed. Sungchul Shim background (Per Se, Le Bernardin, Bouley), Hell's Kitchen late 2019, kochi means skewer, 8-course tasting menu, wagyu/kimchi/abalone, OpenTable midnight 31 days out.

Sushi Ginza Onodera: removed from DB. Closed August 2023, confirmed via Yelp update November 2025.

### Pending

- `app/drops/page.js` and `app/plan/PlanClient.js` inline drop date copies (L004)
- OpenTable monitor not built (requires GraphQL query body from network tab)

---

## Session — May 4, 2026

### SEO Overhaul — Complete

All critical and high-priority items from the April 2026 SEO audit resolved. See Phase 4 section below for full list.

### Neighborhood and Platform Category Pages

`/neighborhood/[name]` and `/platform/[name]` static ISR pages. `lib/slugify.js` rewritten: apostrophe stripping, NEIGHBORHOOD_MAP expanded to 44 entries, `EXCLUDED_PLATFORM_VALUES` exported as shared constant.

### Blog System

`/blog` index and `/blog/[slug]` MDX route. First post: `/blog/the-reservation-economy` with inline links to Torrisi and Don Angie. `/how-it-works` Further Reading section added.

### Restaurant Photos

`google_place_id` populated for all 192 restaurants. Three new columns: `photo_override_url`, `photo_position`, `photo_height` (default 420). `/admin/photos` photo picker: lazy-loaded full photo grid from Google Places, drag focal point cropper, height slider, override URL input.

### Editorial

Notes complete for all 192 restaurants as of May 2026.

---

## Supabase Clients

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
- `lib/supabase-browser.js`
- `lib/supabase-server.js`
- `lib/supabase-static.js`
- `lib/email/alertDigest.js`
- `lib/inngest/alertDigest.js`

### app/components/

- `AlertBell.js` / `AlertBell.css` — drop alert bell, five states
- `NsiField.js` — non-standard inventory field with info callout
- `PremiumReveal.js` — client component for auth-gated content on ISR pages (co-located in `restaurant/[slug]/`)
- `ScoopNav.js`, `ScoopFooter.js`, `ShareButton.js`

### app/ routes

- `restaurant/[slug]/` — ISR, revalidate=3600
- `neighborhood/[name]/` — neighborhood category pages, ISR, ItemList + BreadcrumbList JSON-LD
- `platform/[name]/` — platform category pages, ISR, ItemList + BreadcrumbList JSON-LD
- `blog/` — blog index, ISR
- `blog/[slug]/` — MDX blog posts, Article schema, ISR, canonical
- `drops/` — force-dynamic, premium gate on Opens For column
- `plan/` — force-dynamic, premium gate on Drop Date column
- `alerts/` — force-dynamic, premium-only
- `account/` — force-dynamic
- `admin/` — password-gated admin tools
- `admin/photos/` — photo picker UI (page.js, PhotoPicker.js, photos.css)

### app/api/admin/

- `auth/route.js` — validates ADMIN_PASSWORD, sets admin_auth cookie
- `add-restaurant/route.js`
- `photos/[placeId]/route.js` — fetches Google Places photo grid
- `set-photo/route.js`
- `set-photo-position/route.js`
- `set-photo-height/route.js`

### public/

- `llms.txt` — AI crawler preferences and site structure signal
- `80563e7a19f14b0189e97bab4a8ab0db.txt` — IndexNow key file

---

## Database Schema

### restaurants table (key fields)

- `restaurant` — display name
- `slug` — URL slug
- `neighborhood`, `platform`, `cuisine`
- `release_time` — ET time string (e.g. "10:00 AM")
- `observed_days` — integer; only public days-out field
- `release_schedule` — text; internal use only, never exposed as a number
- `seat_count`, `michelin_stars`, `price_tier`, `difficulty`
- `notes` — editorial copy
- `address`, `google_place_id`
- `non_standard_inventory` — boolean; true for Corner Store, The Eighty Six, Or'Esh
- `photo_override_url` — text; optional manual photo URL override
- `photo_position` — text; focal point for photo crop (CSS object-position value)
- `photo_height` — integer; banner display height in px (default 420)
- `last_updated_at` — timestamp; used by sitemap for real lastmod values

### restaurant_alerts table

- `user_id`, `restaurant_slug`, UNIQUE(user_id, restaurant_slug)

### alert_log table

- `user_id`, `restaurant_slug`, `release_window_key` (UNIQUE), `sent_at`

### subscriptions table

- `user_id`, `stripe_customer_id`, `stripe_subscription_id`, `status` (active/inactive), `current_period_end`

---

## Content Status

- 192 restaurants in DB; editorial notes complete for all restaurants as of May 2026
- Notes sourcing method: minimum 3 sources required (Michelin, restaurant website, press coverage). Never fabricate. Never plagiarize. Rewrite from scratch using sources as reference only.

---

## Editorial Rules

- Scoopd voice: specific, insider, no marketing language, no generic adjectives
- Minimum 3 sources per note (Michelin, restaurant website, press)
- Never fabricate. Never plagiarize. Rewrite from scratch using sources as reference.
- No em dashes anywhere in copy. Use a period, colon, or restructure.
- Auto-generated booking sentence when notes field is null — do not overwrite with null
- all 192 restaurants populated as of May 2026

---

## Phase Status

### Phase 1 — Core Directory (Complete)

Restaurant directory, restaurant pages, difficulty badge system, admin add-restaurant tool.

### Phase 2 — Auth + Monetization (Complete)

Supabase Auth, Stripe subscriptions, premium blur/unlock pattern on drop date, /account page, /signup flow.

### Phase 3 — Dynamic Features (Complete)

- Drops page — live view of today's drops with Opens For (premium gate)
- Plan by date — calendar view of upcoming drops (premium gate)
- Alerts system — Complete. Inngest scheduling, Resend email digest, bell icon UI on restaurant pages (premium only), /account page alert management

### Phase 4 — Editorial + SEO (Complete)

**SEO — Complete:**
- Dynamic meta titles and descriptions on all public pages
- Title deduplication: no trailing | Scoopd on any page
- Canonical URLs on all pages
- Open Graph and Twitter card tags sitewide; twitter:card summary_large_image
- OG images: sitewide default + per-restaurant with difficulty badge color (Next.js ImageResponse)
- ISR caching: revalidate=3600 on restaurant pages; force-static on /how-it-works; supabase-static.js for cookie-free fetches
- Homepage JSON-LD: WebSite (SearchAction) + Organization
- Restaurant JSON-LD: name, servesCuisine, address, priceRange, acceptsReservations, BreadcrumbList
- FAQPage schema on /how-it-works
- H1/H2 semantic headings on restaurant pages; H1 = "[Name] Reservations"
- /signup noindexed and removed from sitemap
- Sitemap with real lastmod timestamps via last_updated_at column
- Neighborhood category pages at /neighborhood/[name] with ItemList + BreadcrumbList JSON-LD
- Platform category pages at /platform/[name] with ItemList + BreadcrumbList JSON-LD
- Blog system: /blog index + /blog/[slug] MDX with Article schema, ISR, canonical
- First blog post: /blog/the-reservation-economy (links to Torrisi and Don Angie)
- /how-it-works Further Reading section linking to blog
- public/llms.txt for AI crawler signal
- IndexNow key file created, verified with Bing, bulk URL submission completed
- Google Search Console: top 25 pages manually submitted
- Bing Webmaster Tools: sitemap submitted
- Restaurant photos live on all pages: google_place_id, photo_override_url, photo_position, photo_height columns; /admin/photos picker with lazy load, focal point cropper, height slider
- robots.txt blocking /_next/static/ and /api/
- Google Analytics via Next.js Script component
- Google site verification TXT record in DNS
- Neighborhood internal linking on all restaurant pages (random, up to 4 per page)
- Share button on all restaurant pages

**SEO — Ongoing backlog:**
- Blog content layer — high ROI; each post targets high-intent queries and links to 5-10 restaurant pages
- Backlink outreach — Eater NY, Grub Street, The Infatuation, NYC food newsletters

### Phase 5 — Growth (Not Started)

AdSense, expand beyond NYC.

---

## Alerts System Design

Status: Complete as of May 2026

The alert digest cron runs every 5 minutes via Inngest. Step 1: find restaurants with `release_time` in (now, now+5min] ET. Step 2: join `restaurant_alerts` + `subscriptions` + resolve user emails. Step 3: INSERT into `alert_log` with dedup on `release_window_key` (UNIQUE violation = already sent, skip). Rollback log row on Resend failure.

Email sent via Resend through `lib/email/alertDigest.js`. Template mirrors `monitorDigest.js` pattern.

Bell icon on restaurant pages: premium-only, five states (loading/guest/free/active/inactive), optimistic toggle with revert on API failure.
