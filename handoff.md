---
updated: 2026-05-14
session: OpenTable monitor completion
---

# Scoopd Handoff

## Goal

Get to a subscriber base. Scoopd is live, feature-complete through Phase 4. The platform has paying users, 192 restaurants, full monitor coverage, and two blog posts. The current focus is traffic and subscribers via organic SEO (blog content pipeline), social seeding, and press outreach. Phase 5 (app, expansion, monetization diversification) starts after traction is established.

---

## Current State of the Code

**Production:** Live at scoopd.nyc. Vercel Hobby. Stripe live mode. Supabase production.

**Monitor coverage (all live):**
- Resy: 119 restaurants, daily 12:30 PM ET
- SevenRooms rolling: Adda, Dhamaka, Semma, Masalawala & Sons, Noz 17
- SevenRooms long calendar: Marea, Rezdora, daily 12:30 PM ET
- SevenRooms monthly: Sushi Noz, 1st and 15th at 2 PM UTC
- NSI opportunistic: Corner Store, Or'Esh, The 86, every 5 min noon-6 PM ET via GitHub Actions
- OpenTable: 28 restaurants (Aska and Yingtao excluded), daily 5 PM UTC via Inngest

**Inngest functions (5 total):** resy-daily-check, sevenrooms-daily-check, sevenrooms-longcal-monthly-check, alert-digest, opentable-daily-check

**Blog (2 posts live):**
- /blog/the-reservation-economy (May 2, 2026)
- /blog/rolling-windows-and-monthly-drops (May 12, 2026)

**Content files:** `content/blog/*.mdx` with frontmatter (title, description, publishedAt, updatedAt, slug).

---

## Files Edited This Session (May 13-14, 2026)

- `lib/monitors/opentable.js` — rewrote to add BlockedAvailability, NoTimesExist (fully booked), and experience-only response pattern handling; added Aska/Yingtao comment
- `scoopd.md` — session log, open tasks, monitor status updated
- `docs/scoopd-reference.md` — OpenTable monitor section fully documented (probe logic, known limitation, all restaurant IDs)

Earlier in the same session (May 13):
- `lib/monitors/opentable.js` — created from scratch
- `lib/inngest/opentableDailyCheck.js` — created
- `app/api/inngest/route.js` — added opentableDailyCheck (now serves 5 functions)

---

## Everything That Failed

**OpenTable API access from server:**
- curl to `https://www.opentable.com/dapi/fe/gql` returns 0 bytes — Akamai drops connection before response
- WebFetch to OpenTable restaurant pages blocked
- Sending browser cookies with curl: still blocked (Akamai fingerprints more than cookies)
- Chrome browser extension: not connected during session, could not use browser automation

**OpenTable restaurant ID lookup:**
- Fetching OpenTable pages directly: all blocked
- Workaround that worked: fetched each restaurant's own website, grepped HTML for OpenTable widget embed URL containing `rid=` or `restref=` parameter
- Got 18/29 IDs this way. Remaining 10 (including jean-georges) provided manually by user.

**Known monitor limitation:** OpenTable monitor may log `http_403` from Vercel IPs due to Akamai. First run will reveal whether server-side requests are blocked in production. If so, the monitor is silently skipping all restaurants. Check monitor_log after 5 PM UTC.

---

## Open Tasks (Priority Order)

1. **Verify OpenTable monitor first run** — Check monitor_log after 5 PM UTC for `http_403` flag_reason entries. If all 28 restaurants show 403, Akamai is blocking Vercel IPs and the monitor needs a proxy or alternative approach.

2. **Blog post #3** — High ROI. Third post needed before activating press outreach (target: 3-4 posts live before pitching). Topic candidates:
   - "How to Actually Get a Reservation at Carbone" (high-search specific)
   - Platform comparison piece (Resy vs OpenTable vs Tock)
   - NYC Restaurant Week reservation strategy (timely)

3. **Backlink outreach** — Eater NY, Grub Street, The Infatuation, NYC food newsletters. Not started. Activate after 3-4 posts.

4. **Social accounts** — X and Reddit (personal aged accounts) rebranded. Claude drafts content, manual post only. Not yet activated.

5. **Aska and Yingtao strategy** — Both are experience-only on OpenTable right now (all slots are type "Experience", no Standard reservations). Monitor detects this and logs `skip:experience_only`. Decide: remove opentable_restaurant_id from both, or leave and let monitor handle it gracefully. No urgency.

6. **Need to Know box system** — Deferred. Needs cancellation policy, dress code, credit card hold data across all 192 restaurants. Data sourcing required before building.

7. **Catch Hospitality blog post** — Deferred. Corner Store / The Eighty Six / Or'Esh booking mechanic. Needs thorough research before writing.

---

## Live Issues to Watch

- **OpenTable Akamai blocking** — First monitor run at 5 PM UTC will confirm. Check `monitor_log` table, filter `source = 'opentable'` and look at `flag_reason` values.
- **Lilia false positive** — Known issue. Closed day compression causes monitor to flag. Ignore until pattern changes.
- **Cafe Spaghetti false positive** — Known issue. Temporary closure. Ignore until reopened.
- **Inngest free tier** — 5 functions, all within limit. If adding more functions, check tier limits first.

---

## Single Next Step

Check the OpenTable monitor first run: after 5 PM UTC today, query `monitor_log` for `source = 'opentable'` and verify whether restaurants are returning real availability data or all logging `http_403`. That determines whether the monitor is actually working from Vercel or needs a proxy workaround.

```sql
SELECT restaurant_slug, flag_reason, checked_at
FROM monitor_log
WHERE source = 'opentable'
ORDER BY checked_at DESC
LIMIT 30;
```
