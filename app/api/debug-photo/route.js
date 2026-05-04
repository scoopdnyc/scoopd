const OVERSTORY_PLACE_ID = 'ChIJ_8dmJ0lbwokRIJHQFfXiMNo'

async function fetchPlacePhotoDirect(placeId) {
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

  const photoRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=4800&photo_reference=${photoRef}&key=${key}`
  )
  const finalUrl = photoRes.url
  if (!finalUrl || !finalUrl.includes('googleusercontent.com')) return null
  return finalUrl.replace(/-w\d+/, '-w1600')
}

export async function GET() {
  const keyPresent = !!process.env.GOOGLE_PLACES_API_KEY
  const photoUrl = await fetchPlacePhotoDirect(OVERSTORY_PLACE_ID)
  return Response.json({ keyPresent, photoUrl })
}
