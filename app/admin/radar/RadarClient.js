'use client'

import { useState } from 'react'
import './radar.css'

const REDDIT_KEYWORDS = [
  { label: 'nyc restaurant reservations', q: 'nyc restaurant reservations', sub: null },
  { label: 'impossible reservation NYC', q: 'impossible reservation NYC restaurant', sub: null },
  { label: 'how to get Carbone', q: 'how to get Carbone reservation', sub: null },
  { label: 'Resy tips tricks', q: 'Resy tips tricks reservations', sub: null },
  { label: 'r/FoodNYC reservations', q: 'reservation', sub: 'FoodNYC' },
  { label: 'r/nycFood reservations', q: 'reservation', sub: 'nycFood' },
  { label: 'r/AskNYC restaurant', q: 'restaurant reservation', sub: 'AskNYC' },
  { label: 'r/finedining NYC', q: 'NYC reservation', sub: 'finedining' },
  { label: 'OpenTable notify waitlist', q: 'OpenTable notify waitlist NYC', sub: null },
  { label: 'NYC dining tips', q: 'NYC dining tips reservations hard to get', sub: null },
]

const HN_KEYWORDS = [
  { label: 'restaurant reservation', q: 'restaurant reservation' },
  { label: 'NYC dining', q: 'NYC dining' },
  { label: 'reservation bot scalping', q: 'reservation bot scalping restaurant' },
  { label: 'Resy OpenTable', q: 'Resy OpenTable reservation' },
  { label: 'hard to book restaurant', q: 'hard to book restaurant' },
]

const X_SEARCHES = [
  { label: 'nyc restaurant reservations', url: 'https://twitter.com/search?q=nyc+restaurant+reservations&f=live' },
  { label: '"impossible to get" reservation nyc', url: 'https://twitter.com/search?q=%22impossible+to+get%22+reservation+nyc&f=live' },
  { label: 'carbone reservation', url: 'https://twitter.com/search?q=carbone+reservation&f=live' },
  { label: 'resy drop available', url: 'https://twitter.com/search?q=resy+drop+available+nyc&f=live' },
  { label: 'lilia reservation', url: 'https://twitter.com/search?q=lilia+reservation+nyc&f=live' },
]

const MANUAL_TARGETS = [
  { name: 'r/FoodNYC', url: 'https://reddit.com/r/FoodNYC/new', notes: '280k members, NYC food focused. Weekly threads.' },
  { name: 'r/nycFood', url: 'https://reddit.com/r/nycFood/new', notes: '180k members. Active reservation discussion.' },
  { name: 'r/AskNYC', url: 'https://reddit.com/r/AskNYC/new', notes: '600k members. Frequent "where to eat" threads.' },
  { name: 'r/newyorkcity', url: 'https://reddit.com/r/newyorkcity/new', notes: 'Broad NYC community.' },
  { name: 'r/finedining', url: 'https://reddit.com/r/finedining/new', notes: 'Fine dining enthusiasts globally, NYC content does well.' },
  { name: 'r/travel', url: 'https://reddit.com/r/travel/search?q=nyc+restaurant&sort=new', notes: 'Travelers asking about NYC dining.' },
  { name: 'Eater NY Tips', url: 'https://ny.eater.com/contact', notes: 'Tip line for Eater NY editors.' },
  { name: 'Grub Street', url: 'https://www.grubstreet.com', notes: 'NY Mag food vertical. Pitch to editors.' },
  { name: 'The Counter (Richardson)', url: 'https://thecounter.substack.com', notes: 'Food newsletter, industry focus.' },
  { name: 'Robert Sietsema (Substack)', url: 'https://sietsema.substack.com', notes: 'Former Eater NY critic. Active on Substack.' },
  { name: 'Tammie Teclemariam', url: 'https://tammie.substack.com', notes: 'NY food writer, Substack newsletter.' },
]

