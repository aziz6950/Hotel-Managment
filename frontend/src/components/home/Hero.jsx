import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../AuthContext'

export default function Hero() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ check_in: '', check_out: '', guests: 1 })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/rooms?${new URLSearchParams(form).toString()}`)
  }

  const nights = form.check_in && form.check_out
    ? Math.round((new Date(form.check_out) - new Date(form.check_in)) / 86400000)
    : 0

  return (
    <>
      <section className="hero">
        <div className="container text-center text-lg-start">
          <p className="text-gold fw-semibold text-uppercase mb-2">Welcome to SOHEL Resort</p>
          <h1>Experience comfort,<br />book your stay with ease</h1>
          <p className="lead mt-3 mb-4" style={{ maxWidth: 560 }}>
            Comfortable rooms, transparent pricing and a smooth booking experience from check-in to check-out.
          </p>
          <div className="d-flex gap-2 flex-wrap justify-content-center justify-content-lg-start">
            <Link to="/rooms" className="btn btn-gold btn-lg">Explore Rooms</Link>
            {!user && (
              <Link to="/register" className="btn btn-outline-light btn-lg">Create Account</Link>
            )}
          </div>
          <div className="d-flex flex-wrap gap-4 mt-4 small justify-content-center justify-content-lg-start">
            <span><i className="bi bi-check-circle me-1 text-gold"></i>Free cancellation before check-in</span>
            <span><i className="bi bi-check-circle me-1 text-gold"></i>Night-by-night pricing</span>
            <span><i className="bi bi-check-circle me-1 text-gold"></i>Secure online booking</span>
          </div>
        </div>
      </section>

      <section className="search-section">
        <div className="container">
          <form className="card search-panel" onSubmit={handleSearch}>
            <div className="search-panel-head">
              <i className="bi bi-calendar2-check"></i>
              <div>
                <h5 className="mb-0 fw-bold">Find your perfect room</h5>
                <small className="text-muted">Choose your dates and see what is available</small>
              </div>
              {nights > 0 && (
                <span className="nights-badge ms-auto">{nights} night{nights > 1 ? 's' : ''}</span>
              )}
            </div>

            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label">Check-in</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-calendar-event"></i></span>
                  <input type="date" className="form-control" name="check_in" min={today}
                         value={form.check_in} onChange={handleChange} required />
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label">Check-out</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-calendar-check"></i></span>
                  <input type="date" className="form-control" name="check_out" min={form.check_in || today}
                         value={form.check_out} onChange={handleChange} required />
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-2">
                <label className="form-label">Guests</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-people"></i></span>
                  <input type="number" min="1" className="form-control" name="guests"
                         value={form.guests} onChange={handleChange} />
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <button className="btn btn-gold btn-lg w-100">
                  <i className="bi bi-search me-2"></i>Check Availability
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}
