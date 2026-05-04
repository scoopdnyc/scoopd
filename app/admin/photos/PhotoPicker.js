'use client'
import { useState, useRef, useEffect } from 'react'

export default function PhotoPicker({ restaurants }) {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [photos, setPhotos] = useState({})
  const [overrides, setOverrides] = useState(() => {
    const map = {}
    for (const r of restaurants) map[r.id] = r.photo_override_url ?? null
    return map
  })
  const [saving, setSaving] = useState({})
  const [focalPoints, setFocalPoints] = useState({})
  const [savedPositions, setSavedPositions] = useState({})
  const [savingPos, setSavingPos] = useState({})
  const [dragging, setDragging] = useState(null)
  const [heights, setHeights] = useState(() => {
    const map = {}
    for (const r of restaurants) map[r.id] = r.photo_height ?? 420
    return map
  })
  const [savingHeight, setSavingHeight] = useState({})
  const [expandedPhotos, setExpandedPhotos] = useState({})
  const previewRefs = useRef({})

  useEffect(() => {
    if (!dragging) return

    function onMouseMove(e) {
      const el = previewRefs.current[dragging]
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
      setFocalPoints(prev => ({ ...prev, [dragging]: { x, y } }))
    }

    function onMouseUp() {
      setDragging(null)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [dragging])

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      })
      if (res.ok) {
        setAuthed(true)
        setPasswordError(false)
      } else {
        setPasswordError(true)
      }
    } catch {
      setPasswordError(true)
    }
  }

  async function loadPhotos(restaurantId, placeId) {
    setPhotos(prev => ({ ...prev, [restaurantId]: 'loading' }))
    try {
      const res = await fetch(`/api/admin/photos/${placeId}`, { credentials: 'include' })
      if (!res.ok) {
        setPhotos(prev => ({ ...prev, [restaurantId]: 'error' }))
        return
      }
      const data = await res.json()
      setPhotos(prev => ({ ...prev, [restaurantId]: data.photos }))
    } catch {
      setPhotos(prev => ({ ...prev, [restaurantId]: 'error' }))
    }
  }

  async function setPhoto(restaurantId, photoUrl) {
    setSaving(prev => ({ ...prev, [restaurantId]: true }))
    try {
      const res = await fetch('/api/admin/set-photo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, photoUrl: photoUrl ?? null }),
        credentials: 'include',
      })
      if (res.ok) {
        setOverrides(prev => ({ ...prev, [restaurantId]: photoUrl ?? null }))
      }
    } finally {
      setSaving(prev => ({ ...prev, [restaurantId]: false }))
    }
  }

  async function saveHeight(restaurantId) {
    const height = heights[restaurantId] ?? 260
    setSavingHeight(prev => ({ ...prev, [restaurantId]: true }))
    try {
      await fetch('/api/admin/set-photo-height', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, height }),
        credentials: 'include',
      })
    } finally {
      setSavingHeight(prev => ({ ...prev, [restaurantId]: false }))
    }
  }

  async function saveFocalPoint(restaurantId) {
    const fp = focalPoints[restaurantId] ?? { x: 50, y: 50 }
    const position = `${Math.round(fp.x)}% ${Math.round(fp.y)}%`
    setSavingPos(prev => ({ ...prev, [restaurantId]: true }))
    try {
      const res = await fetch('/api/admin/set-photo-position', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, position }),
        credentials: 'include',
      })
      if (res.ok) {
        setSavedPositions(prev => ({ ...prev, [restaurantId]: position }))
      }
    } finally {
      setSavingPos(prev => ({ ...prev, [restaurantId]: false }))
    }
  }

  function handlePreviewMouseDown(e, restaurantId) {
    const el = previewRefs.current[restaurantId]
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    setFocalPoints(prev => ({ ...prev, [restaurantId]: { x, y } }))
    setDragging(restaurantId)
  }

  if (!authed) {
    return (
      <div className="ap-auth">
        <div className="ap-auth-box">
          <div className="ap-logo">Scoopd</div>
          <div className="ap-auth-label">Admin Access</div>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`ap-auth-input${passwordError ? ' error' : ''}`}
              autoFocus
            />
            {passwordError && <div className="ap-auth-error">Incorrect password</div>}
            <button type="submit" className="ap-auth-btn">Enter</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="ap-wrap">
      <div className="ap-header">
        <div className="ap-logo">Scoopd</div>
        <div className="ap-header-label">Photo Picker</div>
      </div>
      <div className="ap-list">
        {restaurants.map(r => {
          const rPhotos = photos[r.id]
          const currentOverride = overrides[r.id]
          const isSaving = !!saving[r.id]
          const currentHeight = heights[r.id] ?? 260
          const fp = focalPoints[r.id] ?? { x: 50, y: 50 }
          const objectPos = `${fp.x.toFixed(1)}% ${fp.y.toFixed(1)}%`

          return (
            <div key={r.id} className="ap-restaurant">
              <div className="ap-restaurant-header">
                <div className="ap-restaurant-name">{r.restaurant}</div>
                <div className="ap-restaurant-meta">
                  {currentOverride && <span className="ap-override-badge">override set</span>}
                  {!r.google_place_id && <span className="ap-no-place">no place id</span>}
                </div>
                {r.google_place_id && !rPhotos && (
                  <button
                    className="ap-load-btn"
                    onClick={() => loadPhotos(r.id, r.google_place_id)}
                  >
                    Load Photos
                  </button>
                )}
              </div>

              {currentOverride && (
                <>
                  <div className="ap-current-override">
                    <div className="ap-override-label">Current override</div>
                    <div className="ap-override-row">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={currentOverride} alt={r.restaurant} className="ap-override-thumb" />
                      <button
                        className="ap-clear-btn"
                        onClick={() => setPhoto(r.id, null)}
                        disabled={isSaving}
                      >
                        Clear override
                      </button>
                    </div>
                  </div>

                  <div className="ap-focal-wrap ap-height-wrap">
                    <div className="ap-focal-label">Banner height — {currentHeight}px</div>
                    <div className="ap-height-row">
                      <input
                        type="range"
                        min={180}
                        max={500}
                        value={currentHeight}
                        onChange={e => setHeights(prev => ({ ...prev, [r.id]: Number(e.target.value) }))}
                        className="ap-height-slider"
                      />
                      <button
                        className="ap-save-pos-btn"
                        onClick={() => saveHeight(r.id)}
                        disabled={savingHeight[r.id]}
                      >
                        {savingHeight[r.id] ? 'Saving...' : 'Save height'}
                      </button>
                    </div>
                  </div>

                  <div className="ap-focal-wrap">
                    <div className="ap-focal-label">Focal point — drag to reposition</div>
                    <div
                      className={`ap-focal-container${dragging === r.id ? ' ap-focal-dragging' : ''}`}
                      style={{ height: `${currentHeight}px` }}
                      ref={el => { previewRefs.current[r.id] = el }}
                      onMouseDown={e => handlePreviewMouseDown(e, r.id)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentOverride}
                        alt={r.restaurant}
                        className="ap-focal-img"
                        style={{ objectPosition: objectPos }}
                        draggable={false}
                      />
                      <div className="ap-focal-overlay">
                        <div
                          className="ap-focal-dot"
                          style={{ left: `${fp.x}%`, top: `${fp.y}%` }}
                        />
                      </div>
                    </div>
                    <div className="ap-focal-footer">
                      <button
                        className="ap-save-pos-btn"
                        onClick={() => saveFocalPoint(r.id)}
                        disabled={savingPos[r.id]}
                      >
                        {savingPos[r.id] ? 'Saving...' : 'Save position'}
                      </button>
                      <span className="ap-position-text">
                        {savedPositions[r.id]
                          ? `saved: ${savedPositions[r.id]}`
                          : objectPos}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {rPhotos === 'loading' && <div className="ap-loading">Loading photos...</div>}
              {rPhotos === 'error' && <div className="ap-error">Failed to load photos</div>}
              {Array.isArray(rPhotos) && (
                <>
                  <div className="ap-photo-grid">
                    {(expandedPhotos[r.id] ? rPhotos : rPhotos.slice(0, 12)).map((p, i) => {
                      const isActive = currentOverride === p.storedUrl
                      return (
                        <div key={p.photoReference} className={`ap-photo-card${isActive ? ' ap-photo-active' : ''}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.thumbnailUrl} alt={`Photo ${i + 1}`} className="ap-photo-thumb" />
                          <div className="ap-photo-meta">{p.width}×{p.height}</div>
                          <button
                            className="ap-use-btn"
                            onClick={() => setPhoto(r.id, p.storedUrl)}
                            disabled={isSaving || isActive}
                          >
                            {isActive ? 'Active' : 'Use this photo'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  {rPhotos.length > 12 && !expandedPhotos[r.id] && (
                    <button
                      className="ap-load-btn"
                      style={{ marginTop: '0.75rem' }}
                      onClick={() => setExpandedPhotos(prev => ({ ...prev, [r.id]: true }))}
                    >
                      Load more ({rPhotos.length - 12} more)
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
