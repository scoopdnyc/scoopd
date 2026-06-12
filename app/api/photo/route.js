export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) return new Response('Missing url', { status: 400 })

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return new Response('Invalid url', { status: 400 })
  }

  // Only proxy googleusercontent.com — block SSRF to internal/arbitrary hosts
  if (!parsed.hostname.endsWith('.googleusercontent.com')) {
    return new Response('Forbidden', { status: 403 })
  }

  let res
  try {
    res = await fetch(url)
  } catch {
    return new Response('Upstream fetch failed', { status: 502 })
  }

  if (!res.ok) return new Response('Upstream error', { status: 502 })

  const contentType = res.headers.get('content-type') || 'image/jpeg'

  return new Response(res.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
    },
  })
}
