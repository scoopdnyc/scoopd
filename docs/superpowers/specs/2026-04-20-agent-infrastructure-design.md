# Scoopd Agent Infrastructure Design
**Date:** 2026-04-20  
**Status:** Approved  
**Scope:** Claude Code local agent infrastructure for scoopd/scoopd

---

## Problem

Every Claude Code session requires re-orientation. Rules are re-explained, conventions re-established, and mistakes repeated because the context from prior sessions does not survive. The result is that human input goes into orientation instead of decisions. The goal of this infrastructure is to invert that ratio.

---

## Architecture Overview

Three layers:

1. **Control layer** — `CLAUDE.md` (operating rules only) + `docs/scoopd-reference.md` (reference material)
2. **Skill layer** — `.claude/skills/scoopd/` — 12 modular workflows covering every repeatable task
3. **Command layer** — `.claude/commands/` — 6 thin wrappers that invoke skills with context

Agent roles: Planner (main context), Executor (subagent, one task), Reviewer (subagent, read-only diff check).

---

## Section 1: CLAUDE.md Restructure

### What stays in CLAUDE.md (operating rules, must be scannable in 30 seconds)

- Supabase client selection rule — wrong client breaks auth
- Do-not-touch restaurant notes list (16 restaurants)
- Drop date calculation pointer — `restaurant/[slug]/page.js` is the single source of truth
- No em-dash rule — anywhere in copy, ever
- CSS prefix convention per page
- Admin security rule — no plaintext passwords in client-side JS
- Freemium gate pattern — blur + lock + CTA
- `observed_days` is the only public-facing days-out field
- Supabase client selection: browser.js (client components), server.js (server components + API routes), static.js (sitemap only)

### What moves to docs/scoopd-reference.md

- Full DB schema field list
- Phase 1–5 history and status
- Legal details (terms, privacy, arbitration clause)
- Session update logs (these belong in git history)
- Design system color values
- Competitive context
- All environment variable names and descriptions

### Rule for CLAUDE.md growth

CLAUDE.md only grows when a real failure demands a new rule. No speculative rules. When a rule becomes stale, remove it.

---

## Section 2: Skill System

12 skills in four tiers. Each skill encodes a repeatable workflow with defined inputs, steps, tools, and a verification checkpoint before returning to human.

### Tier 1 — Always-on process skills

#### `scoopd:debug`
- **Trigger:** Any bug report, unexpected behavior, or broken page
- **Eliminates:** Re-explaining Supabase client selection, ET timezone logic, premium gate pattern at the start of every debug session
- **Inputs:** Error message or symptom description
- **Steps:** Identify affected file → check Supabase client used → check ET timezone handling if drop date related → check isPremium auth chain if premium gate related → propose minimal fix → verify fix does not touch canonical drop date file unless necessary
- **Tools:** Read, Grep, Bash (git diff)

#### `scoopd:security-audit`
- **Trigger:** Before any new API route, admin feature, or auth-adjacent change
- **Eliminates:** Missing the class of issues that slipped past previous audits (hardcoded credentials, client-side auth checks)
- **Inputs:** File path or PR diff
- **Steps:** Grep for hardcoded secrets and passwords → verify admin routes use server-side auth, not client-side password comparison → verify no Supabase anon key used in server contexts → verify no user data returned without auth check → report findings with file:line references
- **Tools:** Grep, Read, Bash

#### `scoopd:ship`
- **Trigger:** Before any push to main
- **Eliminates:** Silent breakage reaching production
- **Inputs:** None — reads current git diff
- **Steps:** Run lint → grep for hardcoded secrets → grep for em-dashes in modified files → check if drop date logic was modified outside canonical file → check if Supabase client usage is correct in modified files → summarize pass/fail per check → block push on any failure
- **Tools:** Bash (npm run lint, git diff, grep)

### Tier 2 — Data ops skills

#### `scoopd:add-restaurant`
- **Trigger:** Adding a new restaurant entry
- **Eliminates:** Re-explaining slug format, platform enum, required fields, do-not-touch notes rule
- **Inputs:** Restaurant name, platform, neighborhood, release_time, observed_days
- **Steps:** Generate slug (lowercase, hyphens, strip apostrophes) → validate platform against enum → validate release_time format (H:MM AM/PM) → check for duplicate slug → confirm observed_days is integer → write via admin API route → verify DB row created → report slug and confirm
- **Tools:** Bash, Read

#### `scoopd:write-note`
- **Trigger:** Writing or updating a restaurant notes field
- **Eliminates:** Re-explaining voice guidelines, em-dash rule, 3-source minimum, do-not-touch list, auto-sentence fallback
- **Inputs:** Restaurant slug and name, source material (minimum 3 sources)
- **Steps:** Check if restaurant is on do-not-touch list — stop immediately if yes → verify 3 sources provided → write note in Scoopd voice (specific, insider, no marketing language, no generic adjectives) → check for em-dashes → check length (fits in meta description at 155 chars if possible) → present for human approval before writing to DB
- **Tools:** Read (fetch existing note), Bash (em-dash check)
- **Hard stop:** Do not write to DB without explicit human approval

