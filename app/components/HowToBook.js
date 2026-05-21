import Link from 'next/link'
import './HowToBook.css'

export default function HowToBook({ data, restaurantName }) {
  if (!data) return null
  const { stats, cards, blog_slug } = data
  return (
    <div className="htb-wrap">
      <div className="htb-label">The Scoop</div>
      {stats?.length > 0 && (
        <div className="htb-stats">
          {stats.map((s, i) => (
            <div key={i} className="htb-stat">
              <div className="htb-stat-value">{s.value}</div>
              <div className="htb-stat-unit">{s.label}</div>
            </div>
          ))}
        </div>
      )}
      {cards?.length > 0 && (
        <div className="htb-cards">
          {cards.map((c, i) => (
            <div key={i} className="htb-card">
              <div className="htb-card-label">{c.label}</div>
              <p className="htb-card-text" dangerouslySetInnerHTML={{ __html: c.text }} />
            </div>
          ))}
        </div>
      )}
      {blog_slug && (
        <div className="htb-footer">
          <Link href={`/blog/${blog_slug}`} className="htb-link">
            Read the full {restaurantName} booking guide →
          </Link>
        </div>
      )}
    </div>
  )
}
