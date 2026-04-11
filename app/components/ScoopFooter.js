import Link from 'next/link'

export default function ScoopFooter() {
  return (
    <footer style={{ background: '#0f0f0d', borderTop: '0.5px solid #2a2a26', padding: '1.25rem 2rem', textAlign: 'center' }}>
      <style>{`
        .sf-line { display: flex; justify-content: center; align-items: center; gap: 0; flexWrap: wrap; }
        .sf-text { font-family: var(--font-dm-sans), sans-serif; font-size: 12px; color: #8a8a80; }
        .sf-sep { font-family: var(--font-dm-sans), sans-serif; font-size: 12px; color: #2a2a26; margin: 0 0.6rem; }
        .sf-link { font-family: var(--font-dm-sans), sans-serif; font-size: 12px; color: #8a8a80; text-decoration: none; }
        .sf-link:hover { color: #c9a96e; }
      `}</style>
      <div className="sf-line">
        <span className="sf-text">© 2026 Scoopd</span>
        <span className="sf-sep">·</span>
        <Link href="/terms" className="sf-link">Terms of Service</Link>
        <span className="sf-sep">·</span>
        <Link href="/privacy" className="sf-link">Privacy Policy</Link>
      </div>
    </footer>
  )
}
