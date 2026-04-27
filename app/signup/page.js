import SignupClient from './SignupClient'

export const metadata = {
  title: 'Get Premium Access — Scoopd NYC Reservation Intelligence',
  description: 'Know the exact date every NYC reservation drops. $9.99/month or $60/year. Cancel anytime.',
  openGraph: {
    title: 'Get Premium Access — Scoopd NYC Reservation Intelligence',
    description: 'Know the exact date every NYC reservation drops. $9.99/month or $60/year. Cancel anytime.',
    url: 'https://scoopd.nyc/signup',
    siteName: 'Scoopd',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Get Premium Access — Scoopd NYC Reservation Intelligence',
    description: 'Know the exact date every NYC reservation drops. $9.99/month or $60/year. Cancel anytime.',
  },
  alternates: { canonical: 'https://scoopd.nyc/signup' },
  robots: { index: false, follow: false },
}

export default function SignupPage() {
  return <SignupClient />
}
