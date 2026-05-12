'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function StripeSuccessEvent() {
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      window.gtag?.('event', 'subscribe')
    }
  }, [searchParams])
  return null
}
