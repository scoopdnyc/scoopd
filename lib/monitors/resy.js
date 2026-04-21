const RESY_API_KEY = 'VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5'
const RESY_VENUE_URL = 'https://api.resy.com/3/venue'

/**
 * Fetches the current venue data from the Resy API and compares it against
 * the values stored in the DB row. Returns an array of change objects for
 * any field that differs. Empty array means no discrepancies detected.
 *
 * @param {Object} restaurant - Row from the restaurants table
 * @param {string} restaurant.slug
 * @param {string} restaurant.restaurant
 * @param {string|null} restaurant.resy_venue_id
 * @param {string|null} restaurant.release_time  — e.g. "10:00 AM"
 * @param {number|null} restaurant.observed_days
 * @returns {Promise<Array<{field: string, stored: string, observed: string}>>}
 */
export async function checkResyRestaurant(restaurant) {
  const { slug, restaurant: name, resy_venue_id, release_time, observed_days } = restaurant

  // Use resy_venue_id slug if available, otherwise fall back to restaurant slug
  const resySlug = resy_venue_id || slug

  let venueData
  try {
    const res = await fetch(
      `${RESY_VENUE_URL}?url_slug=${encodeURIComponent(resySlug)}&location=new-york-ny`,
      {
        headers: {
          Authorization: `ResyAPI api_key="${RESY_API_KEY}"`,
          'Accept': 'application/json',
          'X-Resy-Auth-Token': '',
          'Origin': 'https://resy.com',
          'Referer': 'https://resy.com/',
        },
      }
    )

    if (res.status === 404) {
      // Venue not found on Resy — could mean slug changed or restaurant closed
      return [{ field: 'venue_reachable', stored: 'true', observed: 'false (404)' }]
    }

    if (!res.ok) {
      console.error(`[resy-monitor] ${name}: HTTP ${res.status}`)
      return []
    }

    venueData = await res.json()
  } catch (err) {
    console.error(`[resy-monitor] ${name}: fetch failed — ${err.message}`)
    return []
  }

  const changes = []

  // --- Booking window (observed_days) ---
  // Resy exposes advance booking limits under venue.reservations.advance
  const advance = venueData?.venue?.reservations?.advance
  if (advance?.maximum?.count != null && advance?.maximum?.type === 'day') {
    const resyDays = advance.maximum.count
    if (observed_days != null && resyDays !== observed_days) {
      changes.push({
        field: 'observed_days',
        stored: String(observed_days),
        observed: String(resyDays),
      })
    }
  }

  // --- Venue name drift (catches renames) ---
  const resyName = venueData?.venue?.name
  if (resyName && resyName.toLowerCase() !== name.toLowerCase()) {
    changes.push({
      field: 'restaurant_name',
      stored: name,
      observed: resyName,
    })
  }

  // release_time is not exposed by the Resy venue API — it is an internal
  // restaurant setting. Monitoring it requires observing actual slot availability,
  // which is handled separately by the scraper pipeline.

  return changes
}
