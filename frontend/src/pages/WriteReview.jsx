import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import API from '../api'

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

export default function WriteReview() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    API.get(`/bookings/${bookingId}/`)
      .then((res) => setBooking(res.data))
      .catch(() => setError('Booking not found'))
  }, [bookingId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating) {
      setError('Please choose a star rating')
      return
    }
    setError('')
    setSaving(true)
    try {
      await API.post('/crm/feedback/', { booking: Number(bookingId), rating, comment })
      navigate('/my-bookings')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit your review')
    } finally {
      setSaving(false)
    }
  }

  if (!booking) return <div className="container mt-4">{error || 'Loading...'}</div>

  const shown = hover || rating

  return (
    <div className="container py-5" style={{ maxWidth: 620 }}>
      <Link to="/my-bookings" className="text-decoration-none">← Back to bookings</Link>
      <div className="card mt-3">
        <div className="card-body p-4">
          <h3 className="fw-bold">Rate your stay</h3>
          <p className="text-muted">
            Room {booking.room_number} · {booking.check_in} → {booking.check_out}
          </p>

          {booking.status !== 'checked_out' ? (
            <div className="alert alert-warning mb-0">You can review a stay after check-out.</div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-danger py-2">{error}</div>}

              <div className="star-picker mb-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} aria-label={`${n} stars`}
                          onClick={() => setRating(n)}
                          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}>
                    <i className={`bi ${n <= shown ? 'bi-star-fill' : 'bi-star'}`}></i>
                  </button>
                ))}
              </div>
              <div className="text-muted small mb-3" style={{ minHeight: 20 }}>{LABELS[shown]}</div>

              <label className="form-label">Tell us about your stay (optional)</label>
              <textarea className="form-control mb-3" rows="4" maxLength="1000"
                        placeholder="What did you like? What can we improve?"
                        value={comment} onChange={(e) => setComment(e.target.value)} />

              <button className="btn btn-gold" disabled={saving}>
                {saving ? 'Submitting...' : 'Submit review'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
