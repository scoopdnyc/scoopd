# Growth Playbook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drive meaningful traffic and domain authority by executing three parallel content tracks: Reddit engagement library, press placements from existing editorial pieces, and next-tier how-to blog posts.

**Architecture:** Three independent tracks executed in sequence. Track 1 (Reddit) delivers immediately usable answer templates. Track 2 (Press) adapts existing blog posts into submission-ready pieces with pitch emails. Track 3 (Content) writes the next batch of how-to MDX posts committed to the repo.

**Tech Stack:** MDX (blog posts), git (content commits), Resend-style pitch emails (plain text, no tooling)

**Spec:** `docs/superpowers/specs/2026-05-25-growth-playbook-design.md`

---

## Track 1: Reddit Engagement Library

### Task 1: Map target questions and subreddits

**Files:**
- Create: `docs/marketing/reddit-library.md`

- [ ] **Step 1: Identify the 10 highest-frequency question patterns**

The six how-to posts cover: Carbone, Lilia, Via Carota, Don Angie, Torrisi, 4 Charles Prime Rib. Map each to the question patterns that appear regularly in r/FoodNYC, r/AskNYC, r/finedining:

```
Pattern 1: "How do I get a reservation at [Restaurant]?" — direct
Pattern 2: "Is [Restaurant] worth the hassle?" — with booking question embedded
Pattern 3: "Any tips for booking [Restaurant]?" — tips-focused
Pattern 4: "I've been trying to book [Restaurant] for months..." — venting + help-seeking
Pattern 5: "What's the best strategy for hard NYC reservations?" — general
Pattern 6: "Does the Resy drop really work?" — platform-specific
Pattern 7: "Is [Restaurant] walk-in friendly?" — walk-in focused
Pattern 8: "What's Amex GDA / Platinum Nights actually like?" — access tiers
Pattern 9: "Don Angie Resy vs OpenTable — what's changed?" — platform switch
Pattern 10: "Any NYC restaurants where walk-in is actually viable?" — walk-in general
```

- [ ] **Step 2: Write 5 restaurant-specific answer templates (batch 1)**

Write full answers for the following restaurant + question combinations. Each answer must:
- Be complete and useful without clicking the link
- Include the link naturally in context, not as the lead
- Be written in first-person personal voice, not brand voice
- Be 100-200 words — specific enough to be credible, short enough to read

**Template set 1:**

*Carbone — "How do I get a reservation?"*
```
The drop is 10 AM on Resy, 31 days out. Set an alarm. Be signed in before the minute turns. Have your party size, date, and time already selected. Do not browse first — go directly to the booking page.

Weekday lunch is meaningfully easier than weekend dinner. Competition drops noticeably for Tuesday through Thursday slots, and lunch goes later into the morning before selling out.

If you hold an Amex Platinum, check the GDA tab in Resy before the public drop. Carbone participates and you may find slots unavailable to general users.

Carbone is also on Dorsia, which the restaurant itself lists as an authorized channel. If you have a membership, this is legitimate.

More detail on the full breakdown, including the email channel most people don't know about: [How to Get a Reservation at Carbone](https://scoopd.nyc/blog/how-to-get-a-reservation-at-carbone)
```

*Lilia — "How do I get a reservation?"*
```
Three paths that actually work:

**Resy drop:** 10 AM, 28 days out. Fast — prime Saturday dinner is gone in minutes. Weekday slots survive longer.

**2 PM same-day:** Lilia's own team has confirmed that cancellations tend to surface around 2 PM on the day you want to go. Check Resy in the early afternoon. Works more often than people expect.

**Walk-in:** Bar and patio seats held nightly. Arrive by 4 PM weekends, 5 PM weekdays. Full menu, full service. This is one of the most reliable walk-in programs at this difficulty level in New York.

If you hold Amex Platinum, Lilia is in the Platinum Nights program — inventory held exclusively for cardholders, not visible in the public window.

Full breakdown: [How to Get a Reservation at Lilia](https://scoopd.nyc/blog/how-to-get-a-reservation-at-lilia)
```

