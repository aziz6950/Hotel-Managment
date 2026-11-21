import { useEffect, useState } from 'react'
import API from '../../api'
import { Stars } from '../Crm'

export default function Reviews() {
  const [data, setData] = useState(null)

  useEffect(() => {
    API.get('/crm/reviews/')
      .then((res) => setData(res.data))
      .catch(() => setData({ reviews: [], count: 0, average: null }))
  }, [])

  return (
    <section className="py-5">
      <div className="container">
        <div className="section-title">
          <div className="eyebrow">Testimonials</div>
          <h2>What Our Guests Say</h2>
          {data && data.count > 0 ? (
            <p className="text-muted mb-0">
              <Stars value={data.average} /> <b>{data.average}</b> from {data.count} guest review{data.count > 1 ? 's' : ''}
            </p>
          ) : (
            <p className="text-muted mb-0">Real stays, honest words</p>
          )}
        </div>

        {data && data.reviews.length === 0 && (
          <p className="text-center text-muted">
            No reviews yet. Guests can rate their stay after check-out.
          </p>
        )}

        <div className="row g-4">
          {data && data.reviews.map((r) => (
            <div className="col-12 col-md-6 col-lg-4" key={r.id}>
              <div className="card review-card">
                <div className="mb-3"><Stars value={r.rating} /></div>
                <p className="text-muted">“{r.comment}”</p>
                <div className="d-flex align-items-center gap-3 mt-auto pt-2">
                  <div className="avatar">{r.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="fw-semibold">{r.name}</div>
                    <div className="text-muted small">{r.created_at.slice(0, 10)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
