'use client'
import { useEffect } from 'react'

export default function DebugLog({ releaseTime, observedDays, serverDisplay }) {
  useEffect(() => {
    const now = new Date()

    const etTimeParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(now)
    const etHour   = parseInt(etTimeParts.find(p => p.type === 'hour').value, 10)
    const etMinute = parseInt(etTimeParts.find(p => p.type === 'minute').value, 10)

    const etDateParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now)
    const etYear  = parseInt(etDateParts.find(p => p.type === 'year').value, 10)
    const etMonth = parseInt(etDateParts.find(p => p.type === 'month').value, 10) - 1
    const etDay   = parseInt(etDateParts.find(p => p.type === 'day').value, 10)

    let releaseHour = 0, releaseMinute = 0
    if (releaseTime) {
      const match = releaseTime.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
      if (match) {
        let h = parseInt(match[1], 10)
        const m = parseInt(match[2], 10)
        const mer = match[3].toUpperCase()
        if (mer === 'AM' && h === 12) h = 0
        else if (mer === 'PM' && h !== 12) h += 12
        releaseHour = h
        releaseMinute = m
      }
    }

    const beforeRelease = (etHour * 60 + etMinute) < (releaseHour * 60 + releaseMinute)

    const restaurantDate = new Date(etYear, etMonth, etDay)
    if (beforeRelease) restaurantDate.setDate(restaurantDate.getDate() - 1)
    const restaurantDateStr = restaurantDate.toDateString()

    restaurantDate.setDate(restaurantDate.getDate() + observedDays - 1)
    const nextBookable = restaurantDate.toDateString()

    console.log('[DROP DATE DEBUG]', {
      release_time: releaseTime,
      observed_days: observedDays,
      current_ET: `${etHour}:${String(etMinute).padStart(2,'0')}`,
      release_parsed: `${releaseHour}:${String(releaseMinute).padStart(2,'0')}`,
      before_release: beforeRelease,
      restaurantDate: restaurantDateStr,
      nextBookable,
      serverDisplay,
    })
  }, [])

  return null
}
