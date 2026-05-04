import { createSupabaseServer } from '../../../lib/supabase-server'
import PhotoPicker from './PhotoPicker'
import './photos.css'

export const dynamic = 'force-dynamic'

export default async function AdminPhotosPage() {
  const supabase = await createSupabaseServer()
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, restaurant, slug, google_place_id, photo_override_url, photo_height')
    .order('restaurant')

  return <PhotoPicker restaurants={restaurants ?? []} />
}
