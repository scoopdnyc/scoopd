'use client'

import { useEffect } from 'react'

export default function ReferralConversionTracker() {
  useEffect(() => {
    if (localStorage.getItem('ref_triggered')) return
    fetch('/api/referral/check', { method: 'POST', credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(() => localStorage.setItem('ref_triggered', '1'))
      .catch(() => {})
  }, [])

  return null
}
