'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { label: 'The Drop', desc: "What's releasing today", href: '/drops' },
  { label: 'The Date', desc: 'Plan by a target date', href: '/plan' },
  { label: 'The Dish', desc: 'Alerts before they drop', href: '/alerts' },
]

export default function ScoopDropdown({ open, setOpen, containerRef }) {
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname, setOpen])

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, setOpen, containerRef])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <style>{`
        .sc-hamburger {
          display: flex;
          flex-direction: column;
          gap: 3.5px;
          width: 14px;
          flex-shrink: 0;
        }
        .sc-line {
          width: 14px;
          height: 2px;
          background: #0f0f0d;
          border-radius: 1px;
          transition: transform 0.2s ease, opacity 0.2s ease;
          transform-origin: center;
        }
        .sc-open .sc-line:nth-child(1) { transform: translateY(5.5px) rotate(45deg); }
        .sc-open .sc-line:nth-child(2) { opacity: 0; }
        .sc-open .sc-line:nth-child(3) { transform: translateY(-5.5px) rotate(-45deg); }
      `}</style>

      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: '#c9a96e',
          color: '#0f0f0d',
          border: 'none',
          borderRadius: '20px',
          padding: '0.55rem 1.1rem',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap',
        }}
      >
        The Scoop
        <span className={`sc-hamburger${open ? ' sc-open' : ''}`}>
          <span className="sc-line" />
          <span className="sc-line" />
          <span className="sc-line" />
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          background: '#1a1a16',
          border: '0.5px solid #c9a96e',
          borderRadius: '10px',
          padding: '0.5rem',
          minWidth: '220px',
          zIndex: 100,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '7px',
                textDecoration: 'none',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#232320'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '14px',
                color: '#c9a96e',
                lineHeight: 1.2,
              }}>{item.label}</span>
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px',
                color: '#8a8a80',
                lineHeight: 1.3,
              }}>{item.desc}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
