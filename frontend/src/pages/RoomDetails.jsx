import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import API from '../api'
import RoomCard from '../components/RoomCard'
import RoomImage from '../components/RoomImage'
import { getGallery, getRoomContent } from '../roomContent'
import { money } from '../utils'

const POLICIES = [
  { icon: 'bi-arrow-repeat', text: 'Free cancellation any time before check-in' },
  { icon: 'bi-credit-card', text: 'Pay by cash, card or mobile banking, in full or in parts' },
  { icon: 'bi-receipt', text: 'All dues must be cleared before check-out' },
  { icon: 'bi-people', text: 'Number of guests cannot exceed the room capacity' },
]

export default function RoomDetails() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]

  const [room, setRoom] = useState(null)
  const [roomType, setRoomType] = useState(null)
  const [others, setOthers] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [active, setActive] = useState(0)

  const [form, setForm] = useState({
    check_in: params.get('check_in') || '',
    check_out: params.get('check_out') || '',
    guests: params.get('guests') || '1',
  })
  const [quote, setQuote] = useState(null)
  const [available, setAvailable] = useState(null)

  // Room + room type + similar rooms load
  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    setActive(0)

    API.get(`/rooms/${id}/`)
      .then(async (res) => {
        const r = res.data
        setRoom(r)
        try {
          const [types, all] = await Promise.all([API.get('/room-types/'), API.get('/rooms/')])
          setRoomType(types.data.find((t) => t.id === r.room_type) || null)
          const free = all.data.filter((x) => x.id !== r.id && x.status === 'available')
          const same = free.filter((x) => x.room_type === r.room_type)
          const rest = free.filter((x) => x.room_type !== r.room_type)
          setOthers([...same, ...rest].slice(0, 3))
        } catch {
          // optional data, page tabu cholbe
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  const nights = form.check_in && form.check_out
    ? Math.round((new Date(form.check_out) - new Date(form.check_in)) / 86400000)
    : 0
  const validDates = nights > 0

  // Date dile price quote + availability check
  useEffect(() => {
    if (!room || !validDates) return
    let cancelled = false

    API.get('/price-quote/', {
      params: { room: room.id, check_in: form.check_in, check_out: form.check_out },
    })
      .then((res) => { if (!cancelled) setQuote(res.data) })
      .catch(() => { if (!cancelled) setQuote(null) })

    API.get('/rooms/available/', {
      params: { check_in: form.check_in, check_out: form.check_out, guests: form.guests || 1 },
    })
      .then((res) => { if (!cancelled) setAvailable(res.data.some((r) => r.id === room.id)) })
      .catch(() => { if (!cancelled) setAvailable(null) })

    return () => { cancelled = true }
  }, [room, validDates, form.check_in, form.check_out, form.guests])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  if (loading) {
    return (
      <div className="text-center py-5 my-5">
        <div className="spinner-border text-warning"></div>
      </div>
    )
  }

  if (notFound || !room) {
    return (
      <div className="container text-center py-5 my-5">
        <i className="bi bi-emoji-frown fs-1 text-muted"></i>
        <h4 className="mt-3">Room not found</h4>
        <Link to="/rooms" className="btn btn-gold mt-2">Browse all rooms</Link>
      </div>
    )
  }

  const content = getRoomContent(room.type_name)
  const gallery = getGallery(content, room.id, room.room_number).slice(0, 5)
  const mainPhoto = gallery[active] || gallery[0]
  const maintenance = room.status !== 'available'
  const overCapacity = Number(form.guests) > room.capacity
  const notFree = validDates && available === false
  const blocked = maintenance || overCapacity || notFree

  const highlights = [
    { icon: 'bi-aspect-ratio', label: 'Room size', value: content.size },
    { icon: 'bi-moon-stars', label: 'Bed', value: content.bed },
    { icon: 'bi-people', label: 'Guests', value: `Up to ${room.capacity}` },
    { icon: 'bi-building', label: 'Floor', value: room.floor },
    { icon: 'bi-eye', label: 'View', value: content.view },
  ]

  const handleBook = () => {
    navigate(`/book/${room.id}?check_in=${form.check_in}&check_out=${form.check_out}&guests=${form.guests}`)
  }

  return (
    <>
      <div className="page-banner">
        <div className="container">
          <nav className="small mb-2">
            <Link to="/" className="text-white-50">Home</Link>
            <span className="mx-2 text-white-50">/</span>
            <Link to="/rooms" className="text-white-50">Rooms</Link>
            <span className="mx-2 text-white-50">/</span>
            <span>Room {room.room_number}</span>
          </nav>
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
            <div>
              <h2 className="mb-1">{room.type_name} · Room {room.room_number}</h2>
              <p className="mb-0 opacity-75">{content.tagline}</p>
            </div>
            <div className="text-lg-end">
              <div className="small opacity-75">Starting from</div>
              <div className="fs-3 fw-bold text-gold">
                {money(room.base_price)}<small className="fs-6 text-white-50"> / night</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <button className="btn btn-link text-decoration-none px-0 mb-2" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-1"></i>Back
        </button>

        {/* Photo gallery */}
        <div className="mb-4">
          <div className="room-gallery-main">
            <RoomImage
              key={mainPhoto}
              src={mainPhoto}
              alt={`${room.type_name} room ${room.room_number}`}
              typeId={room.room_type}
              typeName={room.type_name}
              className="room-gallery-img"
            />
            <span className={`gallery-status badge ${maintenance ? 'bg-secondary' : 'bg-success'}`}>
              {maintenance ? 'Under maintenance' : 'Available'}
            </span>
            {gallery.length > 0 && (
              <span className="gallery-count">
                <i className="bi bi-images me-1"></i>{active + 1} / {gallery.length}
              </span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="room-gallery-thumbs">
              {gallery.map((src, i) => (
                <button key={src} type="button" onClick={() => setActive(i)}
                        className={`room-thumb ${i === active ? 'active' : ''}`}
                        aria-label={`Show photo ${i + 1}`}>
                  <RoomImage key={src} src={src} alt="" typeId={room.room_type}
                             typeName={room.type_name} className="room-thumb-img" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="row g-4">
          {/* Booking card (mobile e gallery r niche-i dekhabe) */}
          <div className="col-lg-4 order-first order-lg-last">
            <div className="card booking-card">
              <div className="card-body p-4">
                <div className="d-flex align-items-baseline gap-2 mb-3">
                  <span className="room-price fs-3">{money(room.base_price)}</span>
                  <span className="text-muted">/ night</span>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Check-in</label>
                    <input type="date" className="form-control" name="check_in" min={today}
                           value={form.check_in} onChange={handleChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Check-out</label>
                    <input type="date" className="form-control" name="check_out"
                           min={form.check_in || today}
                           value={form.check_out} onChange={handleChange} />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Guests</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-people"></i></span>
                      <input type="number" min="1" className="form-control" name="guests"
                             value={form.guests} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                {maintenance && (
                  <div className="alert alert-secondary py-2 small">
                    <i className="bi bi-tools me-1"></i>This room is currently under maintenance.
                  </div>
                )}
                {overCapacity && (
                  <div className="alert alert-warning py-2 small">
                    <i className="bi bi-exclamation-triangle me-1"></i>This room fits up to {room.capacity} guests.
                  </div>
                )}
                {!maintenance && !overCapacity && validDates && available === true && (
                  <div className="alert alert-success py-2 small">
                    <i className="bi bi-check-circle me-1"></i>Available for your dates
                  </div>
                )}
                {!maintenance && !overCapacity && notFree && (
                  <div className="alert alert-danger py-2 small">
                    <i className="bi bi-x-circle me-1"></i>Not available for the selected dates.
                    <Link to="/rooms" className="ms-1">See other rooms</Link>
                  </div>
                )}

                {validDates && quote && (
                  <div className="mb-3">
                    <div className="small fw-semibold mb-1">Price for {nights} night{nights > 1 ? 's' : ''}</div>
                    <div className="quote-list">
                      {quote.nights.map((n) => (
                        <div key={n.date} className="d-flex justify-content-between small py-1 border-bottom">
                          <span>
                            {n.date}
                            {n.note !== 'normal' && <span className="text-muted"> · {n.note}</span>}
                          </span>
                          <span>{money(n.price)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="d-flex justify-content-between fw-bold mt-2">
                      <span>Room total</span>
                      <span>{money(quote.total)}</span>
                    </div>
                    <div className="text-muted small">15% VAT is added in your invoice.</div>
                  </div>
                )}

                <button className="btn btn-gold btn-lg w-100" disabled={blocked} onClick={handleBook}>
                  <i className="bi bi-calendar-check me-2"></i>Book this room
                </button>

                <ul className="list-unstyled small text-muted mt-3 mb-0">
                  <li className="mb-1"><i className="bi bi-check2 text-success me-2"></i>Free cancellation before check-in</li>
                  <li className="mb-1"><i className="bi bi-check2 text-success me-2"></i>Pay in full or in parts</li>
                  <li><i className="bi bi-check2 text-success me-2"></i>Instant online invoice</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="col-lg-8">
            <div className="highlight-grid mb-4">
              {highlights.map((h) => (
                <div className="highlight" key={h.label}>
                  <i className={`bi ${h.icon}`}></i>
                  <div className="small text-muted mt-1">{h.label}</div>
                  <div className="value">{h.value}</div>
                </div>
              ))}
            </div>

            <div className="card mb-4">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3">About this room</h5>
                <p className="text-muted mb-0">{roomType?.description || content.description}</p>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3">Room amenities</h5>
                <div className="amenity-grid">
                  {content.amenities.map((a) => (
                    <div className="amenity" key={a.label}>
                      <i className={`bi ${a.icon}`}></i>
                      <span>{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-body p-4">
                    <h5 className="fw-bold mb-3">How pricing works</h5>
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <span>Base rate</span><b>{money(room.base_price)}</b>
                    </div>
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <span>Friday &amp; Saturday nights</span><b>+20%</b>
                    </div>
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <span>Peak season (Dec – Jan)</span><b>+30%</b>
                    </div>
                    <div className="d-flex justify-content-between py-2">
                      <span>VAT (added to invoice)</span><b>15%</b>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-body p-4">
                    <h5 className="fw-bold mb-3">Booking policies</h5>
                    {POLICIES.map((p) => (
                      <div className="amenity mb-3" key={p.text}>
                        <i className={`bi ${p.icon}`}></i>
                        <span className="small">{p.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {others.length > 0 && (
          <div className="mt-4">
            <div className="section-title">
              <div className="eyebrow">More to explore</div>
              <h2>You may also like</h2>
            </div>
            <div className="row g-4">
              {others.map((r) => (
                <div className="col-12 col-md-6 col-lg-4" key={r.id}>
                  <RoomCard room={r} bookLink={`/book/${r.id}`} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
