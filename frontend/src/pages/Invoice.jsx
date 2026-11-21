import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import API from '../api'
import { useAuth } from '../AuthContext'

// Staff kon status theke kon status e jete pare
const NEXT_STATUS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled'],
  checked_in: ['checked_out'],
}

export default function Invoice() {
  const { id } = useParams()
  const { user } = useAuth()
  const isStaff = user.role === 'admin' || user.role === 'receptionist'

  const [inv, setInv] = useState(null)
  const [services, setServices] = useState([])
  const [pay, setPay] = useState({ amount: '', method: 'cash' })
  const [svc, setSvc] = useState({ service: '', quantity: 1 })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadInvoice = () =>
    API.get(`/bookings/${id}/invoice/`)
      .then((res) => setInv(res.data))
      .catch(() => setError('Invoice not found'))

  useEffect(() => {
    loadInvoice()
    if (isStaff) API.get('/services/').then((res) => setServices(res.data))
    // eslint-disable-next-line
  }, [id])

  const showError = (err) => {
    setMessage('')
    setError(err.response?.data?.error || err.response?.data?.detail || 'Something went wrong')
  }

  const handlePay = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await API.post(`/bookings/${id}/pay/`, pay)
      setInv(res.data)
      setPay({ ...pay, amount: '' })
      setMessage('Payment successful ✅')
    } catch (err) {
      showError(err)
    }
  }

  const handleAddService = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await API.post(`/bookings/${id}/add-service/`, svc)
      setInv(res.data)
      setMessage('Service added ✅')
    } catch (err) {
      showError(err)
    }
  }

  const handleStatus = async (status) => {
    setError('')
    try {
      await API.post(`/bookings/${id}/set-status/`, { status })
      await loadInvoice()
      setMessage(`Status updated: ${status} ✅`)
    } catch (err) {
      showError(err)
    }
  }

  if (!inv) return <div className="container mt-4">{error || 'Loading...'}</div>

  const nextStatuses = NEXT_STATUS[inv.status] || []

  return (
    <div className="container mt-4" style={{ maxWidth: 800 }}>
      <Link to="/my-bookings" className="no-print">← Back to bookings</Link>
      <div className="d-flex justify-content-between align-items-center mt-2 mb-3">
        <h3 className="mb-0">Invoice · Booking #{inv.booking_id}</h3>
        <button className="btn btn-outline-dark btn-sm no-print" onClick={() => window.print()}>
          <i className="bi bi-printer me-1"></i>Print / Save PDF
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="card mb-3">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-1"><b>Guest:</b> {inv.guest}</p>
              <p className="mb-1"><b>Room:</b> {inv.room}</p>
              <p className="mb-0"><b>Status:</b> <span className="badge bg-dark">{inv.status}</span></p>
            </div>
            <div className="col-md-6">
              <p className="mb-1"><b>Check-in:</b> {inv.check_in}</p>
              <p className="mb-1"><b>Check-out:</b> {inv.check_out}</p>
              <p className="mb-0"><b>Nights:</b> {inv.nights}</p>
            </div>
          </div>
        </div>
      </div>

      <table className="table">
        <tbody>
          <tr>
            <td>Room charge ({inv.nights} nights)</td>
            <td className="text-end">৳ {inv.room_total}</td>
          </tr>
          {inv.extra_services.map((s, i) => (
            <tr key={i}>
              <td>{s.service} × {s.quantity}</td>
              <td className="text-end">৳ {s.total}</td>
            </tr>
          ))}
          <tr>
            <td>Subtotal</td>
            <td className="text-end">৳ {inv.subtotal}</td>
          </tr>
          <tr>
            <td>VAT (15%)</td>
            <td className="text-end">৳ {inv.vat}</td>
          </tr>
          <tr className="fw-bold table-light">
            <td>Grand total</td>
            <td className="text-end">৳ {inv.grand_total}</td>
          </tr>
          <tr className="text-success">
            <td>Paid</td>
            <td className="text-end">৳ {inv.paid}</td>
          </tr>
          <tr className="fw-bold text-danger">
            <td>Due</td>
            <td className="text-end">৳ {inv.due}</td>
          </tr>
        </tbody>
      </table>

      {/* Payment form */}
      {inv.due > 0 && inv.status !== 'cancelled' && (
        <form className="card card-body mb-3 no-print" onSubmit={handlePay}>
          <h5>Make a Payment</h5>
          <div className="row g-2">
            <div className="col-md-5">
              <input type="number" step="0.01" min="1" className="form-control"
                     placeholder={`Amount (max ${inv.due})`} value={pay.amount}
                     onChange={(e) => setPay({ ...pay, amount: e.target.value })} required />
            </div>
            <div className="col-md-4">
              <select className="form-select" value={pay.method}
                      onChange={(e) => setPay({ ...pay, method: e.target.value })}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile">Mobile Banking</option>
              </select>
            </div>
            <div className="col-md-3">
              <button className="btn btn-success w-100">Pay</button>
            </div>
          </div>
        </form>
      )}

      {/* Staff panel */}
      {isStaff && (
        <div className="card border-dark mb-4 no-print">
          <div className="card-header bg-dark text-white">Staff Panel</div>
          <div className="card-body">
            <h6>Status change</h6>
            <div className="mb-3">
              {nextStatuses.length === 0 && <span className="text-muted">No further actions</span>}
              {nextStatuses.map((s) => (
                <button key={s} className="btn btn-outline-dark btn-sm me-2"
                        onClick={() => handleStatus(s)}>
                  → {s}
                </button>
              ))}
            </div>

            {inv.status !== 'cancelled' && inv.status !== 'checked_out' && (
              <>
                <h6>Add Extra Service</h6>
                <form className="row g-2" onSubmit={handleAddService}>
                  <div className="col-md-6">
                    <select className="form-select" value={svc.service}
                            onChange={(e) => setSvc({ ...svc, service: e.target.value })} required>
                      <option value="">Select a service</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} (৳ {s.price})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input type="number" min="1" className="form-control" value={svc.quantity}
                           onChange={(e) => setSvc({ ...svc, quantity: e.target.value })} />
                  </div>
                  <div className="col-md-3">
                    <button className="btn btn-dark w-100">Add</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
