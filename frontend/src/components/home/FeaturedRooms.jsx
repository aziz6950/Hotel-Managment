import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../../api'
import RoomCard from '../RoomCard'

export default function FeaturedRooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/rooms/')
      .then((res) => {
        const available = res.data.filter((r) => r.status === 'available')
        const picks = []
        const seenTypes = new Set()

        // Age protiti room type theke ekta kore
        for (const r of available) {
          if (picks.length < 3 && !seenTypes.has(r.room_type)) {
            seenTypes.add(r.room_type)
            picks.push(r)
          }
        }
        // 3 ta na hole baki room diye bhorti
        for (const r of available) {
          if (picks.length < 3 && !picks.includes(r)) picks.push(r)
        }
        setRooms(picks)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="py-5 bg-white">
      <div className="container">
        <div className="section-title">
          <div className="eyebrow">Stay with us</div>
          <h2>Featured Rooms</h2>
          <p className="text-muted mb-0">Hand-picked rooms for a comfortable stay</p>
        </div>

        {loading && (
          <div className="text-center"><div className="spinner-border text-warning"></div></div>
        )}

        {!loading && rooms.length === 0 && (
          <p className="text-center text-muted">Rooms will appear here soon.</p>
        )}

        <div className="row g-4">
          {rooms.map((room) => (
            <div className="col-12 col-md-6 col-lg-4" key={room.id}>
              <RoomCard room={room} bookLink={`/book/${room.id}`} />
            </div>
          ))}
        </div>

        <div className="text-center mt-4">
          <Link to="/rooms" className="btn btn-navy">
            View all rooms <i className="bi bi-arrow-right ms-1"></i>
          </Link>
        </div>
      </div>
    </section>
  )
}
