export const runtime = 'nodejs'

async function fetchFreshPhotoUrl(placeId) {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return null

  const detailsRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${key}`,
    { cache: 'no-store' }
  )
  const details = await detailsRes.json()
  const photos = details.result?.photos ?? []
  if (!photos.length) return null

  const best = photos.slice().sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]
  const photoRef = best?.photo_reference
  if (!photoRef) return null

  const photoRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=4800&photo_reference=${photoRef}&key=${key}`,
    { cache: 'no-store', redirect: 'follow' }
  )
  const finalUrl = photoRes.url
  return finalUrl?.includes('googleusercontent.com') ? finalUrl : null
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get('place_id')
  const rawUrl  = searchParams.get('url')

  let photoUrl = null

  if (placeId) {
    try {
      photoUrl = await fetchFreshPhotoUrl(placeId)
    } catch (err) {
      console.error('[photo-proxy] places api error:', err?.message, placeId)
      return new Response('Places API error', { status: 502 })
    }
    if (!photoUrl) return new Response('No photo found', { status: 404 })
  } else if (rawUrl) {
    let parsed
    try { parsed = new URL(rawUrl) } catch { return new Response('Invalid url', { status: 400 }) }
    if (!parsed.hostname.endsWith('.googleusercontent.com')) return new Response('Forbidden', { status: 403 })
    photoUrl = rawUrl
  } else {
    return new Response('Missing place_id or url', { status: 400 })
  }

  try {
    const res = await fetch(photoUrl, { cache: 'no-store' })
    if (!res.ok) {
      console.error('[photo-proxy] upstream error:', res.status, photoUrl)
      return new Response('Upstream error', { status: 502 })
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buffer = await res.arrayBuffer()
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
      },
    })
  } catch (err) {
    console.error('[photo-proxy] fetch failed:', err?.message, photoUrl)
    return new Response('Upstream fetch failed', { status: 502 })
  }
}
