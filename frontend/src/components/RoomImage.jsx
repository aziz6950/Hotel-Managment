import { useState } from 'react'
import { roomIcon, roomTheme } from '../utils'

// Chhobi load na hole broken image na dekhiye gradient + icon dekhabe
export default function RoomImage({ src, alt = '', typeId = 0, typeName = '', className = '' }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="room-fallback" style={{ background: roomTheme(typeId) }}>
        <i className={`bi ${roomIcon(typeName)}`}></i>
      </div>
    )
  }

  return (
    <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />
  )
}
