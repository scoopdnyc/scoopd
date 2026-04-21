Verify data integrity after a bulk data change or scraper run.

## Data Verification Checks

Run these checks via Supabase or by querying the DB directly.

### Check 1: Malformed release_time values
release_time must match the pattern H:MM AM/PM exactly (e.g. "10:00 AM", "12:00 AM").
Query for any restaurants where release_time is not null and does not match this pattern.

### Check 2: Missing release_time with observed_days
Any restaurant with observed_days set but release_time null/empty is missing data.
The drop date calculation will fail silently for these restaurants.

### Check 3: Duplicate slugs
Slugs must be unique. Query for any slug that appears more than once.

### Check 4: Missing required fields
Every restaurant must have: restaurant (name), slug, platform.
Query for rows where any of these are null or empty.

### Check 5: NSI flag consistency
Restaurants with non_standard_inventory=true should have either:
- No observed_days and no release_time (truly ambiguous), OR
- observed_days and release_time set (but flagged as unreliable pattern)
Flag any NSI restaurants that seem inconsistently configured.

## Report format

List all findings as an actionable list. For each issue: table name, field, slug, and the problem.
If no issues found: "Data integrity check passed — no issues found."
