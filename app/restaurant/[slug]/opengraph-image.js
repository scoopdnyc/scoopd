import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const DIFFICULTY_COLORS = {
  'Easy':           '#6ec9a0',
  'Medium':         '#c9b882',
  'Hard':           '#e38f09',
  'Very Hard':      '#c96e6e',
  'Extremely Hard': '#a855f7',
}

async function getPlayfairFont() {
  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700',
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' } }
    ).then(r => r.text())
    const url = css.match(/src:\s*url\((.+?)\)\s*format\('woff2'\)/)?.[1]
    if (!url) return null
    return await fetch(url).then(r => r.arrayBuffer())
  } catch {
    return null
  }
}

export default async function Image({ params }) {
  const { slug } = await params

  const [fontData, restaurant] = await Promise.all([
    getPlayfairFont(),
    fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/restaurants?slug=eq.${encodeURIComponent(slug)}&select=restaurant,neighborhood,platform,difficulty&limit=1`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    )
      .then(r => r.json())
      .then(rows => rows?.[0] ?? null)
      .catch(() => null),
  ])

  const name       = restaurant?.restaurant || 'Restaurant'
  const hood       = restaurant?.neighborhood || ''
  const platform   = restaurant?.platform || ''
  const difficulty = restaurant?.difficulty || ''
  const badgeColor = DIFFICULTY_COLORS[difficulty] || '#8a8a80'
  const fontFamily = fontData ? 'Playfair' : 'serif'

  const meta = [hood, platform].filter(Boolean).join('  ·  ')

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#0f0f0d',
        }}
      >
        {/* Gold top bar */}
        <div style={{ display: 'flex', height: 10, background: '#c9a96e' }} />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '0 80px 64px',
          }}
        >
          {/* Restaurant name */}
          <div
            style={{
              fontSize: name.length > 20 ? 64 : name.length > 14 ? 76 : 88,
              fontFamily,
              fontWeight: 700,
              color: '#e8e4dc',
              lineHeight: 1.1,
              marginBottom: 22,
            }}
          >
            {name}
          </div>

          {/* Neighborhood · Platform */}
          {meta && (
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                fontFamily: 'sans-serif',
                color: '#8a8a80',
                marginBottom: difficulty ? 28 : 0,
              }}
            >
              {meta}
            </div>
          )}

          {/* Difficulty badge */}
          {difficulty && (
            <div style={{ display: 'flex' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: `1.5px solid ${badgeColor}`,
                  color: badgeColor,
                  fontSize: 20,
                  fontFamily: 'sans-serif',
                  padding: '6px 18px',
                  borderRadius: 4,
                }}
              >
                {difficulty}
              </div>
            </div>
          )}
        </div>

        {/* Footer row: scoopd.nyc right-aligned */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '0 80px 28px',
          }}
        >
          <span style={{ fontSize: 22, fontFamily: 'sans-serif', color: '#c9a96e' }}>
            scoopd.nyc
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: 'Playfair', data: fontData, style: 'normal', weight: 700 }]
        : [],
    }
  )
}
