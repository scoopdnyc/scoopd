/**
 * Single source of truth for next-drop-date logic.
 * Used by restaurant page, alerts page, alert digest cron.
 *
 * Logic: current ET. If before release_time, restaurant date is yesterday.
 * Next bookable = restaurant date + observed_days - 1.
 *
 * @param {{ release_time?: string|null, observed_days?: number|null, release_schedule?: string|null }} r
 * @param {Date} [now=new Date()]
 * @returns {{ display: string|null, dateET: Date|null, releaseHour: number, releaseMinute: number }}
 */
export function computeNextDropDate(r, now = new Date()) {
  if (!r.observed_days) {
    return { display: r.release_schedule || null, dateET: null, releaseHour: 0, releaseMinute: 0 }
  }

  const etTimeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const etHour   = parseInt(etTimeParts.find(p => p.type === 'hour').value, 10)
  const etMinute = parseInt(etTimeParts.find(p => p.type === 'minute').value, 10)

  let releaseHour = 0
  let releaseMinute = 0
  if (r.release_time) {
    const match = r.release_time.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
    if (match) {
      let h = parseInt(match[1], 10)
      const m = parseInt(match[2], 10)
      const meridiem = match[3].toUpperCase()
      if (meridiem === 'AM' && h === 12) h = 0
      else if (meridiem === 'PM' && h !== 12) h += 12
      releaseHour = h
      releaseMinute = m
    }
  }

  const etDateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const etYear  = parseInt(etDateParts.find(p => p.type === 'year').value, 10)
  const etMonth = parseInt(etDateParts.find(p => p.type === 'month').value, 10) - 1
  const etDay   = parseInt(etDateParts.find(p => p.type === 'day').value, 10)

  const restaurantDate = new Date(etYear, etMonth, etDay)
  if (etHour * 60 + etMinute < releaseHour * 60 + releaseMinute) {
    restaurantDate.setDate(restaurantDate.getDate() - 1)
  }
  restaurantDate.setDate(restaurantDate.getDate() + r.observed_days - 1)

  const formatted = restaurantDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const display = r.release_time ? `${formatted} at ${r.release_time} ET` : formatted

  return { display, dateET: restaurantDate, releaseHour, releaseMinute }
}
