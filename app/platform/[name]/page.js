import { notFound } from 'next/navigation'
import { createSupabaseStatic } from '../../../lib/supabase-static'
import { slugify, PLATFORM_MAP } from '../../../lib/slugify'
import RestaurantList from '../../RestaurantList'
import ScoopNav from '../../components/ScoopNav'
import ScoopFooter from '../../components/ScoopFooter'

export const revalidate = 3600

const DIFFICULTY_ORDER = { 'Extremely Hard': 0, 'Very Hard': 1, 'Hard': 2, 'Medium': 3, 'Easy': 4 }
const DEMAND_ORDER = { 'Very High': 0, 'High': 1, 'Medium': 2, 'Low': 3 }

export async function generateMetadata({ params }) {
  const { name } = await params
  const platform = PLATFORM_MAP[name]
  if (!platform) return {}
  return {
    title: `${platform} NYC Restaurants — Reservation Drop Times | Scoopd`,
    description: `Drop times and booking intel for NYC restaurants on ${platform}. Know exactly when reservations open.`,
    alternates: { canonical: `https://scoopd.nyc/platform/${name}` },
    openGraph: {
      title: `${platform} NYC Restaurants — Reservation Drop Times | Scoopd`,
      description: `Drop times and booking intel for NYC restaurants on ${platform}.`,
      url: `https://scoopd.nyc/platform/${name}`,
      siteName: 'Scoopd',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${platform} NYC Restaurants — Reservation Drop Times | Scoopd`,
      description: `Drop times and booking intel for NYC restaurants on ${platform}.`,
    },
  }
}

export default async function PlatformPage({ params }) {
  const { name } = await params
  const platform = PLATFORM_MAP[name]
  if (!platform) notFound()

  const supabase = createSupabaseStatic()
  const { data } = await supabase
    .from('restaurants')
    .select('id, restaurant, neighborhood, platform, cuisine, release_time, observed_days, release_schedule, difficulty, notify_demand, beli_score, slug')
    .eq('platform', platform)

  if (!data || data.length === 0) notFound()

  const restaurants = data.sort((a, b) => {
    const diffA = DIFFICULTY_ORDER[a.difficulty] ?? 99
    const diffB = DIFFICULTY_ORDER[b.difficulty] ?? 99
    if (diffA !== diffB) return diffA - diffB
    const demandA = DEMAND_ORDER[a.notify_demand] ?? 99
    const demandB = DEMAND_ORDER[b.notify_demand] ?? 99
    if (demandA !== demandB) return demandA - demandB
    const beliA = parseFloat(a.beli_score) || 0
    const beliB = parseFloat(b.beli_score) || 0
    return beliB - beliA
  })

  return (
    <main style={{ background: '#0f0f0d', minHeight: '100vh', color: '#e8e4dc', fontFamily: "var(--font-dm-sans), sans-serif", padding: '0' }}>
      <ScoopNav />
      <div style={{ padding: '3rem 2rem 1rem' }}>
        <p style={{ color: '#8a8a80', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Platform</p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: '#e8e4dc', margin: 0 }}>{platform}</h1>
      </div>
      <RestaurantList restaurants={restaurants} />
      <ScoopFooter />
    </main>
  )
}
