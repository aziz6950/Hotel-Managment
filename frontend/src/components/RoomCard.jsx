import { Link } from 'react-router-dom'
import RoomImage from './RoomImage'
import { getGallery, getRoomContent } from '../roomContent'
import { money } from '../utils'

export default function RoomCard({ room, bookLink }) {
  const unavailable = room.status !== 'available'
  const content = getRoomContent(room.type_name)
  const photo = getGallery(content, room.id, room.room_number)[0]

  // /book/3?check_in=... -> /rooms/3?check_in=... (selected date details page e-o jabe)
  const detailsLink = bookLink.replace('/book/', '/rooms/')

  return (
    <div className="card room-card h-100">
      <Link to={detailsLink} className="room-visual">
        <RoomImage
          key={photo}
          src={photo}
          alt={`${room.type_name} room ${room.room_number}`}
          typeId={room.room_type}
          typeName={room.type_name}
          className="room-img"
        />
        <span className="room-number">Room {room.room_number}</span>
      </Link>

      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <h5 className="mb-0">
            <Link to={detailsLink} className="room-title-link">{room.type_name}</Link>
          </h5>
          {unavailable && <span className="badge bg-secondary">Maintenance</span>}
        </div>
        <p className="text-muted small mb-2">
          <i className="bi bi-people me-1"></i>Up to {room.capacity} guests
          <span className="mx-2">·</span>
          <i className="bi bi-building me-1"></i>Floor {room.floor}
        </p>

        <div className="d-flex flex-wrap gap-1 mb-3">
          {content.amenities.slice(0, 3).map((a) => (
            <span className="amenity-chip" key={a.label}>
              <i className={`bi ${a.icon} me-1`}></i>{a.label}
            </span>
          ))}
        </div>

        <div className="mt-auto d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="room-price">
            {money(room.base_price)}<small> / night</small>
          </div>
          <div className="d-flex gap-2">
            <Link className="btn btn-outline-dark btn-sm" to={detailsLink}>Details</Link>
            {unavailable ? (
              <button className="btn btn-secondary btn-sm" disabled>Unavailable</button>
            ) : (
              <Link className="btn btn-gold btn-sm" to={bookLink}>Book now</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
