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
    if (source === 'hn') {
      const params = new URLSearchParams({ query: q, tags: 'comment,story', hitsPerPage: '15' })
      upstreamUrl = `https://hn.algolia.com/api/v1/search?${params}`
      const upstream = await fetch(upstreamUrl, { headers: { 'User-Agent': 'scoopd-radar/1.0' } })
      if (!upstream.ok) return Response.json({ error: `Upstream ${upstream.status}` }, { status: 502 })
      return Response.json(await upstream.json())
    }

    if (source !== 'reddit') {
      return Response.json({ error: 'Invalid source' }, { status: 400 })
    }

    // Reddit: try two URL formats, fall back to global
    const headers = { 'User-Agent': 'scoopd-radar/1.0' }
    const baseParams = new URLSearchParams({ sort, t: 'month', limit: '15' })

    async function tryReddit(label, url) {
      try {
        const r = await fetch(url, { headers })
        const xml = r.ok ? await r.text() : ''
        const count = (xml.match(/<item>/g) || []).length
        console.log(`[radar-search] ${label} status=${r.status} items=${count} url=${url}`)
        return { ok: r.ok, count, xml }
      } catch (e) {
        console.error(`[radar-search] ${label} fetch error:`, e.message)
        return { ok: false, count: 0, xml: '' }
      }
    }

    let xml = ''

    if (subreddit) {
      // Format 1: /r/sub1+sub2/search.rss?q=...&restrict_sr=1
      const p1 = new URLSearchParams(baseParams)
      p1.set('q', q)
      p1.set('restrict_sr', '1')
      const url1 = `https://www.reddit.com/r/${subreddit}/search.rss?${p1}`
      const r1 = await tryReddit('format1', url1)

      if (r1.count > 0) {
        xml = r1.xml
      } else {
        // Format 2: global search with subreddit: operators in query
        const subFilter = subreddit.split('+').map(s => `subreddit:${s}`).join(' OR ')
        const p2 = new URLSearchParams(baseParams)
        p2.set('q', `${q} (${subFilter})`)
        p2.set('restrict_sr', '0')
        const url2 = `https://www.reddit.com/search.rss?${p2}`
        const r2 = await tryReddit('format2', url2)

        if (r2.count > 0) {
          xml = r2.xml
        } else {
          // Fallback: global search, no subreddit filter
          const p3 = new URLSearchParams(baseParams)
          p3.set('q', q)
          const url3 = `https://www.reddit.com/search.rss?${p3}`
          const r3 = await tryReddit('fallback', url3)
          xml = r3.xml
        }
      }
    } else {
      const p = new URLSearchParams(baseParams)
      p.set('q', q)
      const url = `https://www.reddit.com/search.rss?${p}`
      const r = await tryReddit('global', url)
      xml = r.xml
    }

    const items = parseRss(xml)
    console.log('[radar-search] final items:', items.length)
    return Response.json({ items })
  } catch (err) {
    console.error('[radar-search] error:', err.name, err.message, 'url:', upstreamUrl)
    return Response.json({ error: err.message, name: err.name }, { status: 502 })
  }
}
