import { useEffect, useState } from 'react'
import API from '../api'
import { TierBadge } from '../components/Crm'
import { money } from '../utils'

export default function Profile() {
  const [data, setData] = useState(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', address: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const fill = (d) => setForm({
    first_name: d.first_name, last_name: d.last_name, email: d.email,
    phone: d.phone, address: d.address,
  })

  useEffect(() => {
    API.get('/crm/me/')
      .then((res) => { setData(res.data); fill(res.data) })
      .catch(() => setError('Could not load your profile'))
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    try {
      const res = await API.patch('/crm/me/', form)
      setData(res.data)
      setMessage('Profile updated ✅')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update profile')
    } finally {
      setSaving(false)
    }
  }

  if (!data) {
    return <div className="container mt-4">{error || 'Loading...'}</div>
  }

  const name = `${data.first_name} ${data.last_name}`.trim() || data.username
  const nt = data.next_tier
  const pct = nt ? Math.round((data.completed_stays * 100) / (data.completed_stays + nt.stays_needed)) : 100

  return (
    <>
      <div className="page-banner">
        <div className="container">
          <h2 className="mb-1">My Profile</h2>
          <p className="mb-0 opacity-75">Manage your details and see your loyalty status</p>
        </div>
      </div>

      <div className="container py-4">
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="card text-center">
              <div className="card-body p-4">
                <div className="profile-avatar">{name.charAt(0).toUpperCase()}</div>
                <h4 className="mb-1">{name}</h4>
                <p className="text-muted mb-2">@{data.username}</p>
                <TierBadge tier={data.tier} />
                <p className="text-muted small mt-3 mb-0">Member since {data.member_since}</p>

                <hr />
                <div className="row g-2 text-center">
                  <div className="col-4">
                    <div className="fw-bold fs-5">{data.total_bookings}</div>
                    <div className="small text-muted">Bookings</div>
                  </div>
                  <div className="col-4">
                    <div className="fw-bold fs-5">{data.completed_stays}</div>
                    <div className="small text-muted">Stays</div>
                  </div>
                  <div className="col-4">
                    <div className="fw-bold fs-6 pt-1">{money(data.total_spent)}</div>
                    <div className="small text-muted">Spent</div>
                  </div>
                </div>

                <hr />
                {nt ? (
                  <div className="text-start">
                    <div className="small mb-1">
                      <b>{nt.stays_needed}</b> more stay{nt.stays_needed > 1 ? 's' : ''} to reach <b>{nt.name}</b>
                    </div>
                    <div className="progress" style={{ height: 8 }}>
                      <div className="progress-bar bg-warning" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <p className="small text-success mb-0">
                    <i className="bi bi-stars me-1"></i>You have reached our top tier. Thank you!
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <form className="card" onSubmit={handleSave}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3">Personal details</h5>
                {error && <div className="alert alert-danger py-2">{error}</div>}
                {message && <div className="alert alert-success py-2">{message}</div>}

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">First name</label>
                    <input className="form-control" name="first_name" value={form.first_name} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Last name</label>
                    <input className="form-control" name="last_name" value={form.last_name} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone</label>
                    <input className="form-control" name="phone" value={form.phone} onChange={handleChange} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Address</label>
                    <textarea className="form-control" rows="2" name="address" value={form.address} onChange={handleChange} />
                  </div>
                </div>

                <button className="btn btn-gold mt-4" disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
