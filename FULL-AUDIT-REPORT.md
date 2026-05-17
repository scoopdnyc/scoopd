# Scoopd SEO Full Audit Report
**Date:** May 17, 2026
**URL:** https://scoopd.nyc
**Stack:** Next.js 16.2.1 App Router, Vercel Hobby, Supabase
**Agents run:** technical, content, schema, sitemap, performance (blocked), geo, backlinks (blocked), visual (blocked), sxo

---

## Overall SEO Health Score: 67/100

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Technical SEO | 22% | 72 | 15.8 |
| Content Quality | 23% | 62 | 14.3 |
| On-Page SEO | 20% | 74 | 14.8 |
| Schema | 10% | 58 | 5.8 |
| Performance | 10% | 70* | 7.0 |
| AI Search Readiness | 10% | 72 | 7.2 |
| Images | 5% | 35 | 1.8 |
| **Total** | | | **66.7 → 67/100** |

*Performance: measurement blocked by tool permissions; score is estimated.

---

## Top 5 Critical Issues

1. **Blog OG images completely absent** — confirmed via HTTP. `<meta og:image>` returns empty on all blog posts. Blocks social sharing previews and Article rich results eligibility.
2. **Neighborhood and platform pages: 30-40 words of content** — pure DB query with one template sentence. 44 neighborhood + 7 platform pages of near-identical structure. Classic thin programmatic content under Sept 2025 QRG.
3. **Restaurant schema missing `image`** — `photoUrl` is fetched and rendered in the UI but not passed to JSON-LD. Blocks Restaurant rich result thumbnails.
4. **Sitemap has deprecated tags on all 251 entries** — `<changefreq>` and `<priority>` present site-wide. Also uses `lib/supabase.js` instead of `lib/supabase-static.js` (CLAUDE.md violation).
5. **`/how-it-works` CTA is stale** — "Join the waitlist...when it launches" but the platform is live. P0 conversion damage.

## Top 5 Quick Wins

1. Remove `changeFrequency` and `priority` from all sitemap entries.
2. Fix sitemap Supabase client: `lib/supabase.js` → `lib/supabase-static.js`.
3. Add `image: photoUrl` to Restaurant JSON-LD (existing variable, one line).
4. Fix `/how-it-works` CTA — "Join the waitlist" → "Get access" or "See drop times."
5. Collapse neighborhood/platform breadcrumb to 2 levels (removes crawlable 404 refs).

---

## Technical SEO

### Canonicals
All correct. Self-referential confirmed on:
- Homepage: `https://scoopd.nyc` (no trailing slash, consistent with sitemap)
- Restaurant: `https://scoopd.nyc/restaurant/[slug]`
- Neighborhood: `https://scoopd.nyc/neighborhood/west-village`
- Platform: `https://scoopd.nyc/platform/resy`

### Trailing Slash
308 permanent redirect from `/restaurant/carbone/` to `/restaurant/carbone`. Correct, handled by Vercel.

### Sitemap

**Stats:**
- 251 total URLs: 192 restaurant, 44 neighborhood, 7 platform, 4 blog, 4 static
- All key static pages present: `/`, `/how-it-works`, `/drops`, `/plan`, `/blog`
- Noindexed pages correctly excluded: `/signup`, `/login`, `/terms`, `/privacy`
- Blog posts have correct individual `lastmod` from MDX frontmatter

**Issues:**
- **251 `<priority>` and 251 `<changefreq>` tags** — deprecated, ignored by Google, add payload weight. Remove.
- **Wrong Supabase client** — `sitemap.js` imports `{ supabase } from '../lib/supabase'` not `createSupabaseStatic` from `lib/supabase-static.js`. CLAUDE.md invariant violation.
- Neighborhood/platform pages have hardcoded `lastmod: 2026-05-02` — acceptable for now.

### OG Images (Critical)
`curl` against `/blog/the-reservation-economy` returns empty for `og:image`. All 4 blog posts confirmed missing `og:image` in `<head>`. Means social shares show blank previews, and Article rich results in Google are ineligible without `image`.

