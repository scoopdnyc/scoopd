# Scoopd Agent Handoff

## How to use this file
Paste the full contents of this file at the start of a new chat session to onboard the agent instantly. At the end of every session, run the handoff prompt from scoopd.md to update the Session section below.

---

## Permanent Context

**Product:** Scoopd (scoopd.nyc) — NYC restaurant reservation intelligence platform. Tracks exact drop times and booking windows for 192 restaurants. Freemium, $9.99/month premium tier.

**Stack:** Next.js 16.2.1 (App Router), Supabase, Stripe, Vercel Hobby, Inngest, Resend, GitHub Actions. GitHub: scoopdnyc/scoopd. Supabase project ID: zztiidefywmsinssmxiy.

**Key files to read first:**
- scoopd.md — working session log, current phase status, open tasks, file structure
- scoopd-reference.md — permanent technical gospel: full schema, monitor algorithms, design system, founding system, legal

**Supabase clients — critical:**
- lib/supabase-browser.js — client components only
- lib/supabase-server.js — server components and API routes with user auth
- lib/supabase-static.js — ISR/static pages, no auth context
- lib/supabase.js — sitemap only

**How Fred works:**
- Direct, minimal explanation unless asked
- Always verify DB state before making changes — query first, change second
- Never auto-update observed_days or any DB field based solely on a monitor flag — flags trigger manual investigation only
- Never overwrite existing restaurant notes with scripts without explicit instruction
- Do not touch do-not-touch restaurant notes: 4 Charles Prime Rib, Bemelmans Bar, Bistrot Ha, Carbone, Cote, Double Chicken Please, Eleven Madison Park, Ha's Snack Bar, Jeju Noodle Bar, Joo Ok, Lilia, Minetta Tavern, Tatiana, Theodora, Torrisi, Via Carota
- No em dashes anywhere in copy — ever
- Scoopd voice: specific, insider, no marketing language, no generic adjectives
- When in doubt about file placement: session logs go in scoopd.md, permanent technical reference goes in scoopd-reference.md

**Monitor system:**
- Resy: Inngest, daily 12:30 PM ET, 119 restaurants
- SevenRooms: Inngest, daily + monthly
- OpenTable: GitHub Actions, daily 5 PM UTC — currently non-functional, Akamai blocks all automated requests. Active investigation in progress.
- NSI opportunistic: GitHub Actions, every 5 min noon-6 PM ET

**Active platforms:** Resy, OpenTable, SevenRooms (rolling/long-cal/monthly), Tock, DoorDash, Phone, Walk-in

---

## Session

**Last updated:** [DATE]

**What was done:**
[FILLED BY CLAUDE CODE]

**In progress:**
[FILLED BY CLAUDE CODE]

**Open tasks (priority order):**
[FILLED BY CLAUDE CODE]

**Live issues:**
[FILLED BY CLAUDE CODE]

**Next step:**
[FILLED BY CLAUDE CODE]
