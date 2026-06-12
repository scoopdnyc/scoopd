'use client'

import { useState } from 'react'

export default function CopyButton({ value, className, style }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(value).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button onClick={copy} className={className} style={style}>
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  )
}
