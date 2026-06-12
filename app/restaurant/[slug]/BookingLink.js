'use client'

const PLATFORM_URLS = {
  'Resy': 'https://resy.com',
  'OpenTable': 'https://www.opentable.com',
  'DoorDash': 'https://www.doordash.com',
  'Tock': 'https://www.exploretock.com',
  'Tock/OpenTable': 'https://www.opentable.com',
  'Resy/OpenTable': 'https://resy.com',
  'Resy/Tock': 'https://resy.com',
  'SevenRooms': 'https://www.sevenrooms.com',
  'Yelp': 'https://www.yelp.com',
}

export default function BookingLink({ platform, slug }) {
  if (!platform || platform === '—') {
    return <div className="rp-info-value na">—</div>
  }

  const url = PLATFORM_URLS[platform]

  if (!url) {
    return <div className="rp-info-value">{platform}</div>
  }

  function handleClick() {
    fetch('/api/actions/track', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_type: 'click_through', metadata: { slug, platform } }),
    }).catch(() => {})

    try {
      const shown = JSON.parse(localStorage.getItem('banner_shown') || '{}')
      if (!shown[slug]) {
        localStorage.setItem('pending_banner', slug)
      }
    } catch {}
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="rp-info-value rp-platform-link"
      onClick={handleClick}
    >
      {platform}
    </a>
  )
}
