#!/usr/bin/env node
/**
 * Daily Reddit digest: fetch new posts from target subreddits,
 * filter by reservation/restaurant keywords, email matches via Resend.
 */

const RESEND_API_URL = 'https://api.resend.com/emails'
const NOTIFY_EMAIL = 'support@scoopd.nyc'

const SUBREDDITS = ['FoodNYC', 'AskNYC', 'finedining', 'nycfood', 'nyc']

const KEYWORDS = [
  'reservation', 'reservations', 'carbone', 'lilia', 'via carota', 'torrisi',
  'corner store', 'impossible', 'how do people get', 'resy', 'opentable',
  'hard to get', 'booked out', 'fully booked', 'waiting list', 'waitlist',
]

// Reddit /new.rss returns Atom XML with <entry> elements
function parseFeed(xml, sub) {
  const entries = []
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g
  let m
  while ((m = entryRe.exec(xml)) !== null) {
    const block = m[1]

    const titleM = block.match(/<title[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/)
    const title = (titleM ? (titleM[1] ?? titleM[2]) : '').trim()

    const idM = block.match(/<id>([^<]+)<\/id>/)
    const idRaw = idM ? idM[1].trim() : ''
    const id = idRaw.match(/(t3_\w+)/)?.[1] || idRaw

    // <link rel="alternate" href="..."/>
    const linkM = block.match(/<link[^>]+href="([^"]+)"/)
    const url = linkM ? linkM[1] : ''

    const updatedM = block.match(/<updated>([^<]+)<\/updated>/) || block.match(/<published>([^<]+)<\/published>/)
    const updated = updatedM ? updatedM[1].trim() : ''

    const contentM = block.match(/<content[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/content>/)
    const contentRaw = contentM ? (contentM[1] ?? contentM[2] ?? '') : ''
    const content = contentRaw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

    entries.push({ id, title, url, updated, content, subreddit: sub })
  }
  return entries
}

function matchesKeywords(entry) {
  const text = `${entry.title} ${entry.content}`.toLowerCase()
  return KEYWORDS.some(kw => text.includes(kw))
}

function isRecent(entry) {
  if (!entry.updated) return true
  return Date.now() - new Date(entry.updated).getTime() < 24 * 60 * 60 * 1000
}

async function fetchSubreddit(sub) {
  const url = `https://www.reddit.com/r/${sub}/new.rss?limit=50`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'scoopd-digest/1.0' } })
    if (!res.ok) {
      console.error(`[reddit-digest] ${sub} HTTP ${res.status}`)
      return []
    }
    return parseFeed(await res.text(), sub)
  } catch (err) {
    console.error(`[reddit-digest] ${sub} error: ${err.message}`)
    return []
  }
}

async function sendEmail(apiKey, matches) {
  const lines = matches.map(m =>
    `r/${m.subreddit}: ${m.title}\n${m.url}\n${m.content.slice(0, 200)}`
  ).join('\n\n')

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'noreply@scoopd.nyc',
      to: NOTIFY_EMAIL,
      subject: `Scoopd Reddit digest — ${matches.length} post${matches.length === 1 ? '' : 's'}`,
      text: `Reddit posts matching Scoopd keywords in the last 24 hours:\n\n${lines}`,
    }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[reddit-digest] RESEND_API_KEY not set')
    process.exit(1)
  }

  const seen = new Set()
  const matches = []

  for (const sub of SUBREDDITS) {
    const entries = await fetchSubreddit(sub)
    for (const entry of entries) {
      if (seen.has(entry.id)) continue
      seen.add(entry.id)
      if (!isRecent(entry)) continue
      if (matchesKeywords(entry)) matches.push(entry)
    }
  }

  console.log(`[reddit-digest] ${matches.length} matching posts across ${SUBREDDITS.length} subreddits`)

  if (matches.length === 0) {
    console.log('[reddit-digest] no matches, skipping email')
    return
  }

  try {
    await sendEmail(apiKey, matches)
    console.log(`[reddit-digest] email sent, ${matches.length} matches`)
  } catch (err) {
    console.error('[reddit-digest] send failed:', err.message)
    process.exit(1)
  }
}

main()
