import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Scoopd — NYC Restaurant Reservation Intelligence'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

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

export default async function Image() {
  const fontData = await getPlayfairFont()

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

        {/* Center content */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              fontSize: 100,
              fontFamily: fontData ? 'Playfair' : 'serif',
              fontWeight: 700,
              color: '#c9a96e',
              letterSpacing: '-1px',
              lineHeight: 1,
            }}
          >
            Scoopd
          </div>
          <div
            style={{
              fontSize: 30,
              fontFamily: 'sans-serif',
              color: '#8a8a80',
              letterSpacing: '0.5px',
            }}
          >
            NYC Restaurant Reservation Intelligence
          </div>
        </div>

        {/* Gold bottom bar */}
        <div style={{ display: 'flex', height: 5, background: '#c9a96e' }} />
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
