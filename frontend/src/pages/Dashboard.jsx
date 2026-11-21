import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../api'
import { useAuth } from '../AuthContext'
import { money, STATUS_COLOR } from '../utils'

function StatCard({ icon, label, value, cols }) {
  return (
    <div className={cols}>
      <div className="card stat-card h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <i className={`bi ${icon} stat-icon`}></i>
          <div>
            <div className="stat-value">{value}</div>
            <div className="text-muted small">{label}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const isStaff = user.role === 'admin' || user.role === 'receptionist'
  const [bookings, setBookings] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const calls = [API.get('/bookings/').then((r) => setBookings(r.data))]
    if (isStaff) calls.push(API.get('/stats/').then((r) => setStats(r.data)))
    Promise.allSettled(calls).finally(() => setLoading(false))
  }, [isStaff])

  const today = new Date().toISOString().split('T')[0]
  const upcoming = bookings.filter(
    (b) => ['pending', 'confirmed'].includes(b.status) && b.check_in >= today)
  const completed = bookings.filter((b) => b.status === 'checked_out')
  const nextStay = [...upcoming].sort((a, b) => a.check_in.localeCompare(b.check_in))[0]
  const recent = bookings.slice(0, 5)

  return (
    <>
      <div className="page-banner">
        <div className="container">
          <h2 className="mb-1">Welcome back, {user.username} 👋</h2>
          <p className="mb-0 opacity-75">
            {isStaff ? 'Hotel overview and today’s activity' : 'Your bookings and upcoming stays'}
          </p>
        </div>
      </div>

      <div className="container py-4">
        {loading && (
          <div className="text-center py-5"><div className="spinner-border text-warning"></div></div>
        )}

        {!loading && isStaff && (
          <>
            <div className="row g-3 mb-4">
              <StatCard cols="col-6 col-md-4 col-xl-2" icon="bi-door-closed" label="Total rooms" value={stats?.total_rooms ?? '-'} />
              <StatCard cols="col-6 col-md-4 col-xl-2" icon="bi-people" label="Occupied now" value={stats?.occupied_now ?? '-'} />
              <StatCard cols="col-6 col-md-4 col-xl-2" icon="bi-box-arrow-in-right" label="Arrivals today" value={stats?.arrivals_today ?? '-'} />
              <StatCard cols="col-6 col-md-4 col-xl-2" icon="bi-box-arrow-right" label="Departures today" value={stats?.departures_today ?? '-'} />
              <StatCard cols="col-6 col-md-4 col-xl-2" icon="bi-journal-text" label="Total bookings" value={stats?.total_bookings ?? '-'} />
              <StatCard cols="col-6 col-md-4 col-xl-2" icon="bi-cash-stack" label="Revenue collected" value={money(stats?.revenue)} />
            </div>

            <div className="row g-4 mb-4">
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="mb-3">Bookings by status</h5>
                    {stats && Object.entries(stats.by_status).map(([status, count]) => {
                      const pct = stats.total_bookings ? Math.round((count * 100) / stats.total_bookings) : 0
                      return (
                        <div className="mb-3" key={status}>
                          <div className="d-flex justify-content-between small mb-1">
                            <span className="text-capitalize">{status.replace('_', ' ')}</span>
                            <span>{count}</span>
                          </div>
                          <div className="progress" style={{ height: 8 }}>
                            <div className={`progress-bar bg-${STATUS_COLOR[status]}`} style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="mb-3">Quick actions</h5>
                    <div className="d-grid gap-2">
                      <Link to="/my-bookings" className="btn btn-navy text-start">
                        <i className="bi bi-list-check me-2"></i>View all bookings
                      </Link>
                      <Link to="/manage-rooms" className="btn btn-navy text-start">
                        <i className="bi bi-gear me-2"></i>Manage rooms
                      </Link>
                      <Link to="/rooms" className="btn btn-outline-dark text-start">
                        <i className="bi bi-search me-2"></i>Browse rooms
                      </Link>
                      <a href={import.meta.env.PROD ? '/admin/' : 'http://127.0.0.1:8000/admin/'} target="_blank" rel="noreferrer"
                         className="btn btn-outline-dark text-start">
                        <i className="bi bi-shield-lock me-2"></i>Open admin panel
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {!loading && !isStaff && (
          <>
            <div className="row g-3 mb-4">
              <StatCard cols="col-12 col-md-4" icon="bi-journal-text" label="Total bookings" value={bookings.length} />
              <StatCard cols="col-12 col-md-4" icon="bi-calendar-event" label="Upcoming stays" value={upcoming.length} />
              <StatCard cols="col-12 col-md-4" icon="bi-check2-circle" label="Completed stays" value={completed.length} />
            </div>

            <div className="card mb-4">
              <div className="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">
                {nextStay ? (
                  <div>
                    <div className="text-muted small">Your next stay</div>
                    <h5 className="mb-0">
                      Room {nextStay.room_number} · {nextStay.check_in} → {nextStay.check_out}
                    </h5>
                  </div>
                ) : (
                  <div>
                    <h5 className="mb-1">No upcoming stays</h5>
                    <span className="text-muted">Find a room and plan your next trip.</span>
                  </div>
                )}
                <Link to={nextStay ? `/invoice/${nextStay.id}` : '/rooms'} className="btn btn-gold">
                  {nextStay ? 'View invoice' : 'Browse rooms'}
                </Link>
              </div>
            </div>
          </>
        )}

        {!loading && (
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Recent bookings</h5>
                <Link to="/my-bookings" className="small">View all</Link>
              </div>
              {recent.length === 0 ? (
                <p className="text-muted mb-0">No bookings yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>#</th>
                        {isStaff && <th>Guest</th>}
                        <th>Room</th>
                        <th>Dates</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((b) => (
                        <tr key={b.id}>
                          <td>{b.id}</td>
                          {isStaff && <td>{b.guest_name}</td>}
                          <td>{b.room_number}</td>
                          <td className="text-nowrap">{b.check_in} → {b.check_out}</td>
                          <td><span className={`badge bg-${STATUS_COLOR[b.status]}`}>{b.status}</span></td>
                          <td className="text-end">
                            <Link to={`/invoice/${b.id}`} className="btn btn-sm btn-outline-primary">Invoice</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
