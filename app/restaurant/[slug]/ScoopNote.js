export default function ScoopNote({ scoop }) {
  if (!scoop) return null
  return (
    <div style={{
      background: '#1a1a16',
      borderLeft: '2px solid #c9a96e',
      borderRadius: '8px',
      padding: '1.25rem',
    }}>
      <div className="rp-info-label">The Scoop</div>
      <div style={{
        fontFamily: 'var(--font-dm-sans), sans-serif',
        fontSize: '15px',
        color: '#e8e4dc',
        lineHeight: '1.8',
      }}>
        {scoop}
      </div>
    </div>
  )
}
