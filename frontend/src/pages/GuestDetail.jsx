import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import API from '../api'
import { Stars, TierBadge } from '../components/Crm'
import { money, STATUS_COLOR } from '../utils'

export default function GuestDetail() {
  const { id } = useParams()
  const [g, setG] = useState(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  const load = () =>
    API.get(`/crm/guests/${id}/`)
      .then((res) => setG(res.data))
      .catch(() => setError('Guest not found'))

  useEffect(() => {
    load()
  }, [id])

  const addNote = async (e) => {
    e.preventDefault()
    try {
      await API.post(`/crm/guests/${id}/notes/`, { text: note })
      setNote('')
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save note')
    }
  }

  if (!g) return <div className="container mt-4">{error || 'Loading...'}</div>

  return (
    <>
      <div className="page-banner">
        <div className="container">
          <Link to="/guests" className="text-white-50 small">← Guest Directory</Link>
          <div className="d-flex flex-wrap align-items-center gap-3 mt-2">
            <h2 className="mb-0">{g.name}</h2>
            <TierBadge tier={g.tier} />
          </div>
          <p className="mb-0 opacity-75 mt-1">@{g.username} · Member since {g.joined}</p>
        </div>
      </div>

      <div className="container py-4">
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3"><div className="card stat-card"><div className="card-body">
            <div className="stat-value">{g.total_bookings}</div><div className="text-muted small">Bookings</div>
          </div></div></div>
          <div className="col-6 col-md-3"><div className="card stat-card"><div className="card-body">
            <div className="stat-value">{g.completed_stays}</div><div className="text-muted small">Completed stays</div>
          </div></div></div>
          <div className="col-6 col-md-3"><div className="card stat-card"><div className="card-body">
            <div className="stat-value">{money(g.total_spent)}</div><div className="text-muted small">Total spent</div>
          </div></div></div>
          <div className="col-6 col-md-3"><div className="card stat-card"><div className="card-body">
            <div className="stat-value">{g.next_tier ? g.next_tier.stays_needed : '-'}</div>
            <div className="text-muted small">{g.next_tier ? `Stays to ${g.next_tier.name}` : 'Top tier'}</div>
          </div></div></div>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Booking history</h5>
                {g.bookings.length === 0 ? (
                  <p className="text-muted mb-0">No bookings yet.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead><tr><th>#</th><th>Room</th><th>Dates</th><th>Status</th><th></th></tr></thead>
                      <tbody>
                        {g.bookings.map((b) => (
                          <tr key={b.id}>
                            <td>{b.id}</td>
                            <td>{b.room_number}</td>
                            <td className="text-nowrap">{b.check_in} → {b.check_out}</td>
                            <td><span className={`badge bg-${STATUS_COLOR[b.status]}`}>{b.status}</span></td>
                            <td className="text-end">
                              <Link className="btn btn-sm btn-outline-primary" to={`/invoice/${b.id}`}>Invoice</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Feedback from this guest</h5>
                {g.feedback.length === 0 ? (
                  <p className="text-muted mb-0">No feedback yet.</p>
                ) : g.feedback.map((f) => (
                  <div className="border-bottom pb-3 mb-3" key={f.id}>
                    <div className="d-flex justify-content-between">
                      <Stars value={f.rating} />
                      <span className="small text-muted">Room {f.room} · {f.created_at.slice(0, 10)}</span>
                    </div>
                    <p className="mb-0 mt-2">{f.comment || <span className="text-muted">No comment</span>}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Contact</h5>
                <p className="mb-2"><i className="bi bi-envelope me-2 text-gold"></i>{g.email || '-'}</p>
                <p className="mb-2"><i className="bi bi-telephone me-2 text-gold"></i>{g.phone || '-'}</p>
                <p className="mb-0"><i className="bi bi-geo-alt me-2 text-gold"></i>{g.address || '-'}</p>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h5 className="fw-bold mb-1">Staff notes</h5>
                <p className="small text-muted">Private. Guests cannot see these.</p>
                <form onSubmit={addNote} className="mb-3">
                  <textarea className="form-control mb-2" rows="2" required value={note}
                            placeholder="e.g. Prefers a quiet room, celebrates anniversary in March"
                            onChange={(e) => setNote(e.target.value)} />
                  <button className="btn btn-navy btn-sm">Add note</button>
                </form>
                {g.notes.length === 0 && <p className="text-muted small mb-0">No notes yet.</p>}
                {g.notes.map((n) => (
                  <div className="note-item mb-2" key={n.id}>
                    <div>{n.text}</div>
                    <div className="small text-muted mt-1">{n.author} · {n.created_at.slice(0, 10)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
