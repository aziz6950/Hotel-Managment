import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import API from '../api'

export default function BookRoom() {
  const { roomId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const [room, setRoom] = useState(null)
  const [form, setForm] = useState({
    check_in: params.get('check_in') || '',
    check_out: params.get('check_out') || '',
    guests_count: params.get('guests') || 1,
  })
  const [quote, setQuote] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    API.get(`/rooms/${roomId}/`)
      .then((res) => setRoom(res.data))
      .catch(() => setError('Room not found'))
  }, [roomId])

  // Date change hole auto price quote ane
  useEffect(() => {
    if (!form.check_in || !form.check_out) return
    API.get('/price-quote/', {
      params: { room: roomId, check_in: form.check_in, check_out: form.check_out },
    })
      .then((res) => setQuote(res.data))
      .catch(() => setQuote(null))
  }, [roomId, form.check_in, form.check_out])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await API.post('/bookings/', {
        room: Number(roomId),
        check_in: form.check_in,
        check_out: form.check_out,
        guests_count: Number(form.guests_count),
      })
      navigate(`/invoice/${res.data.id}`)
    } catch (err) {
      const data = err.response?.data
      setError(data ? Object.values(data).flat().join(' ') : 'Booking failed. Please try again.')
    }
  }

  if (!room) return <div className="container mt-4">{error || 'Loading...'}</div>

  return (
    <div className="container mt-4" style={{ maxWidth: 700 }}>
      <h3>Book Room {room.room_number}</h3>
      <p className="text-muted">
        {room.type_name} · Floor {room.floor} · Capacity {room.capacity} guests · ৳ {room.base_price} / night (base rate)
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="row g-3">
        <div className="col-md-5">
          <label className="form-label">Check-in</label>
          <input type="date" className="form-control" name="check_in"
                 value={form.check_in} onChange={handleChange} required />
        </div>
        <div className="col-md-5">
          <label className="form-label">Check-out</label>
          <input type="date" className="form-control" name="check_out"
                 value={form.check_out} onChange={handleChange} required />
        </div>
        <div className="col-md-2">
          <label className="form-label">Guests</label>
          <input type="number" min="1" max={room.capacity} className="form-control"
                 name="guests_count" value={form.guests_count} onChange={handleChange} />
        </div>

        {form.check_in && form.check_out && quote && (
          <div className="col-12">
            <div className="card">
              <div className="card-header">Price breakdown</div>
              <table className="table mb-0">
                <thead>
                  <tr><th>Night</th><th>Note</th><th className="text-end">Price</th></tr>
                </thead>
                <tbody>
                  {quote.nights.map((n) => (
                    <tr key={n.date}>
                      <td>{n.date}</td>
                      <td>{n.note}</td>
                      <td className="text-end">৳ {n.price}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="fw-bold">
                    <td colSpan="2">Room total (excl. VAT)</td>
                    <td className="text-end">৳ {quote.total}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <div className="col-12">
          <button className="btn btn-primary">Confirm Booking</button>
        </div>
      </form>
    </div>
  )
}
