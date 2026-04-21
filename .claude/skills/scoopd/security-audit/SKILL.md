---
name: scoopd:security-audit
description: Security audit for Scoopd. Triggers before any new API route, admin feature, auth change, or when the /audit command is invoked.
---

# Security Audit

Run every check below in order. Report all findings. Block ship on any Critical finding.

## Check 1: Hardcoded secrets in app/

```bash
grep -rn "ADMIN_PASSWORD\|scoopd2026\|password\s*=\s*['\"][^'\"]\+['\"]" app/ --include="*.js" \
  | grep -v "//.*password" \
  | grep -v "placeholder"
```

Any match is Critical. The specific pattern `const ADMIN_PASSWORD` in a client component
is the exact vulnerability that was previously missed. Flag it by name if found.

## Check 2: Client-side auth validation

```bash
grep -rn "localStorage\|sessionStorage" app/ --include="*.js"
```

Auth state stored in localStorage or sessionStorage is a warning. Also read
`app/admin/page.js` directly and confirm `handlePasswordSubmit` calls an API route,
not a local password comparison.

## Check 3: Supabase browser client in server contexts

```bash
grep -rn "supabase-browser" app/api/ --include="*.js"
grep -rn "supabase-browser" app/ --include="page.js" | grep -v "components"
```

API routes using `supabase-browser` is Critical. Server components using it is Critical.
Only client components (`'use client'`) may use `supabase-browser`.

## Check 4: Unauthenticated admin routes

Read each file in `app/api/admin/`. For each route:
- Confirm it calls `isAdminAuthed(request)` before processing
- Confirm it returns 401 if auth fails
- Confirm it does NOT trust any userId or admin flag from the request body

## Check 5: User data without auth

Read each file in `app/api/`. For any route returning user-specific data:
- Confirm `serverSupabase.auth.getUser()` is called
- Confirm the returned user.id scopes the query (not a user-supplied ID)

## Reporting Format

```
SECURITY AUDIT — [date]
=======================

CRITICAL (block ship):
  [ ] file:line — description

WARNINGS (fix before next release):
  [ ] file:line — description

PASSED:
  [x] Check 1: No hardcoded secrets
  [x] Check 2: No client-side auth
  [x] Check 3: No browser Supabase in server contexts
  [x] Check 4: All admin routes require auth
  [x] Check 5: User data is auth-scoped

Status: [BLOCKED / CLEAR]
```

Do not mark Status as CLEAR until all Critical items are resolved.
