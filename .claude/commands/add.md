Add a new restaurant to the Scoopd database.

## Add Restaurant Workflow

Collect the following required fields from the user before proceeding:
- Restaurant name (required)
- Neighborhood (e.g. West Village, Tribeca)
- Platform (must be one of: Resy, OpenTable, DoorDash, Tock, Tock/OpenTable, Resy/OpenTable, Resy/Tock, Phone/Relationships, Walk-in, Own Site, Yelp)
- Release Time ET (format must be exactly: H:MM AM/PM e.g. "10:00 AM", "12:00 AM")
- Observed Days Out (positive integer, or leave blank if release_schedule applies)
- Difficulty (one of: Extremely Hard, Very Hard, Hard, Medium, Easy, Walk-in Only)
- Price Tier (one of: $, $$, $$$, $$$$)

## Validation before inserting

1. Generate slug: lowercase name, hyphens instead of spaces, strip apostrophes
   e.g. "Sartiano's" → "sartianos", "Le Bernardin" → "le-bernardin"
2. Confirm release_time matches format H:MM AM/PM exactly
3. Confirm platform is from the allowed enum above
4. Confirm observed_days is a positive integer if provided

## Insert via admin API

POST to `/api/admin/add-restaurant` with `credentials: 'include'` (requires admin session cookie).
If not already authenticated as admin, direct the user to visit /admin to authenticate first.

## After inserting

Confirm the slug was created and report the new restaurant's URL: `https://scoopd.nyc/restaurant/[slug]`
