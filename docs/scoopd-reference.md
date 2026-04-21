# Scoopd Reference

Full reference material for the Scoopd platform. Extracted from CLAUDE.md so the
operating rules file stays scannable. Read this when you need schema details,
phase history, design system values, or environment variable reference.

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

Note: ADMIN_PASSWORD will be added as a server-only environment variable.

## Database Schema

### restaurants table (key fields)
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
- notes — editorial description. ~140 restaurants have hand-written copy. If null, auto-sentence is generated. Do not overwrite existing notes with scripts without explicit instruction. Do-not-touch list: 4 Charles Prime Rib, Bemelmans Bar, Bistrot Ha, Carbone, Cote, Double Chicken Please, Eleven Madison Park, Ha's Snack Bar, Jeju Noodle Bar, Joo Ok, Lilia, Minetta Tavern, Tatiana, Theodora, Torrisi, Via Carota.
- address — full street address, populated via Google Places API
- beli_score — numeric
- non_standard_inventory — boolean, set true for restaurants with non-standard inventory patterns

### subscriptions table
- user_id — references auth.users
- stripe_customer_id
- stripe_subscription_id
- status — active or inactive
- current_period_end
- founding_member — boolean, true if user subscribed via /founding at founding rate

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
- ~192 active restaurant rows in DB
- Editorial notes complete for all non-walk-in restaurants; walk-ins in progress

### Phase 2 — Complete
- Stripe module-level initialization fixed in checkout, portal, and webhook routes
- /forgot-password and /reset-password pages built
- Founding member system: /founding page, checkout route with founding flag and re-entry gate, webhook writes founding_member, founding_member column in Supabase subscriptions table, all four Stripe live price IDs in Vercel
- ScoopNav two-bar system: The Scoop pill top bar + ScoopSubBar with auth links and open/close animation
- /signup rebuilt as subscription pricing page (monthly $9.99, yearly $60)
- /alerts placeholder page built as The Dish coming soon page
- ScoopFooter added to all 15 pages (Terms + Privacy links)
- /terms and /privacy pages built with full legal copy, noindex
- Stripe live mode fully configured, customer portal configured with Terms and Privacy URLs
- Resend domain verified, RESEND_API_KEY in Vercel
- Zoho Mail configured, support@scoopd.nyc inbox live

### Phase 3 — Drop Intelligence (Complete)
- /drops page — live, premium gated. Shows every restaurant dropping today sorted by drop time ET. Free users see restaurant name, neighborhood, platform, drop time, and difficulty. The "Opens For" date column is blurred with lock icon for free users. Banner copy prompts conversion.
- /plan page — live, premium gated. User enters a target dinner date; page returns every restaurant whose reservation window hasn't opened for that date yet, with exact drop date and time. Free users see restaurant name, neighborhood, platform, drop time, and difficulty unblurred; drop date column is blurred with lock icon.
- Alerts system — DEFERRED to Phase 4 until user base grows
  - Design spec preserved in Alerts System Design section below
  - Will revisit when there is sufficient subscriber volume to justify the infrastructure
- Availability probability data — not started
- Corner Store observed_days unconfirmed

### Phase 4 — Editorial + SEO (in progress)

**SEO — Complete:**
- Dynamic meta titles and descriptions on all public pages
- Open Graph and Twitter card tags on all public pages
- Default metadata in layout.js with metadataBase set to https://scoopd.nyc
- Sitemap correct and live at /sitemap.xml
- Google Analytics connected via Next.js Script component
- Google site verification TXT record in DNS
- JSON-LD structured data (schema.org Restaurant) live on all restaurant pages
- Street addresses added to all 192 restaurants via Google Places API, stored in address column
- robots.txt added blocking /_next/static/ and /api/
- Key pages manually submitted for indexing in Google Search Console
- Neighborhood internal linking live on all restaurant pages (random, up to 4 per page)
- Share button live on all restaurant pages

**SEO — Still to build:**
- Search-optimized content — pages or blog posts targeting high-intent queries like "how to get a Carbone reservation" or "Lilia reservation tips"
- Backlink strategy — outreach to Eater NY, Grub Street, The Infatuation, and NYC food newsletters to generate domain authority
- Restaurant photos — images on restaurant pages improve click-through from search results

**Editorial — Not started:**
- Blog layer behind paywall
- Topics identified: secondary market economics, reservation scalping, platform risk, execution guide (how to actually win a reservation once you know when it drops)
- Restaurant photos

