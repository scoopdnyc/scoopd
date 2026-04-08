# Scoopd — Project Brief for Claude Code

## What Scoopd Is
Scoopd (scoopd.nyc) is a NYC restaurant reservation intelligence platform. It tracks when hard-to-get restaurants release reservations — the exact platform, time, and days out — and calculates the specific calendar date premium users need to be online to book.

## Stack
- Next.js 16.2.1 (App Router, Turbopack)
- Supabase (Postgres DB + Auth)
- Stripe (subscriptions)
- Vercel Hobby (hosting)
- GitHub: scoopdnyc/scoopd

## Environment Variables
Required in .env.local and Vercel:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_STRIPE_PRICE_ID
- STRIPE_WEBHOOK_SECRET
- NEXT_PUBLIC_SITE_URL

## Supabase Clients — Critical
There are three Supabase clients. Use the correct one or auth will break:
- lib/supabase-browser.js — client components only (uses @supabase/ssr, stores session in cookies)
- lib/supabase-server.js — server components and API routes with user context
- lib/supabase.js — sitemap only, do not use anywhere else

## Database Schema

### restaurants table (key fields)
- restaurant — display name
- slug — URL slug e.g. carbone
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
- notes — editorial description, if null auto-sentence is generated
- beli_score — numeric

### subscriptions table
- user_id — references auth.users
- stripe_customer_id
- stripe_subscription_id
- status — active or inactive
- current_period_end

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
- Premium users at $9.99/month: see calculated exact drop date
- Blur pattern: blurred placeholder + lock icon + Sign up to unlock CTA for free users
- This pattern is implemented on restaurant pages and will be used on the drops page

## Pages Built
- / — homepage directory
- /restaurant/[slug] — individual restaurant page
- /how-it-works — editorial explainer
- /signup — waitlist via Google Sheets
- /login — Supabase Auth password and magic link
- /register — account creation plus waitlist opt-in
- /account — subscription management
- /admin — password protected restaurant entry form
- /drops — what drops today, in progress

## API Routes
- /api/stripe/checkout — creates Stripe checkout session
- /api/stripe/portal — creates Stripe billing portal session
- /api/stripe/webhook — handles Stripe events, syncs subscriptions table

## Editorial Rules
- No em dashes anywhere in copy
- observed_days is the only public-facing days-out field, not release_schedule
- Auto-generated booking sentence when notes field is null
- Notes field contains hand-written editorial descriptions

## Phase Status
- Phase 1: Complete — directory, restaurant pages, badge system, admin form
- Phase 2: Complete locally not pushed — auth, Stripe, blur, unlock logic
- Phase 3: In progress — drops page, plan by date, alerts, availability probability
- Phase 4: Not started — blog, photos, execution guide
- Phase 5: Not started — AdSense, expand beyond NYC
