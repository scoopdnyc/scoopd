# Scoopd — Claude Code Lessons

Patterns captured from session corrections. Reviewed at session start.
Skills are promoted from here when a pattern repeats 2+ times.

---

## L001 — Admin password hardcoded in client JS (2026-04-20)

**Pattern:** A password was placed as a string literal in a React client component.
**Impact:** Visible to any visitor via browser DevTools → Sources.
**Rule:** All secrets must be in env vars with no `NEXT_PUBLIC_` prefix. All auth
validation must happen in API routes, never in client components.
**Skill:** scoopd:security-audit Checks 1 and 2 now catch this class of issue.
**Status:** Fixed — app/admin/page.js → app/api/admin/auth/route.js

## L002 — Add-restaurant route had no auth check (2026-04-20)

**Pattern:** An API route that writes to the DB had no authentication check.
**Impact:** Anyone who discovered the URL could POST arbitrary restaurant data.
**Rule:** Every admin API route must call `isAdminAuthed(request)` at the top
and return 401 before processing if auth fails.
**Skill:** scoopd:security-audit Check 4 catches this.
**Status:** Fixed — app/api/admin/add-restaurant/route.js

## L004 — Drop date calc partially extracted (2026-04-27)

**Pattern:** Drop date logic extracted from `app/restaurant/[slug]/page.js` into
`lib/dropDate.js` for the alerts system build, but `app/drops/page.js` and
`app/plan/PlanClient.js` still contain inline copies.
**Impact:** Three implementations of the same logic. CLAUDE.md "single source of truth"
rule now refers to `lib/dropDate.js` for new code, not the restaurant page.
**Rule:** When next touching `app/drops/page.js` or `app/plan/PlanClient.js`, migrate
them to import `computeNextDropDate` from `lib/dropDate.js`. Do not re-derive the
calc anywhere.
**Skill:** None.
**Status:** Active

## L003 — Pre-existing lint errors missed by previous audits (2026-04-20)

**Pattern:** Unescaped entities in JSX (`'`, `"`) and `Math.random()` called inside
a render function accumulated over multiple sessions without being caught.
**Impact:** `npm run lint` failing silently blocked the ship gate from being meaningful.
**Rule:** Run `npm run lint` at the start of every session. Fix errors before any work.
**Skill:** scoopd:ship Check 1 enforces this going forward.
**Status:** Fixed — 8 files corrected in baseline cleanup

---

## Adding New Lessons

Format:
## LXXX — Short description (YYYY-MM-DD)
**Pattern:** What was done wrong or what worked unexpectedly well.
**Impact:** What it caused or revealed.
**Rule:** The rule to follow going forward.
**Skill:** Which skill (if any) now enforces this.
**Status:** Fixed / Active / Watching
