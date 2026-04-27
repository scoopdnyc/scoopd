# Scoopd SEO Audit Report
**Site:** https://scoopd.nyc | **Date:** April 20, 2026 | **Overall Score: 58/100**

---

## Executive Summary

Scoopd has a strong technical foundation — Vercel hosting, HTTPS, valid sitemap, Google Analytics, JSON-LD on restaurant pages — but is being held back by a cluster of fixable issues. The site has a title duplication bug on every restaurant page, zero canonical URLs sitewide, no OG images for social sharing, and a cache-control header problem that prevents Vercel's CDN from caching any page.

**Business Type:** NYC Restaurant Reservation Intelligence Platform (SaaS / Freemium Directory)
**Pages Crawled:** 197 (homepage + 194 restaurant pages + supporting pages)
**Stack:** Next.js 16.2.1 App Router, Supabase, Stripe, Vercel Hobby

### Top 5 Critical Issues

1. **Title tag duplication bug** — Every restaurant page renders "... | Scoopd | Scoopd" (double brand suffix). Affects ~194 pages.
2. **No canonical URLs anywhere** — Zero `<link rel="canonical">` tags on any page. Vulnerable to duplicate content from query strings and URL variations.
3. **No OG or Twitter images** — Every page social share shows a blank card. Critical for organic social traffic.
4. **cache-control: private, no-cache on all HTML** — Vercel CDN cannot cache any page. Every request hits origin server.
5. **No schema on homepage or /how-it-works** — Two highest-traffic pages have zero structured data.

### Top 5 Quick Wins

1. Remove `| Scoopd` from restaurant page title strings — layout template already appends it
2. Add `alternates: { canonical: url }` to every generateMetadata export
3. Add `priceRange` to Restaurant JSON-LD — price_tier column already exists, one-line fix
4. Remove /signup from sitemap — no search demand, wastes crawl budget
5. Add `export const dynamic = 'force-static'` to /how-it-works — immediately CDN-cacheable

---

## Score Card

| Category | Score | Weight |
|---|---|---|
| Technical SEO | 52/100 | 22% |
| Content Quality | 68/100 | 23% |
| On-Page SEO | 55/100 | 20% |
| Schema / Structured Data | 48/100 | 10% |
| Performance (CWV) | 62/100 | 10% |
| AI Search Readiness | 45/100 | 10% |
| Open Graph / Social | 30/100 | 5% |
| Internal Linking | 52/100 | — |
| **OVERALL** | **58/100** | |

---

## 1. Technical SEO — 52/100

