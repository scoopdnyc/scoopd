'use client'
import { useEffect } from 'react'

export default function DebugLog({ data }) {
  useEffect(() => {
    console.log('[DROP DATE DEBUG]', data)
  }, [])
  return null
}
