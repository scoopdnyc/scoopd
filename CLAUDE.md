# Scoopd — Project Brief for Claude Code

## What Scoopd Is
Scoopd (scoopd.nyc) is a NYC restaurant reservation intelligence platform. It tracks when hard-to-get restaurants release reservations — the exact platform, time, and days out — and calculates the specific calendar date premium users need to be online to book.

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

## Supabase Clients — Critical
There are three Supabase clients. Use the correct one or auth will break:
- lib/supabase-browser.js — client components only (uses @supabase/ssr, stores session in cookies)
- lib/supabase-server.js — server components and API routes with user context
- lib/supabase.js — sitemap only, do not use anywhere else

## Project File Structure
Claude Code should read the actual directory tree on first load, but the known structure is:

```
app/
  page.js                  — homepage directory
  layout.js                — root layout, fonts, metadata base, Google Analytics
  globals.css              — Tailwind preflight + global resets only
  components/
    ScoopNav.js            — top nav bar, logo left, The Scoop pill right
    ScoopSubBar.js         — secondary auth bar, animates on dropdown open
    ScoopFooter.js         — footer, Terms + Privacy links
    NavSignOut.js          — client component, handles sign out action
  restaurant/[slug]/
    page.js                — individual restaurant page, drop date calc lives here
  drops/
    page.js                — What Drops Today, premium gated
  plan/
    page.js                — Plan by Date / When can I book, premium gated
  how-it-works/
  signup/
  login/
  register/
  account/
  admin/
  founding/
  alerts/
  forgot-password/
  reset-password/
  terms/
  privacy/
  api/
    stripe/
      checkout/route.js
      portal/route.js
      webhook/route.js
lib/
  supabase-browser.js      — client components only
  supabase-server.js       — server components and API routes
  supabase.js              — sitemap only, do not use elsewhere
```

Note: each page typically has a co-located CSS file using the page-specific class prefix convention.

## Shared Components and Patterns

### Premium Gate / Blur Pattern
Free users see a blurred placeholder with a lock icon and a "Get access →" CTA in place of the exact drop date. This pattern is implemented on:
- /restaurant/[slug] — drop date field
- /drops — "Opens For" date column
- /plan — "Drop Date" column

On /drops and /plan, free users see restaurant name, neighborhood, platform, drop time ET, and difficulty badge unblurred. Only the date column is locked. This is intentional — the intelligence is visible, the convenience of the exact date is the premium value.

### Difficulty Badge
Five-tier color system rendered inline. Colors defined in Design System section. Used on restaurant pages and both drop intelligence pages.

### Drop Date Calculation
Canonical implementation is in app/restaurant/[slug]/page.js. Both /drops and /plan reference the same logic. Always use that file as the source of truth — do not reimplement independently.

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

### subscriptions table
- user_id — references auth.users
- stripe_customer_id
- stripe_subscription_id
- status — active or inactive
- current_period_end
- founding_member — boolean, true if user subscribed via /founding at founding rate

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

### CSS Conventions
- Each page uses its own CSS file or inline styles
- Class prefixes match the page: rp- restaurant page, su- signup, lg- login, ac- account, dr- drops
- No Tailwind utility classes in new components — Tailwind preflight is active via globals.css and causes conflicts with inline style tags

## Branding and Navigation
- Two-bar nav system: ScoopNav (top bar: logo left, The Scoop pill right) and ScoopSubBar (secondary bar: auth links, animates inward when dropdown opens)
- The Scoop pill opens a dropdown with three items: The Drop (/drops), The Date (/plan), The Dish (/alerts)
- ScoopFooter on all pages: "© 2026 Scoopd · Terms of Service · Privacy Policy", links to /terms and /privacy
- CSS prefixes: sc- dropdown, sb- subbar, sf- footer, fm- founding, pw- reset-password, fp- forgot-password, td- alerts/The Dish, lg- legal pages (terms/privacy), su- signup, lg- login (shared prefix, separate pages)

## Founding Member System
- /founding page — noindex, not linked from site navigation, distributed via direct URL only
- Founding rate: $2.99/month or $18/year — permanent for the life of the subscription while active
- Forfeiture rule: founding rate is permanently and irrevocably forfeited if subscription is ever canceled for any reason; any resubscription is billed at standard rate
- Standard rate: $9.99/month or $60/year
- founding_member boolean column in subscriptions table — set to true by webhook on checkout.session.completed when founding metadata is "true"
- Re-entry gate in checkout route: if founding=true but founding_member=true and status=inactive, founding is overridden to false so canceled founding members cannot reclaim the rate
- All four Stripe live price IDs (standard month, standard year, founding month, founding year) are in Vercel env vars

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

## Auth Pattern
All server components check auth like this:

const serverSupabase = await createSupabaseServer()
const { data: { user } } = await serverSupabase.auth.getUser()

Then query subscriptions table for isPremium:

const { data: sub } = await serverSupabase
  .from('subscriptions')
  .select('status')
  .eq('user_id', user.id)
  .single()
const isPremium = sub?.status === 'active'