### robots.txt — PASS
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /_next/static/
Disallow: /api/
Sitemap: https://scoopd.nyc/sitemap.xml
```
Correct configuration. /api/ and /_next/static/ blocked. /admin blocked. No issues.

### Sitemap — PARTIAL PASS
- 197 URLs total: homepage, /how-it-works, /signup, and 194 restaurant pages
- Missing: /drops and /plan are not in the sitemap
- All 197 URLs share identical lastmod timestamp (build time) — not meaningful to Googlebot
- /signup is included but has no organic search value — should be excluded

### Canonical URLs — FAIL
- Zero `<link rel="canonical">` tags found on any page fetched
- Next.js metadata API supports `alternates.canonical` — none of the pages use it
- Without canonicals, query string variations can create duplicate content

### Indexability — MOSTLY PASS
- Restaurant pages, homepage, /how-it-works: correctly indexed
- /founding, /terms, /privacy, blog placeholder: correctly noindexed
- ISSUE: /signup is indexed and in sitemap but targets no search intent

### HTTPS / Security — PASS
- HTTPS enforced, HSTS header present (max-age=63072000)
- x-powered-by: Next.js header exposed (minor)

### Caching — FAIL (Critical)
- Every HTML page returns: `cache-control: private, no-cache, no-store, max-age=0, must-revalidate`
- x-vercel-cache: MISS on every HTML request
- Root cause: createSupabaseServer() reads cookies, forcing Next.js into dynamic rendering mode
- Static assets (sitemap.xml, robots.txt) correctly return CACHE HIT
- Impact: Every page view hits the origin server; TTFB ~250ms under single request load

---

## 2. On-Page SEO — 55/100

### Title Tags — FAIL

**Critical Bug:** Restaurant pages have title duplication.

- layout.js defines template: `"%s | Scoopd"` — wraps every child page title
- restaurant/[slug]/page.js builds: `"${r.restaurant} Reservations — Drop Time & Booking Intelligence | Scoopd"`
- Next.js then applies template: `"Carbone Reservations — Drop Time & Booking Intelligence | Scoopd | Scoopd"`
- Affects all ~194 restaurant pages and /drops page
- Google may auto-rewrite these titles in SERPs

**Fix:** Remove `| Scoopd` from the title string in generateMetadata. The layout template handles brand suffix.

### Meta Descriptions — GOOD
- Homepage: 155 chars, keyword-rich
- Restaurant pages with editorial notes: uses hand-written copy truncated to 155 chars
- Restaurant pages without notes: auto-generated, functional

### Heading Structure — PARTIAL PASS
- Each restaurant page has exactly one H1 (restaurant name) — correct
- Restaurant pages have zero H2 tags — info sections are styled divs, not semantic headings
- Homepage has one H1 but zero H2s despite listing 194 restaurants
- How It Works: good structure with one H1 and five H2 sections

### H1 Alignment — PARTIAL PASS
- H1: "Carbone" | Title target: "Carbone Reservations — Drop Time & Booking Intelligence"
- H1 and title keyword are misaligned — including intent keyword in H1 would strengthen relevance

---

## 3. Content Quality — 68/100

### Strengths
- ~140 restaurant pages have high-quality hand-written editorial descriptions in Scoopd voice (specific, insider, no marketing language)
- Carbone note example: "The most hunted reservation in New York, full stop..." — strong E-E-A-T signal
- Auto-generated descriptions for ~52 remaining restaurants are functional and accurate
- How It Works (~2,000 words) is substantive editorial content explaining the reservation ecosystem
- All data (release times, platform names, days-out windows) is verified and specific

### Weaknesses
- ~52 auto-generated restaurant pages are formulaic and thin — Google may classify as low-quality over time
- Zero restaurant photos on any page — no image alt text, no image-based traffic, lower CTR from search
- Homepage is mostly a restaurant directory list — minimal editorial prose
- No FAQ content for featured snippet eligibility
- Blog at /blog/how-catch-hospitality-reservations-work is a "coming soon" placeholder

### E-E-A-T Assessment
- Experience: Strong — specific insider knowledge evident in editorial notes
- Expertise: Moderate — topical depth on reservation mechanics present in How It Works
- Authoritativeness: Weak — no author attribution, no bylines, no third-party citations
- Trustworthiness: Moderate — HTTPS, legal pages present, clear pricing

---

## 4. Schema / Structured Data — 48/100

### Restaurant Pages — PARTIAL PASS
JSON-LD `@type: Restaurant` present on all restaurant pages.

**Fields present:** name, servesCuisine, address (with postalCode), url, description

**Fields missing:**
- priceRange (maps directly to existing price_tier column — one-line fix)
- image (no restaurant photos available)
- telephone
- aggregateRating
- geo (latitude/longitude from address column)
- acceptsReservations (true for all non-walk-in, non-closed restaurants)
- BreadcrumbList (Home > Restaurant > [Name])

### Homepage — FAIL
Zero JSON-LD. Missing:
- WebSite schema with SearchAction (sitelinks searchbox signal)
- ItemList schema for the restaurant directory
- Organization schema for entity identity

### How It Works — FAIL
Zero JSON-LD. FAQPage schema would suit the five H2 sections perfectly and is a high-value featured snippet opportunity.

---

## 5. Open Graph / Social — 30/100

### Critical: No OG Images on Any Page

All pages have og:title, og:description, og:type, og:url — but:
- og:image: ABSENT on every page
- twitter:image: ABSENT on every page
- twitter:card is set to "summary" — "summary_large_image" preferred

**Impact:** Every Scoopd page shared on Twitter/X, LinkedIn, iMessage, or Slack renders as a bare text card with no image. This dramatically reduces click-through rates from social shares.

**Fix:** Create `/app/opengraph-image.js` (default) and `/app/restaurant/[slug]/opengraph-image.js` using Next.js ImageResponse (built-in, uses Vercel's Edge runtime, free).

**OG type mismatch:** Restaurant pages use og:type: website instead of article or restaurant type.

---

## 6. Performance — 62/100

### TTFB
- Observed: ~250ms (single request, no load)
- Expected under real load: significantly higher due to no-cache forcing origin hits

### Caching (see Technical SEO)
- Root cause: auth check on every page forces dynamic rendering
- All HTML pages: x-vercel-cache: MISS
- Static assets: correctly cached

### Font Loading — PASS
- Three Google Fonts loaded via next/font/google with WOFF2 preloading
- Correct Next.js approach, avoids FOUT

### Images — N/A (no images on site)
- Zero images means no image-related performance issues
- Also means no opportunities for image-based traffic

### JavaScript
- Restaurant page HTML: ~28KB
- Homepage HTML: ~143KB (full directory server-rendered — good for SEO, heavy for initial load)

### Core Web Vitals
- Cannot measure directly without browser
- No-cache issue will hurt LCP under concurrent load
- Large homepage HTML will affect FCP on slow connections

---

## 7. Internal Linking — 52/100

### What Works
- "More in [Neighborhood]" section: links to 4 random restaurants in same neighborhood on every restaurant page
- Every page links back to homepage via logo and back button
- Footer links to /terms and /privacy sitewide

### What's Missing
- No category/filter pages — neighborhood and platform filters are client-side state with no URL changes. No /neighborhood/west-village or /platform/resy pages for Google to crawl
- No cross-linking by difficulty or platform on restaurant pages
- /how-it-works has no links to specific restaurant pages — no link equity flowing to money pages
- No breadcrumbs in HTML
- Homepage has no text link to /how-it-works from the restaurant list area

---

## 8. AI Search Readiness — 45/100

### Why This Matters
AI search (Perplexity, ChatGPT with browsing, Google AI Overviews) favors pages with clear entity structure, factual specific data, and authoritativeness signals. Scoopd's data (exact release times, platform names, days-out windows) is exactly what AI search systems extract and cite.

### Positives
- Restaurant pages are factual, specific, and structured — strong AI citation candidates
- How It Works explains a niche topic clearly — candidate for AI summary citation
- Specific data points are the type of intelligence AI search systems extract

### Gaps
- No author attribution anywhere on the site
- No datePublished or dateModified signals on any content
- No Organization or Person entity markup
- No FAQ schema — missed featured snippet and AI Overview opportunity
- No breadcrumbs — AI systems use hierarchical signals
- No llms.txt file signaling AI crawler access preferences

---

## Prioritized Action Plan

### CRITICAL — Fix Immediately

**C1. Fix title tag duplication bug**
- File: app/restaurant/[slug]/page.js
- Change: Remove `| Scoopd` from the end of the title string in generateMetadata
- Before: `"${r.restaurant} Reservations — Drop Time & Booking Intelligence | Scoopd"`
- After: `"${r.restaurant} Reservations — Drop Time & Booking Intelligence"`
- Also check: app/drops/page.js — same bug
- Impact: 194 pages fixed immediately

**C2. Add canonical URLs to all pages**
- Add to every generateMetadata return: `alternates: { canonical: 'https://scoopd.nyc/[path]' }`
- Add to static page metadata exports: `alternates: { canonical: 'https://scoopd.nyc/how-it-works' }`
- Impact: Prevents all future duplicate content issues from query strings and URL variations

**C3. Create OG images for social sharing**
- Create: app/opengraph-image.js (sitewide default)
- Create: app/restaurant/[slug]/opengraph-image.js (per-restaurant branded card)
- Uses Next.js ImageResponse — built-in, free, runs at Vercel Edge
- Update twitter:card to "summary_large_image" across all pages
- Impact: Every social share gets a visual card

---

### HIGH — Address Within 1 Week

**H1. Complete Restaurant JSON-LD schema**
- Add priceRange: r.price_tier (one-line fix, data already in DB)
- Add acceptsReservations: r.platform !== 'Walk-in' && r.platform !== 'CLOSED'
- Add BreadcrumbList schema alongside Restaurant schema
- File: app/restaurant/[slug]/page.js

**H2. Add homepage schema**
- Add WebSite schema with SearchAction
- Add Organization schema (name, url, contactPoint)
- File: app/page.js

**H3. Add FAQPage schema to /how-it-works**
- Map the five H2 sections to FAQ question/answer pairs
- High ROI for featured snippet eligibility
- File: app/how-it-works/page.js

**H4. Remove /signup from sitemap and add noindex**
- Add robots: { index: false } to app/signup/page.js metadata
- Remove /signup from sitemap.js
- No search demand; conserves crawl budget

**H5. Fix cache-control for static pages**
- Add `export const dynamic = 'force-static'` to app/how-it-works/page.js
- Add `export const revalidate = 3600` to restaurant pages (ISR — 1 hour cache)
- Moves auth/premium check client-side for restaurant pages

---

### MEDIUM — Plan for Phase 4

**M1. Add H2 headings to restaurant pages**
- "Booking Intelligence", "About [Restaurant]", "More in [Neighborhood]" as semantic H2 elements
- Currently all subheadings are styled div elements, not headings

**M2. Align H1 with target keyword on restaurant pages**
- Current H1: "Carbone" | Target: "Carbone Reservations"
- Change to: `${r.restaurant} Reservations` in the H1

**M3. Create neighborhood and platform category pages**
- /neighborhood/[name] and /platform/[name] static pages
- ~15-20 high-value indexable pages targeting "Resy NYC restaurants" and "West Village reservation drops"
- Currently all filters are client-side state — zero crawlable URLs

**M4. Fix sitemap lastmod accuracy**
- Add last_updated_at column to restaurants table
- Use real timestamps in sitemap generation instead of build-time Date()
- Tells Googlebot which pages actually changed

**M5. Add Article schema with datePublished to editorial content**
- How It Works and future blog posts
- Signals freshness to AI search systems

**M6. Cross-link by difficulty and platform on restaurant pages**
- Add "Other Very Hard restaurants" or "More restaurants on Resy" sections
- Deepens internal link equity and topical clustering beyond neighborhood-only linking

---

### LOW — Longer Term

**L1. Restaurant photos**
- Zero images is the biggest CTR opportunity
- Even a branded placeholder card (dark background, Playfair Display name) would improve social sharing
- Full photography unlocks Google Images traffic

**L2. Build the blog content layer**
- "How to get a Carbone reservation" — high intent, low competition
- "Best Resy restaurants NYC 2026" — category-level demand
- Each post should link to 5-10 restaurant pages for internal equity

**L3. Target "how to get [restaurant] reservation" keywords**
- High commercial intent queries
- Current pages partially answer this — adding explicit "How to book" section would capture the intent

**L4. Verify Google Search Console coverage**
- Check for: pages marked Discovered but not indexed
- The dynamic rendering + no-cache issue may cause coverage issues
- GSC verification meta tag is present in layout.js

**L5. Submit sitemap to Bing Webmaster Tools**
- Bing powers ChatGPT's web browsing — higher strategic value than historical
- Takes 5 minutes, no code changes required

---

## Implementation Roadmap

| Priority | Task | Effort | Impact |
|---|---|---|---|
| Critical | Fix title duplication bug | 15 min | High |
| Critical | Add canonical URLs | 30 min | High |
| Critical | Create OG images | 2 hrs | High |
| Critical | Cache-control / ISR fix | 2 hrs | High |
| Critical | Homepage + how-it-works schema | 1 hr | Medium |
| High | Complete Restaurant JSON-LD | 30 min | Medium |
| High | Remove /signup from sitemap | 10 min | Low |
| Medium | H2 headings on restaurant pages | 1 hr | Medium |
| Medium | Neighborhood/platform category pages | 4 hrs | High |
| Medium | Sitemap lastmod accuracy | 1 hr | Low |
| Low | Blog content layer | Ongoing | High |
| Low | Restaurant photos | Ongoing | High |

---

*Report generated April 20, 2026. Based on live crawl of https://scoopd.nyc.*
