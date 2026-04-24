# SevenRooms Rolling Check Redesign

**Date:** 2026-04-23
**Status:** Approved

## Problem

The `checkRolling` function in `lib/monitors/sevenrooms.js` uses the
`/api-yoa/availability/ng/widget/dates` endpoint to find all bookable dates
in a rolling window. This endpoint now returns 404 for all venues. The
`/range` endpoint (which still works) rejects `num_days > 1` with a 400 error.

## Goal

Detect when a rolling restaurant's booking window has drifted from its stored
`observed_days` value, using at most 2 API requests per restaurant.

## Approach

Two targeted boundary probes against `/range?num_days=1`:

| Probe | Date | Expected result | Flag if |
|---|---|---|---|
| Expected end | `today + (observed_days - 1)` | slots > 0 | slots === 0 |
| Beyond end | `today + (observed_days + 3)` | slots === 0 | slots > 0 |

**Slot detection:** any slot returned (any `type`) means the date is inside the
booking window. SevenRooms returns `type: "request"` slots on sold-out days
within the window, so zero slots reliably indicates a date outside the window.

## Flag Messages

- Window shrank or closed: `field: "observed_days"`, `observed: "no_slots_at_expected_end"`
- Window expanded: `field: "observed_days"`, `observed: "slots_found_beyond_window"`

## Edge Cases

- `observed_days` is null: return `[]`, skip check
- Either fetch returns non-200: log error, return `[]` (no false positives)

## Scope

Only `checkRolling` changes. `checkLongCalendar`, `checkHybrid`, `srFetch`,
`extractSlots`, the inngest runner, and the digest email are all untouched.
Return shape `{ field, stored, observed }` is unchanged.

## Files

- `lib/monitors/sevenrooms.js` — replace `checkRolling` body only