*Via Carota — "Is it walk-in friendly?"*
```
Yes, genuinely. Via Carota holds tables for walk-ins at dinner every night — this is deliberate policy, not overflow.

Timing matters: arrive before 5 PM weekdays, before 4:30 PM weekends. After that the wait gets unpredictable. One to three hours on a Friday or Saturday is common if you arrive late.

Weeknight walk-in is considerably more manageable. Tuesday or Wednesday at 5 PM can get you a table in 30-45 minutes. The bar area is worth waiting for — full menu, same kitchen.

If you'd rather book: Resy, 10 AM, 31 days out. Weekday lunch on the drop is the easiest Resy path.

More detail: [How to Get a Reservation at Via Carota](https://scoopd.nyc/blog/how-to-get-a-reservation-at-via-carota)
```

*Don Angie — "Still on Resy?"*
```
No — Don Angie moved to OpenTable in May 2025. If you've been searching for it on Resy and coming up empty, that's why. Any guide pointing you there is out of date.

The current drop: OpenTable, 9 AM, 8 days out. Much shorter window than most comparable restaurants — you're booking about a week ahead, not a month.

If you had Don Angie saved on Resy with a Notify alert, that alert is no longer active. Set up OpenTable notification separately.

Lunch (Friday-Sunday, 11:30 AM-2 PM) is the easiest path to a table. Full menu. If your schedule allows it, book lunch.

Full breakdown: [How to Get a Reservation at Don Angie](https://scoopd.nyc/blog/how-to-get-a-reservation-at-don-angie)
```

*4 Charles — "Worth the hassle?"*
```
Depends on what you're going for. It's a 45-seat room, genuinely good prime rib, and the booking rules are stricter than almost anywhere else in the city.

A few things to know before you book: there's a $5 per person non-refundable reservation fee at booking. Your party size is locked — reducing it later triggers a $50 per person fee on your final check. Read the fine print.

The drop: Resy, 9 AM, 21 days out.

Brunch (Fri-Sun) is the highest-percentage path to a seat. Full menu, meaningfully less competition than dinner.

4 Charles is open 7 days, which is unusual at this level. Sunday and Monday dinner are somewhat easier to land than Friday or Saturday.

Full breakdown including the anti-resale enforcement (Appointment Trader is specifically named): [How to Get a Reservation at 4 Charles Prime Rib](https://scoopd.nyc/blog/how-to-get-a-reservation-at-4-charles-prime-rib)
```

- [ ] **Step 3: Write 5 general answer templates (batch 2)**

*"What's the best strategy for hard NYC reservations in general?"*
```
Depends on the restaurant type — there are two systems:

**Rolling window restaurants** drop a new date every morning at a set time. The strategy is consistency: show up at the drop time every day. Carbone drops at 10 AM, 31 days out. Don Angie at 9 AM, 8 days out. The key is knowing which platform they're on (Resy, OpenTable, DoorDash — it varies) and the exact time.

**Monthly drop restaurants** release an entire month at once, usually on the 1st. Eleven Madison Park, Per Se, Masa, Joo Ok — all first of the month. Miss the drop and you wait another month. Multiple of these conflict on the same day at the same time, so you have to pick one.

The difference matters because your strategy is completely different. Scoopd tracks all of this for 192 NYC restaurants: [scoopd.nyc](https://scoopd.nyc)
```

*"Any NYC restaurants where walk-in is actually a real option?"*
```
A few that are worth the effort:

**Via Carota** — deliberate walk-in program, bar and patio nightly. Arrive before 5 PM weekdays, 4:30 PM weekends.

**Lilia** — bar and patio walk-in every night. Arrive by 4-5 PM. Same-day cancellations also surface around 2 PM on Resy.

**Torrisi** — 12 bar seats, walk-in only, parties of one or two. Arrive by 4:15 PM. Hard party size limit.

**Minetta Tavern** — bar walk-in regularly available, particularly weeknight.

The key with all of these: arrive early, before service starts. Coming at 7 PM on a Saturday and expecting a walk-in table at any of these is not a real strategy.
```

