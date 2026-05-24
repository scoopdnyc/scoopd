import ScoopNav from '../components/ScoopNav'
import ScoopFooter from '../components/ScoopFooter'
import './about.css'

export const dynamic = 'force-static'

export const metadata = {
  title: 'About Scoopd',
  description: "Scoopd is a reservation intelligence platform for NYC's most competitive restaurants. Every drop time is observed directly from the reservation systems restaurants use.",
  alternates: { canonical: 'https://scoopd.nyc/about' },
  openGraph: {
    title: 'About Scoopd',
    description: "Scoopd is a reservation intelligence platform for NYC's most competitive restaurants. Every drop time is observed directly from the reservation systems restaurants use.",
    url: 'https://scoopd.nyc/about',
    siteName: 'Scoopd',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Scoopd',
    description: "Scoopd is a reservation intelligence platform for NYC's most competitive restaurants. Every drop time is observed directly from the reservation systems restaurants use.",
  },
}

const aboutPageLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About Scoopd',
  description: "Scoopd is a reservation intelligence platform for NYC's most competitive restaurants.",
  url: 'https://scoopd.nyc/about',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Scoopd',
    url: 'https://scoopd.nyc',
  },
}

export default function AboutPage() {
  return (
    <main style={{ background: '#0f0f0d', minHeight: '100vh', color: '#e8e4dc', fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageLd) }} />
      <ScoopNav />
      <div className="ab-hero">
        <div className="ab-eyebrow">About</div>
        <h1 className="ab-headline">Scoopd</h1>
      </div>
      <div className="ab-content">
        <div className="ab-section">
          <div className="ab-body">
            <p>Scoopd is a reservation intelligence platform for New York City&apos;s most competitive restaurants. It exists because the information needed to book these tables is scattered, unreliable, or paywalled behind services that don&apos;t verify what they publish.</p>
            <p>Every drop time, booking window, and platform on Scoopd is observed directly. Not sourced from press coverage, not scraped from other guides, not inferred from what a restaurant claims on its website. The data comes from monitoring the actual reservation systems these restaurants use, cross-referenced against real booking behavior over time.</p>
            <p>The goal is simple: if you know when and where reservations drop, you have a real chance at the table. Most people don&apos;t know. Scoopd exists to close that gap.</p>
          </div>
        </div>
        <div className="ab-section">
          <h2 className="ab-section-title">How the data works</h2>
          <div className="ab-body">
            <p>Scoopd tracks restaurants across Resy, OpenTable, SevenRooms, and DoorDash. Drop times and booking windows are verified against observed availability, not platform or restaurant claims. When something changes, the monitors catch it.</p>
            <p>Some restaurants don&apos;t follow a predictable pattern. Those are marked accordingly. The data reflects what is actually true, including when the honest answer is that there is no reliable window to report.</p>
          </div>
        </div>
        <div className="ab-section">
          <h2 className="ab-section-title">What Scoopd is not</h2>
          <div className="ab-body">
            <p>Scoopd does not sell reservations. It does not use bots or automation to hold or resell tables. It does not scrape other guides and republish their data. The New York Restaurant Reservation Anti-Piracy Act makes reservation resale illegal in New York State. Scoopd&apos;s purpose is the opposite: to make the public booking system more navigable for the people it was designed to serve.</p>
          </div>
        </div>
      </div>
      <ScoopFooter />
    </main>
  )
}
