import { ImageResponse } from 'next/og'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

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

export default async function Image({ params }) {
  const { slug } = await params

  const fontData = await getPlayfairFont()
  const fontFamily = fontData ? 'Playfair' : 'serif'

  let title = 'Scoopd'
  try {
    const file = path.join(process.cwd(), 'content/blog', `${slug}.mdx`)
    const raw = fs.readFileSync(file, 'utf-8')
    const { data } = matter(raw)
    if (data.title) title = data.title
  } catch {
    // fallback to default title
  }

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
        <div style={{ display: 'flex', height: 10, background: '#c9a96e' }} />
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '0 80px 64px',
          }}
        >
          <div
            style={{
              fontSize: title.length > 40 ? 52 : title.length > 25 ? 64 : 76,
              fontFamily,
              fontWeight: 700,
              color: '#e8e4dc',
              lineHeight: 1.15,
              marginBottom: 28,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              fontFamily: 'sans-serif',
              color: '#8a8a80',
            }}
          >
            From the Scoopd guide to NYC reservations
          </div>
        </div>
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
