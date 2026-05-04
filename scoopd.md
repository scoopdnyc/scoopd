# Scoopd Session Log

---

## Session — April 27, 2026

### Alerts System ("The Dish") — Shipped

Full build from scratch. Two DB migrations: `restaurant_alerts` table (user_id, restaurant_slug, UNIQUE constraint) and `alert_log` table (user_id, restaurant_slug, release_window_key UNIQUE, sent_at). RLS policies on both.

API routes:
- `GET /api/alerts` — auth + premium check, returns alert list
- `POST /api/alerts/toggle` — auth + premium check, upserts/deletes alert, returns `{ active }`

Components:
- `app/components/AlertBell.js` — client component, five states (loading/guest/free/active/inactive), optimistic toggle with revert on failure. Guest links to /signup, free links to /account. Bell SVG always gold (#c9a96e), active state fills button gold.
- `app/components/AlertBell.css` — gold outline pill, gold fill when active

Pages:
- `app/alerts/page.js` — server component, force-dynamic, four render states (guest/free/empty/list), drop date via computeNextDropDate, td- CSS prefix
- `app/alerts/AlertsList.js` — client component, optimistic remove
- `app/account/page.js` — added "Manage your drop alerts" link inside active subscription card

Email:
- `lib/email/alertDigest.js` — Resend send via fetch, mirrors monitorDigest.js pattern
- `lib/inngest/alertDigest.js` — cron every 5 minutes, step 1: find restaurants with release_time in (now, now+5min] ET, step 2: join alerts + subscriptions + resolve emails, step 3: INSERT alert_log with dedup on release_window_key (unique violation = skip), rollback log row on Resend failure
- `app/api/inngest/route.js` — alertDigest added, now serves 4 functions

Inngest synced: 3 functions to 4 functions confirmed in dashboard.

Restaurant page layout updated: AlertBell moved from hero footer to new "Booking Intelligence" heading row, suppressed for walk-in restaurants.

### Drop Date Calc — Extracted

`lib/dropDate.js` created as single source of truth for drop date calculation. Restaurant page now imports `computeNextDropDate`. Alerts page and alertDigest cron also import it. L004 added to `tasks/lessons.md`: `app/drops/page.js` and `app/plan/PlanClient.js` still have inline copies — migrate next time those files are touched.

### Monitor System

All four Inngest functions live: resy-daily-check, sevenrooms-daily-check, sevenrooms-longcal-monthly-check, alert-digest. First monitor catch: Rezdora observed_days corrected 30 to 31.

### Editorial Notes

Una Pizza Napoletana: note pushed (naturally leavened dough, 30+ hour ferment, Thursday-Saturday only, world's best 2022/2024/2025, one pizza per diner, 9 AM / 15 days out). michelin_stars set to null (no star, never awarded).

Crown Shy: note pushed. Jassimran Singh context, James Kent obit, bhatura/pork katsu/char siu lamb shoulder, Resy 10 AM 29 days out.

Muku: note pushed. Asanuma background (o.d.o., Uchu), Tribeca September 2025, Michelin star two months post-open (fastest on record NYC), 10-course $295, five classical Japanese techniques, OpenTable midnight, 1st of month. DB corrected: neighborhood Tribeca, non_standard_inventory true, release_schedule "1st of Month, 2 absolute months", observed_days null.

Bar Miller: note pushed. Jeff Miller and TJ Provenzano, follow-up to Rosella, all-American sourcing (NC bigeye, MA mackerel, ME uni, Hudson Valley rice, CT soy sauce), 8-seat counter, 15 courses $250, OpenTable midnight 31 days out.

Kochi: note pushed. Sungchul Shim background (Per Se, Le Bernardin, Bouley), Hell's Kitchen late 2019, kochi means skewer, 8-course tasting menu, wagyu/kimchi/abalone, OpenTable midnight 31 days out.

Sushi Ginza Onodera: removed from DB. Closed August 2023, confirmed via Yelp update November 2025.

### Pending

- 29 restaurants still without editorial notes
- `app/drops/page.js` and `app/plan/PlanClient.js` inline drop date copies (L004)
- OpenTable monitor not built (requires GraphQL query body from network tab)
