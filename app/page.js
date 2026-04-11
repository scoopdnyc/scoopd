import { createSupabaseServer } from '../lib/supabase-server'
import RestaurantList from './RestaurantList'
import Link from 'next/link'
import ScoopNav from './components/ScoopNav'
import ScoopFooter from './components/ScoopFooter'
import './home.css'

const DIFFICULTY_ORDER = { 'Extremely Hard': 0, 'Very Hard': 1, 'Hard': 2, 'Medium': 3, 'Easy': 4 }
const DEMAND_ORDER = { 'Very High': 0, 'High': 1, 'Medium': 2, 'Low': 3 }

async function getRestaurants(client) {
  const { data, error } = await client
    .from('restaurants')
    .select('id, restaurant, neighborhood, platform, cuisine, release_time, observed_days, release_schedule, difficulty, notify_demand, beli_score, slug')
  if (error) console.error(error)
  return (data || []).sort((a, b) => {
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
}

export default async function Home() {
  const serverSupabase = await createSupabaseServer()
  const restaurants = await getRestaurants(serverSupabase)

  return (
    <main style={{background:'#0f0f0d',minHeight:'100vh',color:'#e8e4dc',fontFamily:"'DM Sans', sans-serif",padding:'0'}}>
      <ScoopNav />
      <div className="hero">
        <div className="eyebrow">NYC Reservation Intelligence</div>
        <h1 className="headline">Know when<br />tables drop.</h1>
        <p className="sub">The exact moment reservations open at NYC's hardest tables. No bots. No brokers. Just intelligence.*</p>
      </div>
      <RestaurantList restaurants={restaurants} />
      <ScoopFooter />
    </main>
  )
}