const TEMPLATES = [
  {
    id: 'reddit-general',
    label: 'Reddit: General reservation tips thread',
    text: `One thing that actually helps: the drop times are not random. Most competitive NYC restaurants release on a fixed schedule. Carbone and Via Carota open at 9 AM on Resy, 28 days out. Lilia opens at 8 AM on the 1st of each month on Resy. If you are hitting no availability you are probably just checking outside the window.

I track the exact drop times and days-out for around 50 NYC restaurants at scoopd.nyc. Free to check.`,
  },
  {
    id: 'reddit-carbone',
    label: 'Reddit: Carbone-specific thread',
    text: `Carbone releases on Resy at 9 AM ET, 28 days out. If you check at 8:59 AM there is nothing. At 9:00 AM the slot 28 days out opens. Prime slots go within a few minutes.

The exact drop time is tracked at scoopd.nyc along with about 50 other hard-to-book NYC restaurants.`,
  },
  {
    id: 'reddit-lilia',
    label: 'Reddit: Lilia-specific thread',
    text: `Lilia releases on Resy at 8 AM on the 1st of each month for the month after next. So on June 1st at 8 AM, August slots open. That is the window.

scoopd.nyc tracks the drop schedule for Lilia and around 50 other competitive NYC restaurants.`,
  },
  {
    id: 'reddit-travel',
    label: 'Reddit: Travel / visitor asking about NYC dining',
    text: `The hard part is knowing when to check, not just refreshing the app. Most top NYC restaurants release reservations at a specific time on a specific day. Carbone is 9 AM Resy, 28 days out. Per Se is 9 AM OpenTable, 28 days out. Le Bernardin is 9 AM OpenTable, 28 days out.

scoopd.nyc has the drop times for the main ones in one place. Free.`,
  },
  {
    id: 'hn-general',
    label: 'HN: Restaurant reservation system discussion',
    text: `The information asymmetry here is real and fixable. Every competitive NYC restaurant releases reservations on a fixed schedule at a specific time on a specific platform. Carbone: 9 AM, Resy, 28 days out. Lilia: 8 AM, 1st of month, Resy. None of this is published anywhere official.

I built scoopd.nyc to track the drop times and windows for around 50 NYC restaurants. Free to check. The thesis is that access to this info should not require paying a bot service.`,
  },
]

function RedditCard({ item }) {
  return (
    <a
      href={`https://reddit.com${item.permalink}`}
      target="_blank"
      rel="noopener noreferrer"
      className="rdr-card"
    >
      <div className="rdr-card-meta">
        <span className="rdr-card-sub">r/{item.subreddit}</span>
        <span className="rdr-card-dot">·</span>
        <span className="rdr-card-score">{item.score} pts</span>
        <span className="rdr-card-dot">·</span>
        <span className="rdr-card-comments">{item.num_comments} comments</span>
      </div>
      <div className="rdr-card-title">{item.title}</div>
    </a>
  )
}

function HNCard({ item }) {
  return (
    <a
      href={item.url || `https://news.ycombinator.com/item?id=${item.objectID}`}
      target="_blank"
      rel="noopener noreferrer"
      className="rdr-card"
    >
      <div className="rdr-card-meta">
        <span className="rdr-card-sub">HN</span>
        <span className="rdr-card-dot">·</span>
        <span className="rdr-card-score">{item.points ?? 0} pts</span>
        <span className="rdr-card-dot">·</span>
        <span className="rdr-card-comments">{item.num_comments ?? 0} comments</span>
      </div>
      <div className="rdr-card-title">{item.title}</div>
    </a>
  )
}

