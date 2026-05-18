export default function ScoopNote({ scoop }) {
  if (!scoop) return null

  const sentences = scoop.split(/(?<=\.)\s+(?=[A-Z])/).filter(Boolean)

  return (
    <div style={{
      background: '#1a1a17',
      border: '1px solid #2a2a26',
      borderRadius: '8px',
      padding: '20px 24px',
    }}>
      <div className="rp-info-label">The Scoop</div>
      {sentences.map((sentence, i) => (
        <div
          key={i}
          style={{
            paddingTop: i === 0 ? 0 : '10px',
            paddingBottom: i < sentences.length - 1 ? '10px' : 0,
            fontSize: '14px',
            color: '#e8e4dc',
            lineHeight: '1.6',
            borderBottom: i < sentences.length - 1 ? '1px solid #2a2a26' : 'none',
          }}
        >
          {sentence}
        </div>
      ))}
    </div>
  )
}