### Indexability
All sampled pages return 200: restaurant/hillstone, restaurant/jean-georges, restaurant/corima, neighborhood/williamsburg, platform/resy, blog/the-reservation-economy, blog/who-gets-the-table.

### Rendering Architecture
- `RestaurantList.js` is `'use client'` — full 192-restaurant directory rendered in JS
- Server-rendered homepage HTML contains only the hero text and schema
- This limits crawlable homepage content to ~80 words
- /drops and /plan: no explicit `revalidate` or `force-*` directives detected

---

## Content Quality

### Scorecard

| Page | Content | E-E-A-T | Severity |
|---|---|---|---|
| Homepage | 72/100 | 61/100 | Moderate |
| /restaurant/carbone | 81/100 | 74/100 | Low |
| /restaurant/via-carota | 52/100 | 48/100 | High |
| /blog/the-reservation-economy | 88/100 | 76/100 | Low |
| /how-it-works | 84/100 | 72/100 | Low |
| /neighborhood/west-village | 44/100 | 38/100 | Critical |
| /blog/ index | 68/100 | 55/100 | Moderate |

### Critical — Neighborhood and Platform Pages
One template sentence per page. 44 neighborhood + 7 platform pages with identical structure. A Quality Rater comparing `/neighborhood/west-village` to `/neighborhood/williamsburg` sees two pages with different data and identical prose. This is the textbook thin programmatic content pattern.

**Fix:** 150-200 words of unique editorial per page. Start with top 5 neighborhoods by restaurant count.

### High — Days-Out Discrepancy in Do-Not-Touch Notes
Carbone and Via Carota notes say "30 days out" but `observed_days` panel shows 31. These are on the Do-Not-Touch list. Verify which is correct, then edit the notes field manually.

### High — No Author Attribution
No page identifies a human author. Article schema attributes blog content to `"@type": "Organization"`. For content covering a legally regulated market (NY reservation law), Sept 2025 QRG expects authorship to be answerable.

### High (P0) — Stale CTA on /how-it-works
"Join the waitlist...when it launches" — platform is live since `7df920f`. Actively signals the product is unavailable. Any visitor who reads this leaves without converting.

### Moderate — No /about Page
No `/about` page exists. Quality Raters specifically look for a page explaining who built the site, their methodology, and why the data is trustworthy.

### Moderate — Blog Word Counts Below Threshold
- `rolling-windows-and-monthly-drops`: ~895 words (minimum 1,500 for blog posts)
- `the-reservation-economy`: ~1,350 words (150 short)

### AI Citation Strengths
- "Torrisi drops at 10:00 AM on Resy, 31 days out, and Don Angie drops at 9:00 AM on OpenTable, 8 days out" — directly quotable specific claim
- FAQPage on /how-it-works — 5 structured Q&A pairs
- Carbone restaurant schema with explicit drop time

---

## Schema

### Status Table

| Page | Status | Priority Issues |
|---|---|---|
| Homepage — Organization + SearchAction | Pass with gaps | Missing `logo`, `sameAs`, `@id` |
| /restaurant/[slug] — Restaurant + BreadcrumbList | Pass with gaps | Missing `image`, no `description` fallback, wrong `url` semantics |
| /blog/[slug] — Article + BreadcrumbList | Pass with gaps | Missing `image`, no `mainEntityOfPage`, `author` is Org not Person |
| /neighborhood/[name] — ItemList + BreadcrumbList | Pass with issue | BreadcrumbList pos 2 → non-existent `/neighborhoods` |
| /platform/[name] — ItemList + BreadcrumbList | Pass with issue | BreadcrumbList pos 2 → non-existent `/platforms` |
| /how-it-works — FAQPage | Pass | Note: FAQPage rich results disabled for commercial sites post-Aug 2023 but strong GEO/AI signal |

