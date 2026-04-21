Invoke the scoopd:verify-data skill to check data integrity after a bulk change.

Check for: malformed release_time values, restaurants with observed_days but no
release_time, duplicate slugs, missing required fields (restaurant, slug, platform),
NSI flag consistency.

Report all findings as an actionable list.
