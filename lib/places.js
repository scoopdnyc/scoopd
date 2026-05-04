import { unstable_cache } from 'next/cache'

async function fetchPlacePhoto(placeId) {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key || !placeId) return null

  const detailsRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${key}`
  )
  const details = await detailsRes.json()
  const photos = details.result?.photos ?? []
  if (!photos.length) return null
  const best = photos.slice().sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]
  const photoRef = best.photo_reference
  if (!photoRef) return null

  const photoFetchUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=4800&photo_reference=${photoRef}&key=${key}`
  console.log('[places] fetching photo URL:', photoFetchUrl.replace(key, 'REDACTED'))
  const photoRes = await fetch(photoFetchUrl)
  console.log('[places] response status:', photoRes.status, 'type:', photoRes.type, 'url:', photoRes.url)
  const finalUrl = photoRes.url
  if (!finalUrl || !finalUrl.includes('googleusercontent.com')) {
    console.log('[places] guard failed — finalUrl:', finalUrl)
    return null
  }
  return finalUrl.replace(/-w\d+/, '-w1600')
}

export const getPlacePhoto = unstable_cache(
  fetchPlacePhoto,
  ['place-photo'],
  { revalidate: 3600 }
)