### Fix 1 — Restaurant: add `image`, fix `description`, fix `url`
In `app/restaurant/[slug]/page.js`, the `jsonLd` object:
```js
const descriptionText = r.notes || autoSentence || undefined

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: r.restaurant,
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `https://scoopd.nyc/restaurant/${slug}`,
  },
  ...(photoUrl && { image: photoUrl }),
  ...(descriptionText && { description: descriptionText }),
  ...(r.cuisine && { servesCuisine: r.cuisine }),
  ...(r.address && { address: { /* existing logic */ } }),
  ...(r.price_tier && { priceRange: r.price_tier }),
  acceptsReservations: r.platform !== 'Walk-in' && r.platform !== 'CLOSED',
}
```

### Fix 2 — Article: add `image`, `mainEntityOfPage`, `publisher.logo`
In `app/blog/[slug]/page.js`:
```js
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: data.title,
  description: data.description,
  mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
  ...(data.image && { image: data.image }),
  datePublished: data.publishedAt,
  dateModified: data.updatedAt ?? data.publishedAt,
  author: { '@type': 'Organization', name: 'Scoopd', url: 'https://scoopd.nyc' },
  publisher: {
    '@type': 'Organization',
    name: 'Scoopd',
    url: 'https://scoopd.nyc',
    logo: { '@type': 'ImageObject', url: 'https://scoopd.nyc/scoopd-og.png' },
  },
}
```
Also add to `generateMetadata`: `openGraph: { images: [data.image] }` when `data.image` is set.

### Fix 3 — Neighborhood/Platform breadcrumbs: collapse to 2 levels
Remove middle item (`/neighborhoods`, `/platforms`) — both 404. Reduce to Home → [Page].

### Fix 4 — Organization: add `logo`, `sameAs`, `@id`
In `app/page.js`:
```js
const orgLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://scoopd.nyc/#organization',
  name: 'Scoopd',
  url: 'https://scoopd.nyc',
  logo: { '@type': 'ImageObject', url: 'https://scoopd.nyc/scoopd-og.png' },
  contactPoint: { /* existing */ },
  sameAs: [ /* add social handles when confirmed */ ],
}
```

---

## SXO Analysis

### SERP Page-Type Mismatches

| Query | Expected Type | What Scoopd Serves | Mismatch |
|---|---|---|---|
| "how to get a reservation at Carbone NYC" | How-to editorial (1,000+ words) | Data card | HIGH |
| "when does Carbone release reservations" | Direct-answer guide with answer in prose | Data card with answer below fold | MEDIUM |
| "Scoopd NYC reservations" (navigational) | Brand homepage with crawlable content | Client-rendered directory shell | MEDIUM |
| "NYC restaurant reservation tracker" | Product landing page with CTA + social proof | Directory homepage with bare hero | HIGH |
| "best way to get hard restaurant reservations NYC" | Long-form tactical guide | Opinion essay on the economy | HIGH |

**Primary finding:** Scoopd pages are built for users who already know what Scoopd is. They are not built for users arriving from Google with a question. The product is being served where an explanation is expected.

### SXO Gap Scores by Page

| Page | Score | Key Gap |
|---|---|---|
| /drops | 47/100 | No schema, no intro prose, lock emoji reads as broken not premium |
| Homepage | 50/100 | No CTA in hero, no restaurant count, full directory is client-side JS |
| /restaurant/carbone | 56/100 | No how-to guide wrapper, answer below fold, no data freshness signal |
| /blog/the-reservation-economy | 56/100 | CTA sends to /drops not /signup, no internal links to named restaurants |
| /how-it-works | 64/100 | No visuals, stale CTA, force-static with no freshness signal |

### P0 Findings

**Stale CTA on /how-it-works:** "Join the waitlist for exact drop date calculations, real-time alerts, and the full Scoopd platform when it launches." Product is live. Fix immediately.

**No hero CTA on homepage:** Most commercially important page for "NYC restaurant reservation tracker" has zero above-the-fold CTA. The gold "The Scoop" dropdown is for existing users. A first-time Google arrival has no primary action.

### P1 Findings

**Restaurant pages need a guide layer for informational queries.** "How to get a reservation at Carbone" is high-volume. SERP rewards 1,000+ word how-to guides. A 200-300 word "How to book [Restaurant]" prose section per restaurant page would align with the dominant SERP page type without breaking the product experience.

**Blog CTA targets wrong destination.** `/blog/the-reservation-economy` ends by naming Torrisi and Don Angie with specific drop data — but neither is linked, and the bottom CTA goes to `/drops`, not `/signup` or the individual restaurant pages. Decision-stage readers should be CTA'd to convert.

**Homepage hero missing restaurant count and social proof.** "192 restaurants tracked" is the most compelling specificity signal and lives below 192 restaurant cards. It should be in the hero. "Know when tables drop across 192 NYC restaurants" as the sub-headline increases clarity and trust simultaneously.

### P2 Findings

**PremiumReveal placeholder date is time-stale.** The blurred placeholder hardcodes "Tuesday, April 15 at 10:00 AM ET." As of May 2026 this is a month-old past date. A perceptive user sees a locked, past date and loses trust in the data. Dynamically generate a future-looking placeholder.

**Homepage directory is fully client-side.** 192 restaurants rendered by `RestaurantList` (`'use client'`). Crawlable homepage HTML is ~80 words. Adding a static server-rendered list of the top 10-15 restaurants beneath the client component would substantially increase homepage crawl authority.

**Lock emoji on premium gate.** The Unicode padlock on a dark luxury UI reads as "something is broken," not "this is premium." A custom gold SVG lock matching the design system would convert better, especially for Persona B (corporate entertainer).

### Persona Scores

| Persona | Score | Biggest Gap |
|---|---|---|
| Date-Night Planner | 48/100 | /plan page is not discoverable from any organic path |
| Casual first-timer from Google | 52/100 | Lands on /restaurant/[slug], gets data card, not the how-to guide they searched for |
| Obsessive foodie (returning) | 61/100 | Logged-out state shows re-acquisition CTA, not "log back in" |
| Corporate entertainer | 64/100 | Price not visible on /drops upsell banner |

---

## GEO / AI Search Readiness

### Strengths
- `llms.txt` present — explicit AI crawler guidance
- FAQPage on /how-it-works — 5 Q&A pairs, machine-readable
- Restaurant schema with explicit booking data in `description`
- Blog posts contain specific verifiable facts ("Torrisi drops at 10:00 AM on Resy, 31 days out")

### Gaps
- Neighborhood pages: no quotable prose, uncitable
- Homepage: ~80 words of crawlable text, no methodology statement
- Blog posts: no named author reduces AI attribution confidence

### Citation Readiness

| Page | Rating |
|---|---|
| /blog/the-reservation-economy | High |
| /blog/reservation-shadow-market | High |
| /how-it-works | High (FAQPage) |
| /restaurant/carbone | High (specific schema) |
| /restaurant/via-carota | Medium (data discrepancy) |
| Homepage | Low-Medium |
| /neighborhood/[name] | Low |

---

## Backlinks

Common Crawl scripts blocked by permissions. Estimated baseline: new domain (~3 months), no known inbound links, no active link building. 4 blog posts on timely topics (reservation economy, anti-piracy law) are natural press-bait for Eater NY, Grub Street, Infatuation.

---

## Cluster Analysis

Cluster agent hit usage limits before completing. Known content gaps from other agents' findings:
- No "how to get a reservation at [restaurant]" guide layer on restaurant pages
- No neighborhood-specific booking guide ("hardest West Village reservations")
- No tactical "how to use Resy" / "how to use OpenTable" guide
- Blog post `rolling-windows-and-monthly-drops` at 895 words is underweight for a pillar piece

---

## Visual / Mobile

Playwright screenshot collection blocked by image processing errors. Known from code review: mobile layout fixes previously applied (ScoopSubBar, /drops and /plan horizontal scroll).
