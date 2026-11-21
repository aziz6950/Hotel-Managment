import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api'
import { TierBadge } from '../components/Crm'
import { money } from '../utils'

export default function Guests() {
  const navigate = useNavigate()
  const [guests, setGuests] = useState([])
  const [query, setQuery] = useState('')
  const [applied, setApplied] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    API.get('/crm/guests/', { params: applied ? { search: applied } : {} })
      .then((res) => setGuests(res.data))
      .catch(() => setError('Could not load guests'))
      .finally(() => setLoading(false))
  }, [applied])

  const handleSearch = (e) => {
    e.preventDefault()
    setApplied(query.trim())
  }

  const repeat = guests.filter((g) => g.completed_stays >= 2).length
  const vip = guests.filter((g) => ['Gold', 'Platinum'].includes(g.tier)).length

  return (
    <>
      <div className="page-banner">
        <div className="container">
          <h2 className="mb-1">Guest Directory</h2>
          <p className="mb-0 opacity-75">Customer relationship management: guest history, loyalty and notes</p>
        </div>
      </div>

      <div className="container py-4">
        <div className="row g-3 mb-4">
          <div className="col-4">
            <div className="card stat-card"><div className="card-body">
              <div className="stat-value">{guests.length}</div>
              <div className="text-muted small">Guests</div>
            </div></div>
          </div>
          <div className="col-4">
            <div className="card stat-card"><div className="card-body">
              <div className="stat-value">{repeat}</div>
              <div className="text-muted small">Repeat guests (2+ stays)</div>
            </div></div>
          </div>
          <div className="col-4">
            <div className="card stat-card"><div className="card-body">
              <div className="stat-value">{vip}</div>
              <div className="text-muted small">Gold / Platinum</div>
            </div></div>
          </div>
        </div>

        <form className="input-group mb-3" onSubmit={handleSearch}>
          <span className="input-group-text"><i className="bi bi-search"></i></span>
          <input className="form-control" placeholder="Search by name, username, email or phone"
                 value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="btn btn-navy">Search</button>
          {applied && (
            <button type="button" className="btn btn-outline-secondary"
                    onClick={() => { setQuery(''); setApplied('') }}>Clear</button>
          )}
        </form>

        {error && <div className="alert alert-danger">{error}</div>}
        {loading && <div className="text-center py-4"><div className="spinner-border text-warning"></div></div>}
        {!loading && guests.length === 0 && <div className="alert alert-info">No guests found</div>}

        {guests.length > 0 && (
          <div className="card overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Guest</th><th>Contact</th><th className="text-center">Stays</th>
                    <th className="text-center">Bookings</th><th>Total spent</th>
                    <th>Last stay</th><th>Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g) => (
                    <tr key={g.id} className="clickable-row" onClick={() => navigate(`/guests/${g.id}`)}>
                      <td>
                        <div className="fw-semibold">{g.name}</div>
                        <div className="small text-muted">@{g.username}</div>
                      </td>
                      <td className="small">
                        <div>{g.email || '-'}</div>
                        <div className="text-muted">{g.phone || '-'}</div>
                      </td>
                      <td className="text-center">{g.completed_stays}</td>
                      <td className="text-center">{g.total_bookings}</td>
                      <td>{money(g.total_spent)}</td>
                      <td className="text-nowrap">{g.last_stay || '-'}</td>
                      <td><TierBadge tier={g.tier} /></td>
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
