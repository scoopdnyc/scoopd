import { unstable_cache } from 'next/cache'

async function fetchPlacePhoto(placeId) {
  const key = process.env.GOOGLE_PLACES_API_KEY
  console.log('[places] key present:', !!key, '| placeId:', placeId)
  if (!key || !placeId) return null

  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${key}`
  console.log('[places] fetching details:', detailsUrl.replace(key, 'REDACTED'))
  const detailsRes = await fetch(detailsUrl)
  const details = await detailsRes.json()
  const photos = details.result?.photos ?? []
  console.log('[places] photos count:', photos.length, '| status:', details.status)
  if (!photos.length) return null
  const best = photos.slice().sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]
  const photoRef = best.photo_reference
  console.log('[places] best photo ref:', photoRef ? photoRef.slice(0, 40) + '...' : 'null')
  if (!photoRef) return null

  const photoFetchUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=4800&photo_reference=${photoRef}&key=${key}`
  console.log('[places] fetching photo:', photoFetchUrl.replace(key, 'REDACTED'))
  const photoRes = await fetch(photoFetchUrl)
  console.log('[places] photo response — status:', photoRes.status, '| type:', photoRes.type, '| ok:', photoRes.ok, '| url:', photoRes.url)
  const finalUrl = photoRes.url
  if (!finalUrl || !finalUrl.includes('googleusercontent.com')) {
    console.log('[places] guard FAILED — finalUrl:', finalUrl)
    return null
  }
  console.log('[places] guard PASSED — returning:', finalUrl.replace(/-w\d+/, '-w1600').slice(0, 60) + '...')
  return finalUrl.replace(/-w\d+/, '-w1600')
}

export const getPlacePhoto = unstable_cache(
  fetchPlacePhoto,
  ['place-photo'],
  { revalidate: 3600 }
)
