import { createSupabaseServer } from '../../lib/supabase-server'
import FoundingClient from './FoundingClient'
import './founding.css'

export const metadata = {
  title: 'Founding Member | Scoopd',
  robots: { index: false, follow: false },
}

export default async function FoundingPage() {
  const serverSupabase = await createSupabaseServer()
  const { data: { user } } = await serverSupabase.auth.getUser()
  return <FoundingClient isLoggedIn={!!user} />
}