## Drop Date Calculation — Critical Logic
The concept is restaurant current date — each restaurant has its own date that only advances at its release time in ET.

- Get current datetime in America/New_York timezone
- Parse release_time string into hours and minutes ET
- If current ET time is BEFORE release time, restaurant current date is yesterday
- If current ET time is AT OR AFTER release time, restaurant current date is today
- Next bookable date = restaurant current date + observed_days - 1
- Display format: Weekday, Month Day at H:MM AM/PM ET

This logic is already implemented in app/restaurant/[slug]/page.js — reference that file for consistency.

## Nav Auth States
- Not logged in: How it works + Log in + Sign up
- Logged in: How it works + My account + Sign out
- Sign out uses NavSignOut client component from app/components/NavSignOut.js

## Freemium Model
- Free users: see restaurant intelligence — platform, release time, days out, difficulty, description
- Premium users at $9.99/month or $60/year: see calculated exact drop date
- Blur pattern: blurred placeholder + lock icon + Sign up to unlock CTA for free users
- This pattern is implemented on restaurant pages and the drops page

## Pages Built
- / — homepage directory
- /restaurant/[slug] — individual restaurant page
- /how-it-works — editorial explainer
- /signup — subscription page, monthly $9.99 and yearly $60
- /login — Supabase Auth password and magic link, supports ?next= redirect param
- /register — account creation
- /account — subscription management
- /admin — password protected restaurant entry form
- /founding — founding member checkout, noindex, not linked from nav, distributed via direct URL only
- /alerts — The Dish coming soon placeholder, premium gated messaging
- /forgot-password — password reset request page
- /reset-password — password update page, linked from Supabase reset email
- /drops — what drops today, premium gated, live
- /plan — plan by date, premium gated, live
- /terms — Terms of Service, noindex
- /privacy — Privacy Policy, noindex

## API Routes
- /api/stripe/checkout — creates Stripe checkout session, supports founding flag and interval param
- /api/stripe/portal — creates Stripe billing portal session
- /api/stripe/webhook — handles Stripe events, syncs subscriptions table, writes founding_member on checkout.session.completed

## Resend
- Account set up at resend.com
- Domain scoopd.nyc verified
- API key stored as RESEND_API_KEY in .env.local and Vercel
- From address for transactional emails: use noreply@scoopd.nyc
- Free tier: 3,000 emails/month
- Used for: drop alerts (Phase 3), transactional auth emails

## Content Status
- ~192 restaurants total in DB; editorial notes complete for all Tock, Resy, OpenTable, DoorDash, Phone, and Own Site restaurants as of April 2026
- Walk-in restaurants: notes in progress
- Notes sourcing method: minimum 3 sources required (Michelin, restaurant website, press coverage). Never fabricate. Never plagiarize. Rewrite from scratch using sources as reference only.
- Saga needs to be added as a separate restaurant entry (two Michelin stars, Chef Charlie Mitchell, 63rd floor 70 Pine Street, Resy)
- Cote 550 needs to be added as a separate restaurant entry (550 Madison Avenue, Resy, 14 days out, 10 AM)

## Editorial Rules
- No em dashes anywhere in copy
- observed_days is the only public-facing days-out field, not release_schedule
- Auto-generated booking sentence when notes field is null
- Notes field contains hand-written editorial descriptions (~140 restaurants populated as of April 2026)
- Scoopd voice: specific, insider, no marketing language, no generic adjectives
- Do-not-touch restaurants (notes must never be overwritten by scripts):
  4 Charles Prime Rib, Bemelmans Bar, Bistrot Ha, Carbone, Cote, Double Chicken Please,
  Eleven Madison Park, Ha's Snack Bar, Jeju Noodle Bar, Joo Ok, Lilia, Minetta Tavern,
  Tatiana, Theodora, Torrisi, Via Carota

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

### Non-Standard Inventory System
- non_standard_inventory boolean column added to restaurants table
- Set true for: corner-store, the-86, oresh
- NsiField component built at app/components/NsiField.js
- Blue-gray tint on release time and days out cards when flag is true
- Info icon with hover/click callout on those two fields
- Callout text: "This restaurant opens its booking window on a set schedule but has not released general availability inventory with an observable pattern. Read how booking actually works here."
- Blog stub at app/blog/how-catch-hospitality-reservations-work/page.js — content TBD, URL may be shortened

### Booking Line Corrections
- 18 booking line errors corrected across existing notes via targeted replace script
- Critical rule: booking intel must always come from observed_days and release_time in Supabase DB, never from third-party sources

### Deferred Tasks
- Need to Know box system — deferred to later update, needs full policy data sourced across 190+ restaurants before building
- Catch Hospitality blog post — deferred, mechanic needs to be properly understood before writing
- Walk-in notes (14 remaining) — not started
- OpenTable notes (13 remaining) — not started
- Others: Crown Shy, Hillstone, Sushi Ginza Onodera, Don Peppe, Din Tai Fung — not started

### Em Dash Rule
No em dashes anywhere in Scoopd copy. Ever. Use a period, colon, or restructure the sentence.
