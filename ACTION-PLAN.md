# Scoopd SEO Action Plan
**Generated:** May 17, 2026 | **Score:** 67/100 | **Source:** FULL-AUDIT-REPORT.md

---

## Critical (fix immediately)

### C1 — Fix `/how-it-works` stale CTA
**File:** `app/how-it-works/page.js` (or wherever the CTA renders)
**Issue:** "Join the waitlist for exact drop date calculations, real-time alerts, and the full Scoopd platform when it launches." Platform is live. This is the primary CTA on the best-structured page on the site.
**Fix:** Replace with "Get access" or "See drop times" linking to `/signup` or `/drops`.
**Impact:** Immediate conversion recovery on the highest-intent page.

### C2 — Add OG images to all blog posts
**Files:** `app/blog/[slug]/page.js`, all 4 MDX files in `content/blog/`
**Issue:** `<meta property="og:image">` is absent from all blog posts. Confirmed via HTTP.
**Fix:** Add `image` field to each MDX frontmatter. Pass to `generateMetadata` → `openGraph.images`. Also pass to Article JSON-LD `image` property.
**Impact:** Social sharing previews, Article rich results eligibility.

### C3 — Add `image` to Restaurant JSON-LD
**File:** `app/restaurant/[slug]/page.js` (jsonLd object)
**Issue:** `photoUrl` is fetched and rendered in the UI but not in the schema.
**Fix:** `...(photoUrl && { image: photoUrl })` in the jsonLd object.
**Impact:** Restaurant rich result thumbnail eligibility.

### C4 — Fix sitemap: remove deprecated tags + fix Supabase client
**File:** `app/sitemap.js`
**Issues:**
1. `changeFrequency` and `priority` present on all 251 entries (deprecated, ignored by Google)
2. `import { supabase } from '../lib/supabase'` — should be `createSupabaseStatic` from `lib/supabase-static.js`
**Fix:**
- Change import to: `import { createSupabaseStatic } from '../lib/supabase-static'`
- Call `createSupabaseStatic()` in the function body
- Remove `changeFrequency` and `priority` from every URL object
**Impact:** Sitemap compliance, CLAUDE.md invariant fix.

---

## High (fix within 1 week)

### H1 — Fix restaurant schema: `description` fallback + `url` semantics
**File:** `app/restaurant/[slug]/page.js`
**Issues:**
1. `description` is only emitted when `r.notes` is truthy. The `autoSentence` variable is already computed and should be the fallback.
2. `url` is set to the Scoopd page — should be `mainEntityOfPage`.
**Fix:** See schema Fix 1 in FULL-AUDIT-REPORT.md.

### H2 — Fix Article schema: add `mainEntityOfPage` + `publisher.logo`
**File:** `app/blog/[slug]/page.js`
**Issue:** `mainEntityOfPage` absent; `publisher.logo` absent (required for Article rich results).
**Fix:** See schema Fix 2 in FULL-AUDIT-REPORT.md.

### H3 — Fix breadcrumb middle level (neighborhood + platform pages)
**Files:** `app/neighborhood/[name]/page.js`, `app/platform/[name]/page.js`
**Issue:** BreadcrumbList position 2 references `/neighborhoods` and `/platforms` — both 404.
**Fix:** Remove middle item. Collapse to 2-level breadcrumb: Home → [Page Name].

### H4 — Fix PremiumReveal placeholder date
**File:** wherever PremiumReveal/the blur component is defined
**Issue:** Hardcoded "Tuesday, April 15 at 10:00 AM ET" — now a month-old past date. Trust damage when users notice a locked past date.
**Fix:** Generate a placeholder that is clearly future-dated, or use a non-date string like "Next available date" styled identically.

### H5 — Fix days-out discrepancy in Do-Not-Touch notes
**Restaurants:** Carbone, Via Carota
**Issue:** Notes text says "30 days out," `observed_days` panel shows 31.
**Fix:** Manually verify actual observed window. Edit the notes field to match. Do not use a script — these are on the Do-Not-Touch list.

---

## Medium (fix within 1 month)

### M1 — Add editorial content to top 5 neighborhood pages
**Files:** `app/neighborhood/[name]/page.js` or static MDX content per neighborhood
**Target neighborhoods:** west-village, williamsburg, lower-east-side, midtown, tribeca
**Issue:** 30-40 words of template copy per page. Thin programmatic content pattern.
**Fix:** 150-200 words of unique editorial per page: character of the neighborhood's dining scene, dominant difficulty tier, characteristic drop patterns, notable restaurants.

### M2 — Add hero CTA button to homepage
**File:** `app/page.js` (or hero component)
**Issue:** No primary CTA above the fold. First-time Google arrivals have no action to take.
**Fix:** Add a primary button ("See tonight's drops" or "Check drop times") linking to `/drops`. Freemium entry point — no friction.

### M3 — Add restaurant count to hero
**File:** `app/page.js` hero section
**Issue:** "192 restaurants tracked" is only discoverable by scrolling past the full directory. It is the most compelling trust signal on the site.
**Fix:** Update sub-headline to "The exact moment reservations open at NYC's hardest tables. No bots. No brokers. 192 restaurants tracked."

