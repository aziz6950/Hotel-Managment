import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import API from '../api'
import RoomCard from '../components/RoomCard'

export default function Rooms() {
  const [params, setParams] = useSearchParams()
  const check_in = params.get('check_in') || ''
  const check_out = params.get('check_out') || ''
  const guests = params.get('guests') || '1'
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({ check_in, check_out, guests })
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [type, setType] = useState('all')
  const [sort, setSort] = useState('price_asc')

  useEffect(() => {
    setLoading(true)
    setError('')
    const request = check_in && check_out
      ? API.get('/rooms/available/', { params: { check_in, check_out, guests } })
      : API.get('/rooms/')

    request
      .then((res) => setRooms(res.data))
      .catch((err) => {
        setRooms([])
        setError(err.response?.data?.error || 'Could not load rooms')
      })
      .finally(() => setLoading(false))
  }, [check_in, check_out, guests])

  const types = useMemo(() => [...new Set(rooms.map((r) => r.type_name))], [rooms])

  const visible = useMemo(() => {
    const list = rooms.filter((r) => type === 'all' || r.type_name === type)
    return [...list].sort((a, b) =>
      sort === 'price_asc'
        ? Number(a.base_price) - Number(b.base_price)
        : Number(b.base_price) - Number(a.base_price))
  }, [rooms, type, sort])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSearch = (e) => {
    e.preventDefault()
    setParams({ check_in: form.check_in, check_out: form.check_out, guests: form.guests })
  }

  const clearSearch = () => {
    setForm({ check_in: '', check_out: '', guests: '1' })
    setParams({})
  }

  const searching = check_in && check_out

  return (
    <>
      <div className="page-banner">
        <div className="container">
          <h2 className="mb-1">Our Rooms</h2>
          <p className="mb-0 opacity-75">
            {searching ? `Available from ${check_in} to ${check_out}` : 'Browse all rooms or search by date'}
          </p>
        </div>
      </div>

      <div className="container py-4">
        <form className="card card-body mb-4" onSubmit={handleSearch}>
          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-3">
              <label className="form-label fw-semibold">Check-in</label>
              <input type="date" className="form-control" name="check_in" min={today}
                     value={form.check_in} onChange={handleChange} required />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label fw-semibold">Check-out</label>
              <input type="date" className="form-control" name="check_out" min={form.check_in || today}
                     value={form.check_out} onChange={handleChange} required />
            </div>
            <div className="col-4 col-md-2">
              <label className="form-label fw-semibold">Guests</label>
              <input type="number" min="1" className="form-control" name="guests"
                     value={form.guests} onChange={handleChange} />
            </div>
            <div className="col-8 col-md-4 d-flex gap-2">
              <button className="btn btn-gold flex-fill">
                <i className="bi bi-search me-1"></i>Search
              </button>
              {searching && (
                <button type="button" className="btn btn-outline-secondary" onClick={clearSearch}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <span className="text-muted">
            {loading ? 'Loading...' : `${visible.length} room${visible.length === 1 ? '' : 's'} found`}
          </span>
          <div className="d-flex gap-2">
            <select className="form-select form-select-sm" value={type}
                    onChange={(e) => setType(e.target.value)}>
              <option value="all">All types</option>
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="form-select form-select-sm" value={sort}
                    onChange={(e) => setSort(e.target.value)}>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-warning"></div>
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="text-center text-muted py-5">
            <i className="bi bi-emoji-frown fs-1"></i>
            <p className="mt-2">No rooms available for these dates. Try different dates.</p>
          </div>
        )}

        <div className="row g-4">
          {visible.map((room) => (
            <div className="col-12 col-sm-6 col-lg-4" key={room.id}>
              <RoomCard
                room={room}
                bookLink={`/book/${room.id}?check_in=${check_in}&check_out=${check_out}&guests=${guests}`}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