#### `scoopd:verify-data`
- **Trigger:** After any bulk data change, scraper run, or manual data entry session
- **Inputs:** None — queries live DB
- **Steps:** Check for malformed release_time values (must match H:MM AM/PM) → check for restaurants with observed_days but no release_time → check for duplicate slugs → check for missing required fields (restaurant, slug, platform) → check NSI flag consistency (non_standard_inventory=true should correlate with ambiguous release patterns) → report findings as actionable list
- **Tools:** Bash (Supabase CLI or API queries)

#### `scoopd:scraper-validate`
- **Trigger:** When scraping pipeline produces candidate data for DB upsert
- **Eliminates:** Bad data silently entering DB from automated sources
- **Inputs:** Candidate data payload (JSON)
- **Steps:** Validate release_time format → validate platform against enum → validate observed_days is positive integer → check for slug collisions → check notes field does not contain em-dashes → check restaurant is not on do-not-touch list before overwriting notes → report pass/fail per record with specific field errors
- **Tools:** Read (do-not-touch list), Bash

### Tier 3 — Feature development skills

#### `scoopd:new-page`
- **Trigger:** Building a new route under `app/`
- **Eliminates:** Re-explaining CSS prefix convention, Supabase client selection, premium gate pattern, ScoopNav/Footer requirement
- **Inputs:** Route path, whether premium-gated, whether server or client component
- **Steps:** Determine CSS prefix from route name → select correct Supabase client → scaffold page file with ScoopNav and ScoopFooter → add metadata export → add canonical URL → if premium-gated, implement isPremium check using subscriptions table pattern → co-locate CSS file with page prefix → verify no Tailwind utility classes in new CSS
- **Tools:** Write, Read (existing page as reference)

#### `scoopd:drop-date-logic`
- **Trigger:** Any change touching reservation date calculations
- **Eliminates:** Drop date logic diverging further across files
- **Inputs:** Description of change needed
- **Steps:** Read canonical implementation in `restaurant/[slug]/page.js` → make change there first → identify all other files that duplicate this logic (`drops/page.js`, `plan/PlanClient.js`) → apply consistent change → flag that extraction to `lib/drop-date.js` is the correct long-term fix → verify computed date for a known restaurant by reading its observed_days and release_time from DB and confirming output matches expected date
- **Tools:** Read, Edit, Grep

#### `scoopd:premium-gate`
- **Trigger:** Adding a new premium-gated feature
- **Eliminates:** Re-explaining blur pattern, isPremium auth check, upsell CTA placement
- **Inputs:** Feature description, page location
- **Steps:** Implement isPremium check via subscriptions table (not just auth.users) → apply blur pattern for free users (blurred placeholder + lock icon + "Get access →" CTA linking to /signup) → verify free users see non-date intelligence unblurred → verify premium users see the gated content → verify upsell CTA is present and links correctly
- **Tools:** Read (drops/page.js as reference), Edit

### Tier 4 — Quality and iteration

