import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import RadarClient from './RadarClient'

export const dynamic = 'force-dynamic'

export default async function RadarPage() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('admin_auth')
  if (auth?.value !== '1') redirect('/admin')
  return <RadarClient />
}
