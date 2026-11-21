import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../api'
import { Stars } from '../components/Crm'

export default function Feedback() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () =>
    API.get('/crm/feedback/')
      .then((res) => setItems(res.data))
      .catch(() => setError('Could not load reviews'))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const toggle = async (id) => {
    try {
      await API.post(`/crm/feedback/${id}/toggle/`)
      load()
    } catch {
      setError('Could not update review')
    }
  }

  const avg = items.length ? (items.reduce((s, f) => s + f.rating, 0) / items.length).toFixed(1) : '-'

  return (
    <>
      <div className="page-banner">
        <div className="container">
          <h2 className="mb-1">Guest Reviews</h2>
          <p className="mb-0 opacity-75">
            {items.length} review{items.length === 1 ? '' : 's'} · Average rating {avg}
          </p>
        </div>
      </div>

      <div className="container py-4">
        {error && <div className="alert alert-danger">{error}</div>}
        {loading && <div className="text-center py-4"><div className="spinner-border text-warning"></div></div>}
        {!loading && items.length === 0 && <div className="alert alert-info">No reviews yet</div>}

        <div className="row g-3">
          {items.map((f) => (
            <div className="col-md-6" key={f.id}>
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Stars value={f.rating} />
                    <span className={`badge ${f.is_public ? 'bg-success' : 'bg-secondary'}`}>
                      {f.is_public ? 'Public' : 'Hidden'}
                    </span>
                  </div>
                  <p className="mb-3">{f.comment || <span className="text-muted">No comment</span>}</p>
                  <div className="d-flex justify-content-between align-items-center small">
                    <span>
                      <Link to={`/guests/${f.guest_id}`}>{f.guest_name}</Link>
                      <span className="text-muted"> · Room {f.room} · {f.created_at.slice(0, 10)}</span>
                    </span>
                    <button className="btn btn-sm btn-outline-dark" onClick={() => toggle(f.id)}>
                      {f.is_public ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