### Phase 5 — Scale (not started)
- AdSense and sponsorships
- scoopd.com domain
- Expansion beyond NYC
- Monitor Snag Reservations for SEO competition
- Amex Platinum and Chase Sapphire Reserve affiliate links launch with Phase 2 freemium
- Native iOS/Android app
  - Dual pricing: $12.99/month in-app, $9.99/month web
  - Token/reward system tied to data contributions (verified drop times, schedule changes, referrals, reviews, birthday, restaurant suggestions)
  - In-app token balance and redemption UI
  - Rewards: free months, account credits, premium access extensions, early alert access
  - Crowdsourced data model: users earn by improving platform intelligence, keeping drop times current
  - Push notifications for token earnings, reward milestones, and drop alerts
  - Token/reward system is native app only, not built on web

## Founding Member System

- /founding page — noindex, not linked from site navigation, distributed via direct URL only
- Founding rate: $2.99/month or $18/year — permanent for the life of the subscription while active
- Forfeiture rule: founding rate is permanently and irrevocably forfeited if subscription is ever canceled for any reason; any resubscription is billed at standard rate
- Standard rate: $9.99/month or $60/year
- founding_member boolean column in subscriptions table — set to true by webhook on checkout.session.completed when founding metadata is "true"
- Re-entry gate in checkout route: if founding=true but founding_member=true and status=inactive, founding is overridden to false so canceled founding members cannot reclaim the rate
- All four Stripe live price IDs (standard month, standard year, founding month, founding year) are in Vercel env vars

## Alerts System Design (Deferred to Phase 4)

- Inngest for scheduling (free tier, easy to migrate to Vercel Pro cron later)
- Resend for email (3,000/month free tier)
- Digest format: one email per release time group, all restaurants alerting at that time
- Fires 5 minutes before drop time ET
- Bell icon UI on restaurant page, premium only
- Free users see bell but get prompted to subscribe
- /account page manages active alerts

## Competitive Context

- Resy API endpoint: https://api.resy.com/3/venue?url_slug={slug}&location=new-york-ny
- Authorization header required: ResyAPI api_key="VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5"
- Main competitors: Resx (reservation exchange, TOS violations), Quenelle.ai (content farm), Snag Reservations (SEO competitor, monitor)
- Scoopd's defensible position: verified intelligence, diner's side, no restaurant advertising, crowdsourced data moat at scale
- Stripe live mode active, customer portal configured with Terms and Privacy policy URLs
- Zoho Mail: support@scoopd.nyc inbox live
- Resend: sending from noreply@scoopd.nyc, domain verified

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

## Non-Standard Inventory (NSI)

- non_standard_inventory boolean column added to restaurants table
- Set true for: corner-store, the-86, oresh
- NsiField component built at app/components/NsiField.js
- Blue-gray tint on release time and days out cards when flag is true
- Info icon with hover/click callout on those two fields
- Callout text: "This restaurant opens its booking window on a set schedule but has not released general availability inventory with an observable pattern. Read how booking actually works here."
- Blog stub at app/blog/how-catch-hospitality-reservations-work/page.js — content TBD, URL may be shortened

## Content Status

- ~192 restaurants total in DB; editorial notes complete for all Tock, Resy, OpenTable, DoorDash, Phone, and Own Site restaurants as of April 2026
- Walk-in restaurants: notes in progress
- Notes sourcing method: minimum 3 sources required (Michelin, restaurant website, press coverage). Never fabricate. Never plagiarize. Rewrite from scratch using sources as reference only.
- Saga added as a separate restaurant entry (two Michelin stars, Chef Charlie Mitchell, 63rd floor 70 Pine Street, Resy)
- Cote 550 added as a separate restaurant entry (550 Madison Avenue, Resy, 14 days out, 10 AM)

## Session Updates — April 18-19, 2026

### New Restaurants Added
- Saga (slug: saga) — two Michelin stars, Chef Charlie Mitchell, 63rd floor 70 Pine Street Financial District, Resy, 10 AM, 1st of month 2 absolute months, Medium difficulty, $$$$
- Cote 550 (slug: cote-550) — Simon Kim's second Manhattan location, 550 Madison Avenue Midtown, Resy, 10 AM, 14 days out, Very Hard difficulty, $$$

### Notes Completed This Session
- Corner Store, The Eighty Six, Or'Esh — full rewrites in Scoopd voice
- Jean-Georges — written and pushed
- Saga — written and pushed with note
- Cote 550 — written and pushed with note
- All Tock, DoorDash, and previously incomplete OpenTable restaurants written and pushed earlier in extended session

### Booking Line Corrections
- 18 booking line errors corrected across existing notes via targeted replace script
- Critical rule: booking intel must always come from observed_days and release_time in Supabase DB, never from third-party sources

### Deferred Tasks
- Need to Know box system — deferred to later update, needs full policy data sourced across 190+ restaurants before building
- Catch Hospitality blog post — deferred, mechanic needs to be properly understood before writing
- Walk-in notes (14 remaining) — not started
- OpenTable notes (13 remaining) — not started
- Others: Crown Shy, Hillstone, Sushi Ginza Onodera, Don Peppe, Din Tai Fung — not started
