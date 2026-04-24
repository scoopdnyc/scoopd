// lib/monitors/sevenrooms.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// We test checkRolling behaviour by mocking global fetch.
// checkRolling is not exported — we test via checkSevenRoomsRestaurant with sevenrooms_type = 'rolling'.

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
    const originalFetch = global.fetch
    global.fetch = async () => { throw new Error('network error') }
    try {
      const result = await checkSevenRoomsRestaurant(baseRestaurant)
      assert.deepEqual(result, [])
    } finally {
      global.fetch = originalFetch
    }
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
