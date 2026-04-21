'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function NsiField({ value, valueClassName }) {
  const [open, setOpen] = useState(false)

  function handlePointerEnter(e) {
    if (e.pointerType === 'mouse') setOpen(true)
  }

  function handlePointerLeave(e) {
    if (e.pointerType === 'mouse') setOpen(false)
  }

  function handleClick() {
    setOpen(o => !o)
  }

  return (
    <div
      className="rp-nsi-wrapper"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <div
        className={`${valueClassName} rp-nsi-trigger`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpen(o => !o) }}
        aria-expanded={open}
      >
        {value}
        <svg
          className="rp-nsi-icon"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
          <line x1="12" y1="12" x2="12" y2="16" />
        </svg>
      </div>
      <div className={`rp-nsi-callout${open ? ' rp-nsi-callout-open' : ''}`}>
        This restaurant opens its booking window on a set schedule but has not released general availability inventory with an observable pattern. Read how booking actually works{' '}
        <Link href="/blog/how-catch-hospitality-reservations-work" className="rp-nsi-link">here</Link>.
      </div>
    </div>
  )
}
