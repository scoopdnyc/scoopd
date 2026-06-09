import { cookies } from 'next/headers'

export async function GET(request) {
  const cookieStore = await cookies()
  if (cookieStore.get('admin_auth')?.value !== '1') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const source = searchParams.get('source')
  const q = searchParams.get('q') || ''
  const subreddit = searchParams.get('subreddit') || ''
  const sort = searchParams.get('sort') || 'new'

  let upstreamUrl = ''
  try {
    if (source === 'reddit') {
      const base = subreddit
        ? `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/search.json`
        : 'https://www.reddit.com/search.json'
      const params = new URLSearchParams({ q, sort, t: 'month', limit: '15' })
      if (subreddit) params.set('restrict_sr', 'on')
      upstreamUrl = `${base}?${params}`
    } else if (source === 'hn') {
      const params = new URLSearchParams({ query: q, tags: 'comment,story', hitsPerPage: '15' })
      upstreamUrl = `https://hn.algolia.com/api/v1/search?${params}`
    } else {
      return Response.json({ error: 'Invalid source' }, { status: 400 })
    }

    console.log('[radar-search] fetching', upstreamUrl)
    const upstream = await fetch(upstreamUrl, {
      headers: { 'User-Agent': 'scoopd-radar/1.0' },
    })
    console.log('[radar-search] upstream status', upstream.status)
    if (!upstream.ok) {
      const text = await upstream.text()
      console.error('[radar-search] upstream error body:', text.slice(0, 300))
      return Response.json({ error: `Upstream ${upstream.status}`, body: text.slice(0, 300) }, { status: 502 })
    }
    const data = await upstream.json()
    return Response.json(data)
  } catch (err) {
    console.error('[radar-search] caught:', err.name, err.message, 'url:', upstreamUrl)
    return Response.json({ error: err.message, name: err.name, url: upstreamUrl }, { status: 502 })
  }
}
