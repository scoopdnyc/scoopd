export const runtime = 'nodejs'

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

  if (!parsed.hostname.endsWith('.googleusercontent.com')) {
    return new Response('Forbidden', { status: 403 })
  }

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      console.error('[photo-proxy] upstream error:', res.status, url)
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
    console.error('[photo-proxy] fetch failed:', err?.message, url)
    return new Response('Upstream fetch failed', { status: 502 })
  }
}
