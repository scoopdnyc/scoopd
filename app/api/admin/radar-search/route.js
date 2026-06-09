import { cookies } from 'next/headers'

function getCdataOrText(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = block.match(re)
  if (!m) return ''
  const inner = m[1].trim()
  const cdata = inner.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/)
  return (cdata ? cdata[1] : inner).trim()
}

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function subredditFromUrl(url) {
  const m = url.match(/reddit\.com\/r\/([^/?#]+)/)
  return m ? m[1] : ''
}

function parseRss(xml) {
  const items = []
  const itemRe = /<item>([\s\S]*?)<\/item>/g
  let m
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1]
    const title = getCdataOrText(block, 'title')
    const link = getCdataOrText(block, 'link')
    const pubDate = getCdataOrText(block, 'pubDate')
    const description = getCdataOrText(block, 'description')
    const category = getCdataOrText(block, 'category')
    const subreddit = subredditFromUrl(link) || category.replace(/^r\//, '')
    items.push({
      title,
      url: link,
      subreddit,
      created_utc: pubDate ? new Date(pubDate).toISOString() : '',
      selftext: stripHtml(description).slice(0, 400),
    })
  }
  return items
}

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
        ? `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/search.rss`
        : 'https://www.reddit.com/search.rss'
      const params = new URLSearchParams({ q, sort, t: 'month', limit: '15' })
      if (subreddit) params.set('restrict_sr', '1')
      upstreamUrl = `${base}?${params}`
    } else if (source === 'hn') {
      const params = new URLSearchParams({ query: q, tags: 'comment,story', hitsPerPage: '15' })
      upstreamUrl = `https://hn.algolia.com/api/v1/search?${params}`
    } else {
      return Response.json({ error: 'Invalid source' }, { status: 400 })
    }

    console.log('[radar-search] url:', upstreamUrl)
    const upstream = await fetch(upstreamUrl, {
      headers: { 'User-Agent': 'scoopd-radar/1.0' },
    })
    console.log('[radar-search] status:', upstream.status)
    if (!upstream.ok) {
      const text = await upstream.text()
      console.error('[radar-search] error body:', text.slice(0, 300))
      return Response.json({ error: `Upstream ${upstream.status}` }, { status: 502 })
    }

    if (source === 'reddit') {
      const xml = await upstream.text()
      console.log('[radar-search] rss length:', xml.length, 'items tag count:', (xml.match(/<item>/g) || []).length)
      const items = parseRss(xml)
      console.log('[radar-search] parsed items:', items.length)
      return Response.json({ items })
    } else {
      const data = await upstream.json()
      return Response.json(data)
    }
  } catch (err) {
    console.error('[radar-search] error:', err.name, err.message, 'url:', upstreamUrl)
    return Response.json({ error: err.message, name: err.name }, { status: 502 })
  }
}
