'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import ScoopDropdown from './ScoopDropdown'
import ScoopSubBar from './ScoopSubBar'

const DROPDOWN_WIDTH = 220

export default function ScoopNav() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  // Initialize with estimates to avoid layout flash: pill ~130px wide, nav padding-right 2rem = 32px
  const [pillWidth, setPillWidth] = useState(130)
  const [pillRightOffset, setPillRightOffset] = useState(32)

  useEffect(() => {
    function measure() {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setPillWidth(rect.width)
      setPillRightOffset(window.innerWidth - rect.right)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 2rem',
        borderBottom: '0.5px solid #2a2a26',
        background: '#0f0f0d',
      }}>
        <Link href="/" style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '22px',
          color: '#e8e4dc',
          textDecoration: 'none',
        }}>Scoopd</Link>
        <ScoopDropdown open={open} setOpen={setOpen} containerRef={containerRef} />
      </div>
      <ScoopSubBar
        open={open}
        pillWidth={pillWidth}
        pillRightOffset={pillRightOffset}
        dropdownWidth={DROPDOWN_WIDTH}
      />
    </>
  )
}