### M4 — Add Organization `logo`, `sameAs`, `@id`
**File:** `app/page.js` (orgLd object)
**Fix:** See schema Fix 4 in FULL-AUDIT-REPORT.md. Replace `sameAs` placeholder with actual social handles when confirmed.

### M5 — Fix blog post bottom CTAs
**Files:** `app/blog/[slug]/page.js` or MDX layout
**Issue:** All posts end with CTA to `/drops`. Decision-stage readers arriving from editorial content should go to `/signup`, or to the specific restaurants named in the post.
**Fix:** For posts that name specific restaurants in the final section (the-reservation-economy names Torrisi, Don Angie), link those restaurant names inline. Bottom CTA → `/signup` rather than `/drops`.

### M6 — Add "how to book" section to high-traffic restaurant pages
**Target pages:** Carbone, Lilia, Via Carota, Don Angie, Torrisi, Eleven Madison Park
**Issue:** "How to get a reservation at Carbone NYC" SERP rewards 1,000+ word how-to guides. Scoopd serves a data card.
**Fix:** Add 200-300 word prose section per restaurant: state drop time explicitly, explain the window, note platform-specific prep steps, mention walk-in bar seating where applicable. This is the single highest-leverage content change for search traffic.

### M7 — Expand `rolling-windows-and-monthly-drops` blog post
**File:** `content/blog/rolling-windows-and-monthly-drops.mdx`
**Issue:** ~895 words; blog minimum is 1,500. This is a linked pillar piece from /how-it-works.
**Fix:** Add a restaurant-by-restaurant examples section: one Resy rolling-window example, one monthly-drop example, one SevenRooms example. This doubles the practical value and word count.

---

## Low (backlog)

### L1 — Add `telephone` to Restaurant schema where data exists
For restaurants where the DB has a phone number, add `telephone` to JSON-LD. Quick win once data is confirmed.

### L2 — Create `/about` page
150-300 words: who built Scoopd, methodology (how drop times are tracked and verified), data freshness policy. This is the single biggest E-E-A-T gap on the site.

### L3 — Add named author or editorial byline to blog
At minimum add "By the Scoopd Editorial Team" to each post and create a corresponding `Person` entity in Article schema. Resolves authorship gap under Sept 2025 QRG.

### L4 — Replace lock emoji with custom SVG on premium gate
On a dark luxury UI, the Unicode padlock reads as "something broke." A gold SVG lock matching the design system reads as premium. Low code effort, non-trivial conversion improvement.

### L5 — Add "from $5/month" to /drops upsell banner
Price is not visible on the page with the highest conversion intent (the drops table). One phrase addition, removes a mental friction point for the corporate entertainer persona.

### L6 — Add static server-rendered restaurant list to homepage
`RestaurantList` is `'use client'` — the full 192-restaurant directory is JS-only. Crawlable homepage HTML is ~80 words. A server-rendered fallback list of the top 10-15 restaurants (by difficulty) would increase homepage crawl authority without changing the UX.

### L7 — Add "Last verified" signal to restaurant pages
A single line per page ("Last verified: [date]") would address the data provenance concern raised by the corporate entertainer persona. The `last_updated_at` field is already in the DB.

### L8 — Add ItemList schema to /drops page
The drops table is unstructured from Google's perspective. Adding ItemList schema with each restaurant as a ListItem (position, name, url) would improve the page's eligibility for structured result formats.

---

## Summary Table

| ID | Issue | File | Effort | Impact |
|---|---|---|---|---|
| C1 | Stale /how-it-works CTA | how-it-works page | XS | Critical |
| C2 | Blog OG images absent | blog page.js + MDX | S | Critical |
| C3 | Restaurant schema missing image | restaurant page.js | XS | High |
| C4 | Sitemap: deprecated tags + wrong client | sitemap.js | S | High |
| H1 | Restaurant description fallback | restaurant page.js | XS | High |
| H2 | Article mainEntityOfPage + publisher.logo | blog page.js | XS | High |
| H3 | Breadcrumb middle 404 | neighborhood + platform page.js | XS | Medium |
| H4 | PremiumReveal stale placeholder | PremiumReveal component | XS | Medium |
| H5 | Days-out discrepancy in notes | DB manual edit | XS | Medium |
| M1 | Neighborhood editorial content | neighborhood page.js + content | L | High |
| M2 | Homepage hero CTA | page.js | XS | High |
| M3 | Restaurant count in hero | page.js | XS | Medium |
| M4 | Organization logo/sameAs | page.js | XS | Low |
| M5 | Blog CTA destination | blog layout | XS | Medium |
| M6 | "How to book" sections on top restaurants | restaurant page.js + content | M | High |
| M7 | Expand rolling-windows post | MDX | M | Medium |
| L1 | Telephone in restaurant schema | restaurant page.js | XS | Low |
| L2 | /about page | new page | M | Medium |
| L3 | Blog author byline | blog page.js + schema | S | Medium |
| L4 | Lock emoji → SVG | PremiumReveal component | XS | Low |
| L5 | Price on /drops upsell | drops page | XS | Medium |
| L6 | Static homepage restaurant list | page.js | M | Medium |
| L7 | Last verified signal | restaurant page.js | XS | Low |
| L8 | ItemList schema on /drops | drops page.js | S | Low |

**Effort key:** XS = under 30 min, S = 30-90 min, M = half-day, L = multi-day
