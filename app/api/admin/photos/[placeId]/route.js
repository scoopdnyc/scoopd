function isAdminAuthed(request) {
  const cookieHeader = request.headers.get('cookie') || ''
  return cookieHeader.split(';').some(c => c.trim() === 'admin_auth=1')
}

export async function GET(request, { params }) {
  if (!isAdminAuthed(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { placeId } = await params
  const key = process.env.GOOGLE_PLACES_API_KEY

  if (!key) return Response.json({ error: 'Missing API key' }, { status: 500 })

  try {
    const detailsRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${key}`
    )
    const details = await detailsRes.json()
    const rawPhotos = details.result?.photos ?? []

    const photos = await Promise.all(
      rawPhotos.map(async (p) => {
        const photoRes = await fetch(
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=4800&photo_reference=${p.photo_reference}&key=${key}`,
          { redirect: 'manual' }
        )
        const location = photoRes.headers.get('location')
        if (!location) return null
        return {
          photoReference: p.photo_reference,
          width: p.width,
          height: p.height,
          storedUrl: location.replace(/-w\d+/, '-w1600'),
          thumbnailUrl: location.replace(/-w\d+/, '-w400'),
        }
      })
    )

    return Response.json({ photos: photos.filter(Boolean) })
  } catch {
    return Response.json({ error: 'Failed to fetch photos' }, { status: 500 })
  }
}
