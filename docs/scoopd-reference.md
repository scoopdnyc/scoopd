# Scoopd Reference

Full reference material for the Scoopd platform. Extracted from scoopd.md so the operating rules file stays scannable. Read this when you need schema details, phase history, design system values, monitor algorithms, or environment variable reference.

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
- NEXT_PUBLIC_STRIPE_PRICE_ID (standard monthly $9.99 price ID)
- STRIPE_STANDARD_PRICE_YEAR (standard yearly $60 price ID)
- STRIPE_FOUNDING_PRICE_MONTH (founding member monthly $2.99 price ID)
- STRIPE_FOUNDING_PRICE_YEAR (founding member yearly $18 price ID)
- STRIPE_WEBHOOK_SECRET
- NEXT_PUBLIC_SITE_URL
- RESEND_API_KEY
- GOOGLE_PLACES_API_KEY
- ADMIN_PASSWORD (server-only)
- CRON_SECRET (GitHub Actions opportunistic monitor auth)

## Database Schema

### restaurants table
- restaurant — display name
- slug — URL slug (e.g. carbone). Note: Sartiano's DB slug is sartriano (legacy typo, Resy slug is sartianos — already reconciled in DB, do not change)
- neighborhood — NYC neighborhood
- platform — Resy, OpenTable, DoorDash, Walk-in, Phone, CLOSED
- cuisine — cuisine type
- release_time — e.g. 10:00 AM, 12:00 AM
- observed_days — integer, rolling window in days, sole public-facing days-out field
- release_schedule — text, for monthly restaurants only e.g. 1st of the month
- seat_count — integer
- michelin_stars — text
- price_tier — $, $$, $$$, $$$$
- difficulty — Easy, Medium, Hard, Very Hard, Extremely Hard
- notes — editorial description. All 192 restaurants have hand-written copy as of May 2026. If null, auto-sentence is generated. Do not overwrite existing notes with scripts without explicit instruction. Do-not-touch list: 4 Charles Prime Rib, Bemelmans Bar, Bistrot Ha, Carbone, Cote, Double Chicken Please, Eleven Madison Park, Ha's Snack Bar, Jeju Noodle Bar, Joo Ok, Lilia, Minetta Tavern, Tatiana, Theodora, Torrisi, Via Carota.
- address — full street address, populated via Google Places API
- beli_score — numeric
- non_standard_inventory — boolean, set true for restaurants with non-standard inventory patterns (Corner Store, The Eighty Six, Or'Esh)
- google_place_id — text, populated for all 192 restaurants
- photo_override_url — text, optional manual photo URL override
- photo_position — text, focal point for photo crop
- photo_height — integer, display height control
- last_updated_at — timestamp, used by sitemap for real lastmod values
- resy_venue_id — numeric Resy venue ID, used by availability monitor
- resy_slug — override for known Resy slug mismatches (cote→cote-nyc, saga→saga-ny, saga-lounge→saga-the-lounge-and-terraces, sartriano→sartianos)
- sevenrooms_slug — SevenRooms venue slug
- sevenrooms_type — rolling, long_calendar, or null (for monthly/NSI restaurants)

### subscriptions table
- user_id — references auth.users
- stripe_customer_id
- stripe_subscription_id
- status — active or inactive
- current_period_end
- founding_member — boolean, true if user subscribed via /founding at founding rate

### monitor_log table
- id
- restaurant_id — integer, foreign key to restaurants
- platform
- checked_at
- api_verified_days
- expected_days
- flagged
- flag_reason
- raw_value

## Design System

### Colors
- Background: #0f0f0d
- Text primary: #e8e4dc
- Text secondary: #8a8a80
- Gold accent: #c9a96e
- Border: #2a2a26

### Fonts
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
- Directory, restaurant pages, badge system, admin form
- Five-tier difficulty badge color system
- Difficulty-primary sort order
- Auto-generated booking sentences
- Notes field surfaced as styled description card with gold accent bar
- Days-out display using observed_days with release_schedule fallback
- 192 active restaurant rows in DB

### Phase 2 — Complete
- Stripe module-level initialization fixed in checkout, portal, and webhook routes
- /forgot-password and /reset-password pages built
- Founding member system: /founding page, checkout route with founding flag and re-entry gate, webhook writes founding_member, founding_member column in Supabase subscriptions table, all four Stripe live price IDs in Vercel
- ScoopNav two-bar system: The Scoop pill top bar + ScoopSubBar with auth links and open/close animation
- /signup rebuilt as subscription pricing page (monthly $9.99, yearly $60)
- /alerts placeholder page built as The Dish coming soon page
- ScoopFooter added to all pages (Terms + Privacy links)
- /terms and /privacy pages built with full legal copy, noindex
- Stripe live mode fully configured, customer portal configured with Terms and Privacy URLs
- Resend domain verified, RESEND_API_KEY in Vercel
- Zoho Mail configured, support@scoopd.nyc inbox live

### Phase 3 — Drop Intelligence (Complete)
- /drops page — live, premium gated. Shows every restaurant dropping today sorted by drop time ET. Free users see restaurant name, neighborhood, platform, drop time, and difficulty. The "Opens For" date column is blurred with lock icon for free users.
- /plan page — live, premium gated. User enters a target dinner date; page returns every restaurant whose reservation window hasn't opened for that date yet, with exact drop date and time. Free users see restaurant name, neighborhood, platform, drop time, and difficulty unblurred; drop date column is blurred with lock icon.
- Alerts system — Complete. Inngest scheduling, Resend email digest, bell icon UI on restaurant pages (premium only), /account page alert management.
- Availability monitor — Complete. See Availability Monitor section below.

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

### Phase 5 — Scale (not started)
- AdSense and sponsorships
- scoopd.com domain
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

## Availability Monitor

### Operational Rules
- Monitor flags trigger manual investigation only. Never update observed_days or any DB field based solely on a monitor alert. Verify directly before making any change.

### Infrastructure
- Inngest (free tier) handles scheduling for daily checks and monthly Sushi Noz check
- GitHub Actions handles NSI opportunistic check every 5 minutes noon-6 PM ET
- Resend sends digest emails to support@scoopd.nyc
- All monitor state written to monitor_log table (separate from restaurants table)

### Resy monitor (lib/monitors/resy.js)
- Hits /4/venue/calendar endpoint with venue_id
- Parses last_calendar_day using backwards walk on inventory.reservation
- Strips event-only trailing dates (reservation: not available)
- Tolerates closed days within window
- 119 restaurants monitored, fires daily at 12:30 PM ET
- Known false positives: Lilia (closed day compression), Cafe Spaghetti (temporary closure)

### SevenRooms rolling monitor (lib/monitors/sevenrooms.js checkRolling)
- 2-probe range endpoint approach
- Probe 1: today + (observed_days - 1) — flags if zero slots
- Probe 2: today + (observed_days + 3) — flags only on type:"book" with non-null access_persistent_id
- Covers: Adda, Dhamaka, Semma, Masalawala & Sons, Noz 17
- NSI restaurants (Corner Store, Or'Esh, The 86) return HTTP 400 — handled by opportunistic monitor instead

### SevenRooms long calendar monitor (lib/monitors/sevenrooms.js checkLongCalendar)
- Binary search ±7 days around observed_days
- Looks for last date with type:"book" and non-null access_persistent_id
- Covers: Marea, Rezdora
- Runs daily at 12:30 PM ET via sevenroomsDailyCheck

### SevenRooms monthly monitor (lib/inngest/sevenroomsLongCalMonthlyCheck.js)
- Covers Sushi Noz only
- Runs on 1st and 15th of each month at 2 PM UTC
- Expected boundary calculated dynamically — last day of month 2 months ahead
- observed_days left null for Sushi Noz — not used
- Binary search ±30 days around expected boundary
- Flags if detected boundary differs from expected by more than 3 days

### NSI opportunistic monitor (lib/monitors/sevenrooms-opportunistic.js)
- Covers Corner Store, Or'Esh, The 86 (non_standard_inventory = true)
- Fires every 5 minutes noon-6 PM ET via GitHub Actions (.github/workflows/opportunistic-check.yml)
- Endpoint: /api/opportunistic-check secured with CRON_SECRET bearer token
- Alerts immediately on any type:"book" slot with non-null access_persistent_id
- Has never detected a bookable slot — slots are extremely rare

### OpenTable monitor
Not built — requires GraphQL query body captured from network tab before implementation can begin.

## Alerts System

Status: Complete as of May 2026.

- Inngest for scheduling
- Resend for email (3,000/month free tier)
- Digest format: one email per release time group, all restaurants alerting at that time
- Fires 5 minutes before drop time ET
- Bell icon UI on restaurant page, premium only
- Free users see bell but get prompted to subscribe
- /account page manages active alerts

## Non-Standard Inventory (NSI)

The `non_standard_inventory` boolean column flags restaurants whose booking window opens on a set schedule but without an observable general availability pattern.

Restaurants currently flagged: `corner-store`, `the-86`, `oresh`

Component: `app/components/NsiField.js` renders the release time and days-out fields with a blue-gray tint and an info callout when this flag is true.

Callout text: "This restaurant opens its booking window on a set schedule but has not released general availability inventory with an observable pattern. Read how booking actually works here."

Blog stub: `app/blog/how-catch-hospitality-reservations-work/page.js` (content TBD)

## Founding Member System

- /founding page — noindex, not linked from site navigation, distributed via direct URL only
- Founding rate: $2.99/month or $18/year — permanent for the life of the subscription while active
- Forfeiture rule: founding rate is permanently and irrevocably forfeited if subscription is ever canceled for any reason; any resubscription is billed at standard rate
- Standard rate: $9.99/month or $60/year
- founding_member boolean column in subscriptions table — set to true by webhook on checkout.session.completed when founding metadata is "true"
- Re-entry gate in checkout route: if founding=true but founding_member=true and status=inactive, founding is overridden to false so canceled founding members cannot reclaim the rate
- All four Stripe live price IDs (standard month, standard year, founding month, founding year) are in Vercel env vars

## Content Status

- 192 restaurants in DB; editorial notes complete for all restaurants as of May 2026
- Notes sourcing method: minimum 3 sources required (Michelin, restaurant website, press coverage). Never fabricate. Never plagiarize. Rewrite from scratch using sources as reference only.
- Do-not-touch list (notes must never be overwritten by scripts): 4 Charles Prime Rib, Bemelmans Bar, Bistrot Ha, Carbone, Cote, Double Chicken Please, Eleven Madison Park, Ha's Snack Bar, Jeju Noodle Bar, Joo Ok, Lilia, Minetta Tavern, Tatiana, Theodora, Torrisi, Via Carota

## Competitive Context

- Resy API endpoint: https://api.resy.com/3/venue?url_slug={slug}&location=new-york-ny
- Authorization header required: ResyAPI api_key="VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5"
- Main competitors: Resx (reservation exchange, TOS violations), Quenelle.ai (content farm), Snag Reservations (SEO competitor, monitor)
- Scoopd's defensible position: verified intelligence, diner's side, no restaurant advertising, crowdsourced data moat at scale

## Legal

- Terms of Service at /terms — noindex
- Privacy Policy at /privacy — noindex
- Both linked in ScoopFooter on every page
- Effective date: April 10, 2026
- Governing law: State of New York
- No refunds policy for any subscription fees paid
- Arbitration clause: binding individual arbitration via JAMS, New York County; class action waiver
- GDPR, CCPA, Nevada resident rights included
- support@scoopd.nyc is the official contact address for all legal, support, and data requests
