import ScoopNav from '../../components/ScoopNav'
import ScoopFooter from '../../components/ScoopFooter'

export const metadata = {
  title: 'How Reservations Actually Work at Corner Store, The Eighty Six, and Or\'Esh | Scoopd',
  robots: { index: false },
}

export default function HowCatchHospitalityReservationsWork() {
  return (
    <main style={{ background: '#0f0f0d', minHeight: '100vh', color: '#e8e4dc', fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <ScoopNav />
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 2rem' }}>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: '36px', lineHeight: 1.15, color: '#e8e4dc', marginBottom: '1.5rem' }}>
          How Reservations Actually Work at Corner Store, The Eighty Six, and Or'Esh
        </h1>
        <p style={{ fontSize: '16px', color: '#ababa3', lineHeight: 1.85 }}>
          This guide is coming soon. Check back shortly.
        </p>
      </div>
      <ScoopFooter />
    </main>
  )
}
