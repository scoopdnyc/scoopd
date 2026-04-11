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

## Supabase Clients — Critical
There are three Supabase clients. Use the correct one or auth will break:
- lib/supabase-browser.js — client components only (uses @supabase/ssr, stores session in cookies)
- lib/supabase-server.js — server components and API routes with user context
- lib/supabase.js — sitemap only, do not use anywhere else

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
- notes — editorial description (~96 restaurants have hand-written copy; if null, auto-sentence is generated)
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
- /drops — what drops today, premium gated, built locally, ready to push with Phase 2
- /plan — plan by date, premium gated, built locally, ready to push with Phase 2
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

## Editorial Rules
- No em dashes anywhere in copy
- observed_days is the only public-facing days-out field, not release_schedule
- Auto-generated booking sentence when notes field is null
- Notes field contains hand-written editorial descriptions (~96 restaurants populated as of April 2026)
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
- ~96 restaurants have editorial notes copy

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

### Phase 3 — Drop Intelligence (in progress)
- /drops page — built locally, premium gated, ready to push with Phase 2
- /plan page (plan by date) — built locally, premium gated, ready to push with Phase 2
- Alerts system — NOT YET BUILT
  - Bell icon on restaurant page next to restaurant name
  - Premium only, unlimited alerts
  - Email via Resend, digest format (one email per release time grouping)
  - Fires 5 minutes before drop time ET
  - /account page shows active alerts with remove option
  - Scheduler: Inngest (free tier)
- Availability probability data — not started
- Corner Store observed_days unconfirmed

### Phase 4 — Editorial + Blog (not started)
- Blog layer behind paywall
- Restaurant photos
- Topics identified: secondary market economics, reservation scalping, platform risk

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

## Alerts System Design (Phase 3)
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
