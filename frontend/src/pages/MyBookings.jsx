import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../api'
import { useAuth } from '../AuthContext'
import { STATUS_COLOR } from '../utils'

export default function MyBookings() {
  const { user } = useAuth()
  const isStaff = user.role === 'admin' || user.role === 'receptionist'

  const [bookings, setBookings] = useState([])
  const [reviewed, setReviewed] = useState(new Set())
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () =>
    API.get('/bookings/')
      .then((res) => setBookings(res.data))
      .catch(() => setError('Could not load bookings'))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
    if (!isStaff) {
      API.get('/crm/feedback/')
        .then((res) => setReviewed(new Set(res.data.map((f) => f.booking))))
        .catch(() => {})
    }
  }, [isStaff])

  const handleCancel = async (id) => {
    if (!window.confirm('Do you want to cancel this booking?')) return
    try {
      await API.post(`/bookings/${id}/cancel/`)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not cancel booking')
    }
  }

  const visible = bookings.filter((b) => filter === 'all' || b.status === filter)

  return (
    <>
      <div className="page-banner">
        <div className="container">
          <h2 className="mb-1">{isStaff ? 'All Bookings' : 'My Bookings'}</h2>
          <p className="mb-0 opacity-75">
            {isStaff ? 'Every reservation in the hotel' : 'Your reservations, invoices and reviews'}
          </p>
        </div>
      </div>

      <div className="container py-4">
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="text-muted">{visible.length} booking{visible.length === 1 ? '' : 's'}</span>
          <select className="form-select form-select-sm" style={{ width: 170 }} value={filter}
                  onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked in</option>
            <option value="checked_out">Checked out</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading && <div className="text-center py-4"><div className="spinner-border text-warning"></div></div>}
        {!loading && visible.length === 0 && (
          <div className="alert alert-info">
            No bookings found. <Link to="/rooms">Browse rooms</Link>
          </div>
        )}

        {visible.length > 0 && (
          <div className="card overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    {isStaff && <th>Guest</th>}
                    <th>Room</th><th>Check-in</th><th>Check-out</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((b) => (
                    <tr key={b.id}>
                      <td>{b.id}</td>
                      {isStaff && <td>{b.guest_name}</td>}
                      <td>{b.room_number}</td>
                      <td>{b.check_in}</td>
                      <td>{b.check_out}</td>
                      <td><span className={`badge bg-${STATUS_COLOR[b.status]}`}>{b.status}</span></td>
                      <td className="text-end text-nowrap">
                        <Link className="btn btn-sm btn-outline-primary me-2" to={`/invoice/${b.id}`}>Invoice</Link>
                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancel(b.id)}>
                            Cancel
                          </button>
                        )}
                        {!isStaff && b.status === 'checked_out' && (
                          reviewed.has(b.id) ? (
                            <span className="badge bg-success"><i className="bi bi-check2 me-1"></i>Reviewed</span>
                          ) : (
                            <Link className="btn btn-sm btn-gold" to={`/review/${b.id}`}>
                              <i className="bi bi-star me-1"></i>Rate stay
                            </Link>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
