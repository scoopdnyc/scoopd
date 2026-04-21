---
name: scoopd:write-note
description: Write or update a restaurant notes field on Scoopd. Triggers when asked to write, rewrite, update, or improve any restaurant description or notes field.
---

# Write Restaurant Note

You are writing the `notes` field for a Scoopd restaurant record. This is the public-facing
editorial description displayed on the restaurant's page and used as the SEO meta description.

## Hard Stops — Check Before Writing Anything

**Step 1: Do-not-touch check.**

If the restaurant is ANY of the following, STOP immediately. Do not write, do not suggest
edits, do not continue. Tell the user: "This restaurant is on the do-not-touch list.
Notes cannot be modified without an explicit override instruction."

Do-not-touch list:
4 Charles Prime Rib, Bemelmans Bar, Bistrot Ha, Carbone, Cote, Double Chicken Please,
Eleven Madison Park, Ha's Snack Bar, Jeju Noodle Bar, Joo Ok, Lilia, Minetta Tavern,
Tatiana, Theodora, Torrisi, Via Carota

**Step 2: Source check.**

Confirm at least 3 sources have been provided (Michelin, restaurant website, press coverage
such as Eater, NYT, New Yorker). If fewer than 3 sources are present, ask:
"Please provide at least 3 sources before I write this note."

## Voice Rules

- Specific and insider. Name the chef, the dish, the detail that matters to a serious diner.
- No marketing language: never use "beloved", "acclaimed", "vibrant", "celebrated", "iconic",
  "hidden gem", "must-visit", "culinary journey", or similar generic adjectives.
- No em-dashes (—). Use a period, colon, or restructure the sentence.
- Do not include booking intelligence (release time, days out, platform) — that data is
  displayed separately from the DB.
- Do not fabricate any detail. Do not copy text from sources. Rewrite from scratch.
- Target: 1-3 sentences. Under 155 characters is ideal (fits SEO meta description).

## Steps

1. Read the existing notes field for this restaurant if it exists.
2. Confirm not on do-not-touch list.
3. Confirm 3 sources provided.
4. Draft the note from scratch in Scoopd voice.
5. Self-check the draft:
   - Does it contain an em-dash? Fix it.
   - Does it contain any generic adjective ("beloved", "acclaimed", etc.)? Replace it.
   - Does it mention a reservation platform, release time, or days out? Remove it.
   - Is it under 155 characters? If not, tighten it.
6. Present the draft to the user in the output format below.
7. Wait for explicit approval. Do not write to the DB.
8. After approval: provide the exact SQL or confirm you will write via the admin route.

## Output Format

```
DRAFT NOTE — [Restaurant Name]
─────────────────────────────
[Draft text here]
─────────────────────────────
Characters: XX | Em-dashes: 0 | Generic adjectives: none
Sources used: [list the 3+ sources]

Awaiting your approval before writing to DB.
```

## After Approval

Write the note using the admin API route or provide the exact Supabase SQL:

```sql
UPDATE restaurants SET notes = '[approved text]' WHERE slug = '[slug]';
```