*"Is Amex GDA / Platinum Nights actually worth it for reservations?"*
```
Depends on how often you use it.

GDA (Global Dining Access) gives Platinum cardholders Priority Notify — you see cancellations before non-cardholders do. It's useful but not a guarantee.

Platinum Nights is different. It reserves a portion of inventory exclusively for Platinum cardholders — seats that don't appear in the public Resy window at all. Lilia is one of eight inaugural NYC restaurants in the program. If the public window shows nothing and you hold the card, check the GDA tab — you may find availability that doesn't exist for anyone else.

Which restaurants participate changes. Check the GDA tab in the Resy app directly for current availability.
```

*"Tips for the Resy 10 AM drop?"*
```
A few things that actually matter:

1. Be signed in before the minute turns. Don't log in at 10:00 — be logged in at 9:59.
2. Know your party size and target date before you open the app. Any browsing costs you time.
3. Go directly to the restaurant's page, not the search. Every extra tap is a second lost.
4. Have your payment method saved. The booking completes faster.
5. If weekend dinner is gone immediately, try weekday or lunch on the same drop. Competition is noticeably lower.
6. The drop date matters: if you want a Friday dinner, the Friday morning 28 (or 31) days prior is when to show up.
```

*"What's the actual deal with the reservation secondary market / Appointment Trader?"*
```
The short version: NY passed the Restaurant Reservation Anti-Piracy Act in early 2025, making unauthorized reservation resale illegal. Appointment Trader geofenced its NY inventory shortly after. The retail secondary market is mostly gone for NYC.

A few restaurants had already started enforcing on their own. 4 Charles names Appointment Trader specifically in their booking policy and states they will cancel reservations identified as sold or traded and flag those accounts.

The access tiers that replaced the secondary market (Amex GDA, Visa Dining Collection, Dorsia) are technically legal — they operate with restaurant consent. Whether that consent was freely given when Amex owns the reservation platform most restaurants depend on is a genuinely open question.
```

- [ ] **Step 4: Write additional templates for Torrisi**

*Torrisi — "How do I get a reservation?"*
```
Torrisi is unusual in that the restaurant tells you exactly where to book. Their site names two channels: Resy and Dorsia. That's the complete list.

**Resy drop:** 10 AM, 31 days out, parties up to six. Weekend dinner goes fast. Weekday lunch is the easier path.

**Bar walk-in:** 12 seats, parties of one or two only. Hard limit. Arrive by 4:15 PM. First come, first served. Full service, full menu.

**Dorsia:** Torrisi explicitly names it as an authorized channel. If you have a membership and credits, this is legitimate — the restaurant itself endorses it.

Lunch (Wednesday-Saturday) is meaningfully easier than dinner. Same room, same kitchen, noticeably less competition.

Full breakdown: [How to Get a Reservation at Torrisi](https://scoopd.nyc/blog/how-to-get-a-reservation-at-torrisi)
```

- [ ] **Step 5: Save the library**

Save all templates to `docs/marketing/reddit-library.md` with clear section headers by restaurant and question type. Include posting notes (which subreddit, what question pattern to watch for).

- [ ] **Step 6: Commit**

```bash
git add docs/marketing/reddit-library.md
git commit -m "marketing: add Reddit engagement answer library"
```

---

## Track 2: Press Pitches

### Task 2: Pitch "Who Gets the Table" to food media

**Files:**
- Create: `docs/marketing/press-pitches.md`

The piece at `/blog/who-gets-the-table` is submission-ready as-is. No rewrite needed.

- [ ] **Step 1: Write the submission pitch for Eater NY (primary target)**

