'use client'
import { useState } from 'react'
import './admin.css'

const ADMIN_PASSWORD = 'scoopd2026'

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const EMPTY_FORM = {
  restaurant: '',
  neighborhood: '',
  platform: '',
  cuisine: '',
  release_time: '',
  observed_days: '',
  release_schedule: '',
  seat_count: '',
  michelin_stars: '',
  beli_score: '',
  notify_demand: '',
  price_tier: '',
  difficulty: '',
  confidence: '',
  last_verified: '',
  notes: '',
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  function handlePasswordSubmit(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      setPasswordError(false)
    } else {
      setPasswordError(true)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    const slug = generateSlug(form.restaurant)
    const payload = {
      ...form,
      slug,
      observed_days: form.observed_days ? parseInt(form.observed_days) : null,
      seat_count: form.seat_count ? parseInt(form.seat_count) : null,
      beli_score: form.beli_score ? parseFloat(form.beli_score) : null,
    }

    try {
      const res = await fetch('/api/admin/add-restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus({ type: 'success', message: `${form.restaurant} added successfully. Slug: ${slug}` })
        setForm(EMPTY_FORM)
      } else {
        setStatus({ type: 'error', message: data.error || 'Something went wrong.' })
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error. Try again.' })
    }
    setLoading(false)
  }

  if (!authed) {
    return (
      <div className="admin-auth">
        <div className="admin-auth-box">
          <div className="admin-logo">Scoopd</div>
          <div className="admin-auth-label">Admin Access</div>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`admin-auth-input ${passwordError ? 'error' : ''}`}
              autoFocus
            />
            {passwordError && <div className="admin-auth-error">Incorrect password</div>}
            <button type="submit" className="admin-auth-btn">Enter</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <div className="admin-logo">Scoopd</div>
        <div className="admin-header-label">Add Restaurant</div>
      </div>

      {status && (
        <div className={`admin-status ${status.type}`}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-form">

        <div className="admin-section-label">Core Info</div>
        <div className="admin-grid-2">
          <div className="admin-field">
            <label>Restaurant Name *</label>
            <input name="restaurant" value={form.restaurant} onChange={handleChange} required placeholder="e.g. Carbone" />
            {form.restaurant && <div className="admin-slug-preview">slug: {generateSlug(form.restaurant)}</div>}
          </div>
          <div className="admin-field">
            <label>Neighborhood</label>
            <input name="neighborhood" value={form.neighborhood} onChange={handleChange} placeholder="e.g. West Village" />
          </div>
          <div className="admin-field">
            <label>Platform</label>
            <select name="platform" value={form.platform} onChange={handleChange}>
              <option value="">Select</option>
              <option>Resy</option>
              <option>OpenTable</option>
              <option>DoorDash</option>
              <option>Tock</option>
              <option>Tock/OpenTable</option>
              <option>Resy/OpenTable</option>
              <option>Resy/Tock</option>
              <option>Phone/Relationships</option>
              <option>Walk-in</option>
              <option>Own Site</option>
              <option>Yelp</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Cuisine</label>
            <input name="cuisine" value={form.cuisine} onChange={handleChange} placeholder="e.g. Italian" />
          </div>
        </div>

        <div className="admin-section-label">Reservation Details</div>
        <div className="admin-grid-2">
          <div className="admin-field">
            <label>Release Time (ET)</label>
            <select name="release_time" value={form.release_time} onChange={handleChange}>
              <option value="">Select</option>
              <option>12:00 AM</option>
              <option>7:00 AM</option>
              <option>8:00 AM</option>
              <option>9:00 AM</option>
              <option>10:00 AM</option>
              <option>11:00 AM</option>
              <option>12:00 PM</option>
              <option>8:00 PM</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Observed Days Out</label>
            <input name="observed_days" type="number" value={form.observed_days} onChange={handleChange} placeholder="e.g. 31" />
          </div>
          <div className="admin-field">
            <label>Release Schedule (monthly)</label>
            <input name="release_schedule" value={form.release_schedule} onChange={handleChange} placeholder="e.g. 1st of Month, 2 absolute months" />
          </div>
          <div className="admin-field">
            <label>Seat Count</label>
            <input name="seat_count" type="number" value={form.seat_count} onChange={handleChange} placeholder="e.g. 60" />
          </div>
        </div>

        <div className="admin-section-label">Ratings & Classification</div>
        <div className="admin-grid-3">
          <div className="admin-field">
            <label>Difficulty</label>
            <select name="difficulty" value={form.difficulty} onChange={handleChange}>
              <option value="">Select</option>
              <option>Extremely Hard</option>
              <option>Very Hard</option>
              <option>Hard</option>
              <option>Medium</option>
              <option>Easy</option>
              <option>Walk-in Only</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Notify Demand</label>
            <select name="notify_demand" value={form.notify_demand} onChange={handleChange}>
              <option value="">Select</option>
              <option>Very High</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Price Tier</label>
            <select name="price_tier" value={form.price_tier} onChange={handleChange}>
              <option value="">Select</option>
              <option>$</option>
              <option>$$</option>
              <option>$$$</option>
              <option>$$$$</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Beli Score</label>
            <input name="beli_score" type="number" step="0.1" value={form.beli_score} onChange={handleChange} placeholder="e.g. 8.9" />
          </div>
          <div className="admin-field">
            <label>Michelin Stars</label>
            <select name="michelin_stars" value={form.michelin_stars} onChange={handleChange}>
              <option value="">None</option>
              <option value="—">—</option>
              <option value="⭐">⭐ 1 Star</option>
              <option value="⭐⭐">⭐⭐ 2 Stars</option>
              <option value="⭐⭐⭐">⭐⭐⭐ 3 Stars</option>
              <option value="Bib">Bib Gourmand</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Confidence</label>
            <select name="confidence" value={form.confidence} onChange={handleChange}>
              <option value="">Select</option>
              <option value="✅ Confirmed">✅ Confirmed</option>
              <option value="⚠️ Probable">⚠️ Probable</option>
              <option value="❌ Unconfirmed">❌ Unconfirmed</option>
            </select>
          </div>
        </div>

        <div className="admin-section-label">Notes & Verification</div>
        <div className="admin-grid-2">
          <div className="admin-field">
            <label>Last Verified</label>
            <input name="last_verified" value={form.last_verified} onChange={handleChange} placeholder="e.g. Apr 2026" />
          </div>
        </div>
        <div className="admin-field">
          <label>Notes (public description)</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Write the public-facing description here..." rows={4} />
        </div>

        <button type="submit" className="admin-submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Restaurant'}
        </button>
      </form>
    </div>
  )
}