#### `scoopd:test`
- **Trigger:** After any feature implementation
- **Eliminates:** Deciding what to test and how in a codebase with no existing test infrastructure
- **Inputs:** Feature or function being tested
- **Steps:** If no test infrastructure exists, bootstrap Jest → prioritize testing drop date calculation first (extract to lib/drop-date.js) → write unit test with known inputs (read a confirmed restaurant's observed_days and release_time from DB, compute expected output for a fixed input date) → write test for release_time parser → write test for edge cases (midnight, 12:00 AM, pre/post release time boundary) → run tests → report pass/fail
- **Tools:** Bash (npm test), Write, Edit

#### `scoopd:refactor`
- **Trigger:** When duplication is identified
- **Eliminates:** Unsafe refactors that break ISR pages or introduce regressions
- **Inputs:** Description of duplication to resolve
- **Steps:** Identify all files containing the duplicated logic → confirm behavior is identical across all instances → extract to shared module in `lib/` → update all consumers → verify no behavior change for known inputs → run lint → flag if change affects ISR revalidation behavior
- **Tools:** Grep, Read, Edit, Bash

---

## Section 3: Command Layer

Six commands. Each is a thin wrapper invoking a skill with context.

| Command | Skill invoked | Notes |
|---------|--------------|-------|
| `/debug` | `scoopd:debug` | Pass error or symptom as argument |
| `/note [slug]` | `scoopd:write-note` | Pre-loads restaurant row for slug |
| `/add` | `scoopd:add-restaurant` | Prompts for required fields |
| `/audit` | `scoopd:security-audit` | Runs on current git diff |
| `/ship` | `scoopd:ship` | Blocks push on failure |
| `/verify` | `scoopd:verify-data` | Runs after any bulk data change |

Commands are defined in `.claude/commands/`. They invoke skills — skills evolve, commands stay stable.

---

## Section 4: Agent Architecture

### Roles

**Planner** (main context window)
- Reads requirements, writes specs, decides scope
- Invokes skills to structure execution
- Does not write code directly — delegates to Executor

**Executor** (subagent, isolated context)
- Runs one focused task with a skill as its instruction set
- Returns diff or result — does not self-approve

**Reviewer** (subagent, read-only)
- Reads diff against original spec
- Checks invariants: no em-dashes, correct Supabase client, drop date logic unchanged, no hardcoded secrets
- Returns pass/fail with specific file:line references

### When to fork context

| Task | Fork? | Reason |
|------|-------|--------|
| Write 10 restaurant notes | Yes, parallel Executors | Independent, no shared state |
| Add a new page | Yes, Executor + Reviewer | Keeps main context clean |
| Fix a drop date bug | No | Needs full context chain |
| Bulk scraper validation | Yes, Executor per batch | Each batch independent |
| Update CLAUDE.md | No | Requires Planner judgment |

---

## Section 5: Tooling Integration

### Bash — exact commands

```bash
# Lint (ship gate)
cd /Users/piggy/scoopd && npm run lint 2>&1

# Secrets check (security-audit, ship gate)
grep -rn "ADMIN_PASSWORD\|api_key=\|password\s*=\s*['\"]" app/ --include="*.js"

# Em-dash check (write-note, ship gate)
grep -rn "\u2014" app/ --include="*.js"

# Drop date logic drift check (ship gate)
git diff --name-only HEAD | grep -v "restaurant/\[slug\]/page\.js" | xargs grep -l "releaseHour\|releaseMinute\|observed_days" 2>/dev/null

# Pre-push diff review
git diff HEAD

# Changes since last deploy
git log origin/main..HEAD --oneline
```

### Test runner

No existing suite. `scoopd:test` bootstraps Jest targeting `lib/drop-date.js` first. Tests run via:

```bash
cd /Users/piggy/scoopd && npx jest --testPathPattern=lib/
```

### Output fed back into context

Lint errors, grep hits, git diff. Nothing else.

---

## Section 6: Verification System

Three gates. Nothing is marked complete until all three pass.

### Gate 1 — Automated (no human needed)
- Lint passes
- No hardcoded secrets
- No em-dashes in modified files
- Drop date logic only modified in canonical file
- Correct Supabase client used in modified files

### Gate 2 — Behavioral diff (when drop date or premium gate is touched)
- `/drops` still filters CLOSED, Walk-in, Phone platforms
- `isPremium` check still queries subscriptions table
- Drop date for a known restaurant (read observed_days and release_time from DB, compute expected date, verify match)

### Gate 3 — Human approval (always)
- Executor returns result
- Reviewer returns pass/fail with specifics
- Human sees: diff + verification results + any flags
- One decision: approve or reject

If Gate 1 fails, Executor fixes before Reviewer is spawned. If Gate 2 fails, Planner re-scopes. Gate 3 is always human.

---

## Section 7: Iteration System

### CLAUDE.md updates
Triggered by: rule broken that CLAUDE.md should have prevented, new invariant from scraper, stale rule. Never speculative.

### New skills
Triggered when the same re-explanation happens twice in separate sessions. Authored using `superpowers:writing-skills`. Every skill requires a concrete trigger condition and a verification step.

### Failure capture
`tasks/lessons.md` — one rule per correction. Reviewed at session start. Skills are promoted from lessons.md when a pattern repeats 2+ times.

### Scraper feedback loop
Scraper data → `scoopd:scraper-validate` → failures logged to `tasks/lessons.md` as data quality patterns → patterns inform scraper improvements.

---

## File Structure

```
scoopd/
  CLAUDE.md                          — operating rules only (restructured)
  docs/
    scoopd-reference.md              — schema, phase history, design system, legal
    superpowers/
      specs/
        2026-04-20-agent-infrastructure-design.md  — this document
  .claude/
    skills/
      scoopd/
        debug/SKILL.md
        security-audit/SKILL.md
        ship/SKILL.md
        add-restaurant/SKILL.md
        write-note/SKILL.md
        verify-data/SKILL.md
        scraper-validate/SKILL.md
        new-page/SKILL.md
        drop-date-logic/SKILL.md
        premium-gate/SKILL.md
        test/SKILL.md
        refactor/SKILL.md
    commands/
      debug.md
      note.md
      add.md
      audit.md
      ship.md
      verify.md
  tasks/
    lessons.md                        — failure patterns and corrections
```

---

## Implementation Order

1. Restructure CLAUDE.md (extract reference material to docs/)
2. Fix admin security issue (move password check server-side)
3. Implement `scoopd:write-note` skill
4. Implement `scoopd:security-audit` skill
5. Implement `scoopd:ship` skill
6. Implement remaining 9 skills
7. Implement 6 commands
8. Extract drop date logic to `lib/drop-date.js` (enables testing)
9. Bootstrap Jest with drop date unit tests
10. Write `docs/scoopd-reference.md`