```
Subject: Submission: "Who Gets the Table: A History of Access in New York's Most Impossible Rooms"

Hi [editor name],

I'm the founder of Scoopd, a reservation intelligence platform tracking 192 NYC restaurants. I've written a cultural history piece on how access to New York's most coveted dining rooms has been bought and sold from Prohibition through the American Express acquisition of Resy and Tock — and what that arc tells us about where we've landed.

The piece runs from Chumley's and Henri Soulé's pencil book through Elaine Kaufman, the Truman Capote implosion at La Côte Basque, Danny Meyer's road not taken, and the platform consolidation that made the purple brick in the Resy app the latest version of a transaction that has never really changed.

Happy to share the full piece on request. It runs around 4,500 words.

[Name]
Founder, Scoopd.nyc — NYC restaurant reservation intelligence
```

- [ ] **Step 2: Write pitch variants for secondary targets**

**Grub Street (New York Magazine):**
```
Subject: Pitch: Cultural history of NYC dining access, Chumley's to Amex

Hi [editor name],

A long piece on how the table at the front of every hard New York dining room has always been reserved — and how the currency required to sit there has changed from social capital to credit card annual fees without the underlying transaction changing at all.

Runs from Prohibition-era Greenwich Village through Soulé, Elaine Kaufman, the Capote scandal, Danny Meyer, and the Amex acquisition of Resy and Tock. About 4,500 words.

[Name]
Founder, Scoopd.nyc
```

**The Cut (New York Magazine):**
```
Subject: Essay submission — reservation economy, access, and the purple brick

Hi [editor name],

An essay on the cultural history of who gets the best table in New York and what they've always had to pay, told through eight decades of dining rooms from a Greenwich Village speakeasy to American Express's $400 million acquisition of Tock.

The through-line: the transaction has never changed. Only the currency has.

4,500 words, available on request.

[Name]
Founder, Scoopd.nyc
```

- [ ] **Step 3: Write author bio (used for all submissions)**

```
[Name] is the founder of Scoopd (scoopd.nyc), a reservation intelligence platform tracking drop times, booking windows, and platform mechanics for 192 New York City restaurants.
```

- [ ] **Step 4: Save pitches to docs/marketing/press-pitches.md**

Include: pitch text for each outlet, author bio, submission notes (which editor to target, editorial voice notes for each outlet), and a tracking section to record send dates and responses.

### Task 3: Adapt "The Reservation Economy" for op-ed placement

**Files:**
- Modify: `content/blog/the-reservation-economy.mdx` — rewrite last two paragraphs for neutral ending
- Create: section in `docs/marketing/press-pitches.md`

- [ ] **Step 1: Rewrite the ending (last two paragraphs)**

Current ending (lines 41-45) reads as a Scoopd advertisement. Replace with:

```markdown
The information to compete fairly was always there. The drop times, the release windows, the exact moment a reservation becomes available on the exact platform where it lives. None of it was published. None of it was explained. Most people have never had it. That gap is not accidental — it exists because the platforms and the access-tier programs that sit on top of them benefit from it.

A reservation at Torrisi or Don Angie doesn't require a bot. It requires knowing that Torrisi drops at 10:00 AM on Resy, 31 days out, and Don Angie drops at 9:00 AM on OpenTable, 8 days out. The table was never out of reach. The information was.
```

- [ ] **Step 2: Update updatedAt frontmatter**

Change `updatedAt: "2026-05-02"` to `updatedAt: "2026-05-25"` in the MDX frontmatter.

- [ ] **Step 3: Write the newsletter pitch**

