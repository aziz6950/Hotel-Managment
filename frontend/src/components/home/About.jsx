import { useEffect, useState } from 'react'
import API from '../../api'

const POINTS = [
  'Clean and comfortable rooms',
  'Friendly front desk, open 24/7',
  'Transparent pricing with no hidden charges',
  'Easy online booking and payment',
]

export default function About() {
  const [stats, setStats] = useState({ rooms: '-', types: '-' })

  useEffect(() => {
    Promise.all([API.get('/rooms/'), API.get('/room-types/')])
      .then(([r, t]) => setStats({ rooms: r.data.length, types: t.data.length }))
      .catch(() => {})
  }, [])

  return (
    <section id="about" className="py-5 bg-white">
      <div className="container">
        <div className="row g-4 align-items-stretch">
          <div className="col-lg-5">
            <div className="about-visual" style={{ backgroundImage: "url('/images/about.webp')" }}>
              <span className="about-badge">
                <i className="bi bi-clock-history me-2"></i>24/7 Front Desk
              </span>
            </div>
          </div>
          <div className="col-lg-7">
            <div className="ps-lg-3">
              <div className="section-title text-start mb-3">
                <div className="eyebrow">About us</div>
                <h2>About Our Hotel</h2>
              </div>
              <p className="text-muted">
                SOHEL Resort is built around simple, honest hospitality. From the moment you pick your dates to the
                day you check out, we want every step to be clear, comfortable and stress-free.
              </p>
              <p className="text-muted">
                Our online system shows you the exact price for every night, lets you pay in full or in parts, and
                keeps your invoice ready whenever you need it.
              </p>
              <ul className="list-unstyled mb-4">
                {POINTS.map((p) => (
                  <li key={p} className="mb-2">
                    <i className="bi bi-check-circle-fill text-gold me-2"></i>{p}
                  </li>
                ))}
              </ul>
              <div className="row text-center g-3">
                <div className="col-3 about-stat">
                  <div className="num">{stats.rooms}</div>
                  <div className="text-muted small">Rooms</div>
                </div>
                <div className="col-3 about-stat">
                  <div className="num">{stats.types}</div>
                  <div className="text-muted small">Room types</div>
                </div>
                <div className="col-3 about-stat">
                  <div className="num">24/7</div>
                  <div className="text-muted small">Reception</div>
                </div>
                <div className="col-3 about-stat">
                  <div className="num">3</div>
                  <div className="text-muted small">Payment methods</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
