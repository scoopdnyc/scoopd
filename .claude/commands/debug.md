Debug the issue described in $ARGUMENTS.

## Scoopd Debugging Workflow

**Symptom/error:** $ARGUMENTS

### Step 1: Identify affected area
- If the issue involves drop dates or reservation calculations, start with `app/restaurant/[slug]/page.js` (canonical file)
- If the issue involves premium gating or subscription status, check the `isPremium` auth chain in the affected page
- If the issue involves admin or data entry, check `app/api/admin/` routes

### Step 2: Check Supabase client
Verify the affected file uses the correct Supabase client:
- Client components: `lib/supabase-browser.js`
- Server components + API routes: `lib/supabase-server.js`
- Sitemap only: `lib/supabase-static.js`
Wrong client = broken auth. This is a common root cause.

### Step 3: Check ET timezone handling
If the issue is a wrong date being displayed, verify:
- ET time is extracted using `Intl.DateTimeFormat` with `timeZone: 'America/New_York'`
- If current ET time is before release_time, restaurant date is yesterday
- Next bookable = restaurant date + observed_days - 1

### Step 4: Propose minimal fix
- Fix only the root cause
- Do not refactor surrounding code
- Do not touch `app/restaurant/[slug]/page.js` drop date logic unless the bug is specifically there

### Step 5: Verify fix
Run `npm run lint 2>&1` and confirm no new errors introduced.