Target: food-focused Substack writers and NYC newsletter editors (not Eater/Grub — that's the history piece)

```
Subject: Essay — the reservation economy, credit card access tiers, and the secondary market

Hi [name],

A piece on how the NYC restaurant reservation became a financial product — and what the American Express acquisition of Resy and Tock means for anyone who doesn't hold a Platinum card.

Runs about 1,200 words. Covers bot services, the secondary market, the NY Anti-Piracy Act, and why the platforms built the access tier programs for the credit card companies rather than for diners.

[Name]
Founder, Scoopd.nyc
```

- [ ] **Step 4: Commit**

```bash
git add content/blog/the-reservation-economy.mdx docs/marketing/press-pitches.md
git commit -m "content: rewrite reservation-economy ending for press placement; add press pitches doc"
```

---

## Track 3: How-To Content — Next Batch

### Task 4: Write next 5 how-to blog posts

**Files:**
- Create: `content/blog/how-to-get-a-reservation-at-le-bernardin.mdx`
- Create: `content/blog/how-to-get-a-reservation-at-eleven-madison-park.mdx`
- Create: `content/blog/how-to-get-a-reservation-at-per-se.mdx`
- Create: `content/blog/how-to-get-a-reservation-at-joo-ok.mdx`
- Create: `content/blog/how-to-get-a-reservation-at-masa.mdx`

Each post follows the established format from the six live posts. Requirements:
- Frontmatter: title, date, publishedAt, updatedAt (all "2026-05-25"), description
- Sections: The drop, plus any genuinely non-obvious mechanics (walk-in, access tiers, platform quirks, monthly drop conflicts)
- Internal links: restaurant page (`/restaurant/[slug]`), neighborhood page, `/blog/rolling-windows-and-monthly-drops` where drop is first mentioned
- Cross-links: natural connections to other restaurants where they exist (monthly drop conflict between EMP/Per Se/Masa is the primary one)
- No em dashes anywhere
- No fabrication — all mechanics must be verifiable from observed data in Supabase DB

**Known mechanics to cover per restaurant:**

*Le Bernardin:* 7 AM drop (earliest of any tracked restaurant), Resy, 28 days out, Midtown, Very Hard. Amex GDA participant. Prix fixe only, no walk-in program. Business lunch is the easier path.

*Eleven Madison Park:* Monthly drop, 1st of month, 10 AM, Resy, 2 absolute months out. Conflicts with Per Se and others on same day. Prepaid tasting menu. No walk-in.

*Per Se:* Monthly drop, 1st of month, 10 AM, Tock, 2 absolute months out. Conflicts directly with EMP — same day, same time, must choose. Columbus Circle, $$$$. Tock prepaid.

*Joo Ok:* Monthly drop, midnight, 1st of month, Resy. Korean tasting menu. Very Hard. Walk-in not viable. Monthly conflict context.

*Masa:* Monthly drop, midnight, Tock. Most expensive restaurant in the US. No walk-in, no shortcuts. The drop is the only path.

- [ ] **Step 1: Verify mechanics in DB before writing**

Run a quick Supabase check to confirm release_time, observed_days, release_schedule, platform for all five restaurants before writing. Do not fabricate from memory.

```
Query: SELECT restaurant, slug, platform, release_time, observed_days, release_schedule, difficulty, neighborhood 
FROM restaurants 
WHERE slug IN ('le-bernardin', 'eleven-madison-park', 'per-se', 'joo-ok', 'masa')
```

- [ ] **Step 2: Write Le Bernardin post**

Filename: `content/blog/how-to-get-a-reservation-at-le-bernardin.mdx`

Structure:
- Opening paragraph: link restaurant name to `/restaurant/le-bernardin`, mention [Midtown](/neighborhood/midtown)
- ## The drop: link days-out to `/blog/rolling-windows-and-monthly-drops`
- ## Lunch: business lunch as the easier path
- ## Amex access: if GDA participant, document it
- Cross-link: natural Midtown neighbor (Gabriel Kreuther or similar if a post exists)

- [ ] **Step 3: Write Eleven Madison Park post**

Filename: `content/blog/how-to-get-a-reservation-at-eleven-madison-park.mdx`

Structure:
- Opening: link to `/restaurant/eleven-madison-park`, mention neighborhood
- ## The drop: monthly, link to `/blog/rolling-windows-and-monthly-drops` — explain the monthly conflict
- ## The conflict: EMP, Per Se, Masa, Joo Ok all on 1st of month — must choose
- ## What to expect: prepaid, prix fixe only
- Cross-link: Per Se and Masa (natural monthly drop companions)

- [ ] **Step 4: Write Per Se post**

Filename: `content/blog/how-to-get-a-reservation-at-per-se.mdx`

Structure:
- Opening: link to `/restaurant/per-se`, Columbus Circle / `/neighborhood/columbus-circle` or Lincoln Center
- ## The drop: monthly, Tock
- ## The conflict: same as EMP — name the conflict explicitly, link to EMP blog post
- ## Tock mechanics: prepaid, what that means
- Cross-link: EMP and Masa

- [ ] **Step 5: Write Joo Ok post**

Filename: `content/blog/how-to-get-a-reservation-at-joo-ok.mdx`

Structure:
- Opening: link to `/restaurant/joo-ok`, neighborhood
- ## The drop: midnight, monthly, Resy
- ## The conflict: monthly drop context, which restaurants to compare
- ## What to expect: Korean tasting menu context that informs the booking

- [ ] **Step 6: Write Masa post**

Filename: `content/blog/how-to-get-a-reservation-at-masa.mdx`

Structure:
- Opening: link to `/restaurant/masa`, `/neighborhood/columbus-circle` or Lincoln Center
- ## The drop: midnight, Tock, monthly
- ## The conflict: monthly drop competitors
- ## What to expect: price context, no walk-in, no shortcuts
- Cross-link: Per Se and EMP

- [ ] **Step 7: Verify no em dashes in any of the five posts**

```bash
grep -ln "—" \
  content/blog/how-to-get-a-reservation-at-le-bernardin.mdx \
  content/blog/how-to-get-a-reservation-at-eleven-madison-park.mdx \
  content/blog/how-to-get-a-reservation-at-per-se.mdx \
  content/blog/how-to-get-a-reservation-at-joo-ok.mdx \
  content/blog/how-to-get-a-reservation-at-masa.mdx
```

Expected: no output.

- [ ] **Step 8: Commit**

```bash
git add content/blog/how-to-get-a-reservation-at-le-bernardin.mdx \
  content/blog/how-to-get-a-reservation-at-eleven-madison-park.mdx \
  content/blog/how-to-get-a-reservation-at-per-se.mdx \
  content/blog/how-to-get-a-reservation-at-joo-ok.mdx \
  content/blog/how-to-get-a-reservation-at-masa.mdx
git commit -m "content: add how-to posts for Le Bernardin, EMP, Per Se, Joo Ok, Masa"
```

---

## Self-Review

**Spec coverage:**
- Track 1 (Reddit library): covered in Task 1 — 10 templates across restaurant-specific and general questions ✓
- Track 2 (Press — Who Gets the Table): covered in Task 2 — three outlet pitches + author bio ✓
- Track 2 (Press — Reservation Economy): covered in Task 3 — ending rewrite + newsletter pitch ✓
- Track 3 (Content — next 5 posts): covered in Task 4 with DB verification step ✓
- Execution order from spec (Reddit → Press → Content): plan follows this order ✓
- Concierge outreach excluded: correct per spec ✓

**Placeholder scan:**
- Task 4 Step 2-6: post content is not written inline — correct, because the actual content depends on DB verification in Step 1. The mechanics known at planning time are documented. ✓
- Pitch emails use `[editor name]` and `[name]` — these are intentional blanks for the user to fill, not TBD content. ✓
- No "implement later" or "add error handling" patterns found ✓

**Type consistency:** No shared interfaces across tasks — each track is independent. N/A.

**Gap check:** The spec mentions "Refresh Reddit set every 2-3 months as new posts go live" — this is operational guidance, not a task to implement now. Correct to omit from plan.