export default function RadarClient() {
  const [tab, setTab] = useState('reddit')

  const [redditResults, setRedditResults] = useState([])
  const [redditLoading, setRedditLoading] = useState(false)
  const [redditError, setRedditError] = useState(null)
  const [redditQuery, setRedditQuery] = useState('')

  const [hnResults, setHNResults] = useState([])
  const [hnLoading, setHNLoading] = useState(false)
  const [hnError, setHNError] = useState(null)
  const [hnQuery, setHNQuery] = useState('')

  const [copied, setCopied] = useState(null)

  async function fetchReddit(keyword) {
    setRedditLoading(true)
    setRedditError(null)
    setRedditQuery(keyword.label)
    setRedditResults([])
    try {
      const base = keyword.sub
        ? `https://www.reddit.com/r/${keyword.sub}/search.json`
        : 'https://www.reddit.com/search.json'
      const params = new URLSearchParams({ q: keyword.q, sort: 'new', t: 'month', limit: '25' })
      if (keyword.sub) params.set('restrict_sr', 'on')
      const res = await fetch(`${base}?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setRedditResults(data.data?.children?.map(c => c.data) ?? [])
    } catch (err) {
      setRedditError(err.message)
    }
    setRedditLoading(false)
  }

  async function fetchHN(keyword) {
    setHNLoading(true)
    setHNError(null)
    setHNQuery(keyword.label)
    setHNResults([])
    try {
      const params = new URLSearchParams({ query: keyword.q, tags: 'story', hitsPerPage: '25' })
      const res = await fetch(`https://hn.algolia.com/api/v1/search?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setHNResults(data.hits ?? [])
    } catch (err) {
      setHNError(err.message)
    }
    setHNLoading(false)
  }

  async function copyTemplate(id, text) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // clipboard API unavailable
    }
  }

  return (
    <div className="rdr-wrap">
      <div className="rdr-header">
        <div className="rdr-logo">Scoopd</div>
        <div className="rdr-header-label">Outreach Radar</div>
        <a href="/admin" className="rdr-back">Admin</a>
      </div>

      <div className="rdr-tabs">
        <button className={`rdr-tab ${tab === 'reddit' ? 'active' : ''}`} onClick={() => setTab('reddit')}>Reddit</button>
        <button className={`rdr-tab ${tab === 'hn' ? 'active' : ''}`} onClick={() => setTab('hn')}>Hacker News</button>
        <button className={`rdr-tab ${tab === 'targets' ? 'active' : ''}`} onClick={() => setTab('targets')}>Manual Targets</button>
        <button className={`rdr-tab ${tab === 'templates' ? 'active' : ''}`} onClick={() => setTab('templates')}>Reply Templates</button>
      </div>

      <div className="rdr-body">

        {tab === 'reddit' && (
          <div>
            <div className="rdr-section-label">Keyword Search</div>
            <div className="rdr-chips">
              {REDDIT_KEYWORDS.map(kw => (
                <button
                  key={kw.label}
                  className={`rdr-chip ${redditQuery === kw.label ? 'active' : ''}`}
                  onClick={() => fetchReddit(kw)}
                >
                  {kw.label}
                </button>
              ))}
            </div>
            <div className="rdr-section-label" style={{ marginTop: '1.5rem' }}>X Searches</div>
            <div className="rdr-x-row">
              {X_SEARCHES.map(s => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="rdr-x-link">
                  {s.label} ↗
                </a>
              ))}
            </div>
            {redditQuery && <div className="rdr-query-label">Results: {redditQuery}</div>}
            {redditLoading && <div className="rdr-loading">Searching Reddit...</div>}
            {redditError && <div className="rdr-error">Error: {redditError}</div>}
            {!redditLoading && redditResults.length > 0 && (
              <div className="rdr-results">
                {redditResults.map(item => <RedditCard key={item.id} item={item} />)}
              </div>
            )}
            {!redditLoading && !redditError && redditQuery && redditResults.length === 0 && (
              <div className="rdr-empty">No results.</div>
            )}
            {!redditQuery && <div className="rdr-hint">Click a chip to search.</div>}
          </div>
        )}

        {tab === 'hn' && (
          <div>
            <div className="rdr-section-label">Keyword Search</div>
            <div className="rdr-chips">
              {HN_KEYWORDS.map(kw => (
                <button
                  key={kw.label}
                  className={`rdr-chip ${hnQuery === kw.label ? 'active' : ''}`}
                  onClick={() => fetchHN(kw)}
                >
                  {kw.label}
                </button>
              ))}
            </div>
            {hnQuery && <div className="rdr-query-label">Results: {hnQuery}</div>}
            {hnLoading && <div className="rdr-loading">Searching Hacker News...</div>}
            {hnError && <div className="rdr-error">Error: {hnError}</div>}
            {!hnLoading && hnResults.length > 0 && (
              <div className="rdr-results">
                {hnResults.map(item => <HNCard key={item.objectID} item={item} />)}
              </div>
            )}
            {!hnLoading && !hnError && hnQuery && hnResults.length === 0 && (
              <div className="rdr-empty">No results.</div>
            )}
            {!hnQuery && <div className="rdr-hint">Click a chip to search.</div>}
          </div>
        )}

        {tab === 'targets' && (
          <div>
            <div className="rdr-section-label">Outreach Targets</div>
            <div className="rdr-target-list">
              {MANUAL_TARGETS.map(t => (
                <a
                  key={t.name}
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rdr-target-card"
                >
                  <div className="rdr-target-name">{t.name}</div>
                  <div className="rdr-target-notes">{t.notes}</div>
                </a>
              ))}
            </div>
          </div>
        )}

        {tab === 'templates' && (
          <div>
            <div className="rdr-section-label">Reply Templates</div>
            <div className="rdr-template-list">
              {TEMPLATES.map(tpl => (
                <div key={tpl.id} className="rdr-template-card">
                  <div className="rdr-template-header">
                    <span className="rdr-template-label">{tpl.label}</span>
                    <button
                      className={`rdr-copy-btn ${copied === tpl.id ? 'copied' : ''}`}
                      onClick={() => copyTemplate(tpl.id, tpl.text)}
                    >
                      {copied === tpl.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="rdr-template-text">{tpl.text}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
