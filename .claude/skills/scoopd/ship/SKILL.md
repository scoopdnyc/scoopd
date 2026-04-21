---
name: scoopd:ship
description: Pre-push verification gate for Scoopd. Triggers before any push to main, or when the /ship command is invoked.
---

# Ship Gate

Run all checks before pushing to main. All must pass. Block push on any failure.

## Check 1: Lint

```bash
cd /Users/piggy/scoopd && npm run lint 2>&1
```

Expected: exit 0 with no errors. Warnings are acceptable. Fix all errors before continuing.

## Check 2: Hardcoded secrets

```bash
cd /Users/piggy/scoopd && grep -rn "ADMIN_PASSWORD\|scoopd2026\|password\s*=\s*['\"][^'\"]\+['\"]" app/ \
  --include="*.js" | grep -v "placeholder" | grep -v "\/\/"
```

Expected: no output. Any match is a Critical failure. Do not ship.

## Check 3: Em-dashes in modified files

```bash
cd /Users/piggy/scoopd && git diff --name-only HEAD | xargs -r grep -ln "—" 2>/dev/null
```

Expected: no output. Any match means a modified file contains an em-dash. Find the line,
fix the copy (use a period or colon), then re-run.

## Check 4: Drop date logic drift

```bash
cd /Users/piggy/scoopd && git diff --name-only HEAD \
  | grep -v "app/restaurant/\[slug\]/page\.js" \
  | xargs -r grep -l "releaseHour\|releaseMinute\|parseReleaseMinutes" 2>/dev/null
```

Expected: no output. If any file returns, drop date logic was modified outside the
canonical file. Review before shipping.

## Check 5: Supabase client correctness

```bash
cd /Users/piggy/scoopd && git diff --name-only HEAD | xargs -r grep -l "supabase-browser" 2>/dev/null \
  | grep -v "components/"
```

Expected: no output. Any API route or server component using supabase-browser is a failure.

## Check 6: What's shipping

```bash
cd /Users/piggy/scoopd && git log origin/main..HEAD --oneline
cd /Users/piggy/scoopd && git diff origin/main..HEAD --stat
```

Review what commits and files are included. Confirm nothing unexpected is in the diff.

## Report Format

```
SHIP GATE — [date]
==================

[ ] Check 1 Lint:              PASS
[ ] Check 2 Secrets:           PASS
[ ] Check 3 Em-dashes:         PASS
[ ] Check 4 Drop date drift:   PASS
[ ] Check 5 Supabase clients:  PASS
[ ] Check 6 Diff review:       [summary of what's shipping]

Status: CLEAR TO SHIP
```

Replace PASS with FAIL and specific finding for any failed check.
Only write "CLEAR TO SHIP" when all checks pass.

## After Clearance

```bash
cd /Users/piggy/scoopd && git push origin main
```
