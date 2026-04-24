# SevenRooms Rolling Check Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken `checkRolling` function (which used the now-404 `/dates` endpoint) with a 2-probe boundary check using `/range?num_days=1`.

**Architecture:** Two targeted `/range` fetches per restaurant — one at the expected last bookable day, one 3 days beyond. Any slot returned (any `type`) means the date is inside the window. Zero slots means outside. No change to caller, return shape, or other monitor functions.

**Tech Stack:** Node.js 24 built-in `node:test`, ESM modules, SevenRooms `/api-yoa/availability/ng/widget/range` endpoint.

---

### Task 1: Write the failing test

**Files:**
- Create: `lib/monitors/sevenrooms.test.js`

- [ ] **Step 1: Create the test file**

```js
// lib/monitors/sevenrooms.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// We test checkRolling behaviour by mocking global fetch.
// checkRolling is not exported — we test via checkSevenRoomsRestaurant with sevenrooms_type = 'rolling'.

let fetchCalls = []

function mockFetch(responses) {
  // responses: array of slot arrays, one per call in order
  let callIndex = 0
  global.fetch = async (url) => {
    const slots = responses[callIndex++] ?? []
    return {
      ok: true,
      status: 200,
      json: async () => ({ data: { availability: slots } }),
    }
  }
}

// Dynamically import after setting up mock so module picks up global.fetch at call time
const { checkSevenRoomsRestaurant } = await import('./sevenrooms.js')

const baseRestaurant = {
  slug: 'test-venue',
  restaurant: 'Test Venue',
  sevenrooms_slug: 'test-venue',
  sevenrooms_type: 'rolling',
  observed_days: 14,
}

describe('checkRolling', () => {
  it('returns [] when both probes are as expected (window intact)', async () => {
    // Probe 1 (expected end): slots present — window open
    // Probe 2 (beyond end): no slots — window has not expanded
    mockFetch([
      [{ type: 'book' }],  // day 13: slots present ✓
      [],                  // day 17: no slots ✓
    ])
    const result = await checkSevenRoomsRestaurant(baseRestaurant)
    assert.deepEqual(result, [])
  })

  it('flags no_slots_at_expected_end when window has shrunk', async () => {
    mockFetch([
      [],                  // day 13: no slots — window shrank ✗
      [],                  // day 17: no slots
    ])
    const result = await checkSevenRoomsRestaurant(baseRestaurant)
    assert.equal(result.length, 1)
    assert.equal(result[0].field, 'observed_days')
    assert.equal(result[0].observed, 'no_slots_at_expected_end')
    assert.equal(result[0].stored, '14')
  })

  it('flags slots_found_beyond_window when window has expanded', async () => {
    mockFetch([
      [{ type: 'book' }],  // day 13: slots present ✓
      [{ type: 'book' }],  // day 17: slots present — window expanded ✗
    ])
    const result = await checkSevenRoomsRestaurant(baseRestaurant)
    assert.equal(result.length, 1)
    assert.equal(result[0].field, 'observed_days')
    assert.equal(result[0].observed, 'slots_found_beyond_window')
    assert.equal(result[0].stored, '14')
  })

  it('returns [] when observed_days is null', async () => {
    mockFetch([])
    const result = await checkSevenRoomsRestaurant({ ...baseRestaurant, observed_days: null })
    assert.deepEqual(result, [])
  })

  it('returns [] on fetch error (no false positives)', async () => {
    global.fetch = async () => { throw new Error('network error') }
    const result = await checkSevenRoomsRestaurant(baseRestaurant)
    assert.deepEqual(result, [])
  })

  it('accepts request-type slots as proof window is open', async () => {
    // Sold-out days within window return type: 'request' — should still count
    mockFetch([
      [{ type: 'request' }],  // day 13: request slot = inside window ✓
      [],
    ])
    const result = await checkSevenRoomsRestaurant(baseRestaurant)
    assert.deepEqual(result, [])
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
node --test lib/monitors/sevenrooms.test.js
```

Expected: multiple failures — `checkRolling` still uses the old `/dates` logic.

---

### Task 2: Implement the new `checkRolling`

**Files:**
- Modify: `lib/monitors/sevenrooms.js` — replace `checkRolling` function body only

- [ ] **Step 1: Replace `checkRolling` in `lib/monitors/sevenrooms.js`**

Find and replace the entire `checkRolling` function (lines from `async function checkRolling` through its closing `}`). Replace with:

```js
async function checkRolling(restaurant) {
  const { sevenrooms_slug, observed_days, restaurant: name } = restaurant

  if (observed_days == null) return []

  // Probe 1: is the window still open at the expected last day?
  // observed_days = 14 means today+0 through today+13 are bookable; last day = today+13
  const expectedLastDate = offsetDate(observed_days - 1)
  // Probe 2: has the window expanded beyond the expected boundary?
  const beyondDate = offsetDate(observed_days + 3)

  let probe1Slots, probe2Slots

  try {
    const json1 = await srFetch(
      `${SR_BASE}/availability/ng/widget/range?venue=${sevenrooms_slug}&party_size=2&halo_size_interval=100&start_date=${expectedLastDate}&num_days=1&channel=SEVENROOMS_WIDGET&exclude_pdr=true`
    )
    probe1Slots = extractSlots(json1)
  } catch (err) {
    console.error(`[sr-monitor] ${name}: probe1 fetch failed — ${err.message}`)
    return []
  }

  if (probe1Slots.length === 0) {
    return [{
      field: 'observed_days',
      stored: String(observed_days),
      observed: 'no_slots_at_expected_end',
    }]
  }

  try {
    const json2 = await srFetch(
      `${SR_BASE}/availability/ng/widget/range?venue=${sevenrooms_slug}&party_size=2&halo_size_interval=100&start_date=${beyondDate}&num_days=1&channel=SEVENROOMS_WIDGET&exclude_pdr=true`
    )
    probe2Slots = extractSlots(json2)
  } catch (err) {
    console.error(`[sr-monitor] ${name}: probe2 fetch failed — ${err.message}`)
    return []
  }

  if (probe2Slots.length > 0) {
    return [{
      field: 'observed_days',
      stored: String(observed_days),
      observed: 'slots_found_beyond_window',
    }]
  }

  return []
}
```

- [ ] **Step 2: Run the tests**

```bash
node --test lib/monitors/sevenrooms.test.js
```

Expected: all 6 tests pass.

- [ ] **Step 3: Commit**

```bash
git add lib/monitors/sevenrooms.js lib/monitors/sevenrooms.test.js
git commit -m "fix(sr-monitor): rebuild rolling check using /range boundary probes

/dates endpoint returns 404 for all venues. Replace with two /range?num_days=1
probes: one at the expected last day, one 3 days beyond. Any slot (any type)
= date is inside window. 2 requests per restaurant instead of 14."
```

---

### Task 3: Dry-run verification against live API

- [ ] **Step 1: Run the dry-run script**

```bash
node --input-type=module << 'EOF'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '')
}

const { checkSevenRoomsRestaurant } = await import('./lib/monitors/sevenrooms.js')
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: restaurants } = await supabase
  .from('restaurants')
  .select('slug, restaurant, sevenrooms_slug, sevenrooms_type, observed_days')
  .eq('platform', 'DoorDash')
  .not('sevenrooms_slug', 'is', null)

console.log(`Checking ${restaurants.length} restaurants...`)
const col = (s, w) => String(s ?? '—').padEnd(w)
console.log(col('restaurant', 28) + col('sr_type', 15) + col('flagged', 9) + 'changes')
console.log('-'.repeat(80))

for (const r of restaurants) {
  const changes = await checkSevenRoomsRestaurant(r)
  const flagged = changes.filter(c => c.flagged !== false)
  const summary = flagged.map(c => `${c.field}:${c.observed}`).join(', ') || 'clean'
  console.log(col(r.restaurant, 28) + col(r.sevenrooms_type, 15) + col(flagged.length > 0 ? 'YES' : 'no', 9) + summary)
  await new Promise(res => setTimeout(res, 300))
}
EOF
```

Expected: 7 rolling restaurants show `clean` or a specific flag reason (not generic `no dates returned`). 5 long-calendar/hybrid restaurants unaffected.

- [ ] **Step 2: If any rolling restaurant shows unexpected flags, investigate manually**

Fetch the probe URLs directly for that restaurant:

```bash
# Replace SLUG, DATE1, DATE2 with actual values
curl -s "https://fp.sevenrooms.com/api-yoa/availability/ng/widget/range?venue=SLUG&party_size=2&halo_size_interval=100&start_date=DATE1&num_days=1&channel=SEVENROOMS_WIDGET&exclude_pdr=true" \
  -H 'Accept: application/json' -H 'Origin: https://www.sevenrooms.com' -H 'Referer: https://www.sevenrooms.com/' \
  | python3 -m json.tool | head -30
```
