import { useEffect, useState } from 'react'
import API from '../api'
import { money } from '../utils'

export default function ManageRooms() {
  const [rooms, setRooms] = useState([])
  const [types, setTypes] = useState([])
  const [roomForm, setRoomForm] = useState({ room_number: '', room_type: '', floor: 1 })
  const [typeForm, setTypeForm] = useState({ name: '', base_price: '', capacity: 2, description: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = () =>
    Promise.all([API.get('/rooms/'), API.get('/room-types/')]).then(([r, t]) => {
      setRooms(r.data)
      setTypes(t.data)
    })

  useEffect(() => {
    load()
  }, [])

  const fail = (err) => {
    setMessage('')
    const data = err.response?.data
    setError(data ? Object.values(data).flat().join(' ') : 'Something went wrong')
  }

  const done = (text) => {
    setError('')
    setMessage(text)
    load()
  }

  const addRoom = async (e) => {
    e.preventDefault()
    try {
      await API.post('/rooms/', {
        room_number: roomForm.room_number,
        room_type: Number(roomForm.room_type),
        floor: Number(roomForm.floor),
        status: 'available',
      })
      setRoomForm({ room_number: '', room_type: roomForm.room_type, floor: roomForm.floor })
      done('Room added ✅')
    } catch (err) {
      fail(err)
    }
  }

  const addType = async (e) => {
    e.preventDefault()
    try {
      await API.post('/room-types/', { ...typeForm, capacity: Number(typeForm.capacity) })
      setTypeForm({ name: '', base_price: '', capacity: 2, description: '' })
      done('Room type added ✅')
    } catch (err) {
      fail(err)
    }
  }

  const changeStatus = async (id, status) => {
    try {
      await API.patch(`/rooms/${id}/`, { status })
      done('Room status updated ✅')
    } catch (err) {
      fail(err)
    }
  }

  return (
    <>
      <div className="page-banner">
        <div className="container">
          <h2 className="mb-1">Manage Rooms</h2>
          <p className="mb-0 opacity-75">Add rooms and room types, or put a room under maintenance.</p>
        </div>
      </div>

      <div className="container py-4">
        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card overflow-hidden">
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr><th>Room</th><th>Type</th><th>Floor</th><th>Base price</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {rooms.map((r) => (
                      <tr key={r.id}>
                        <td className="fw-semibold">{r.room_number}</td>
                        <td>{r.type_name}</td>
                        <td>{r.floor}</td>
                        <td>{money(r.base_price)}</td>
                        <td style={{ minWidth: 150 }}>
                          <select className="form-select form-select-sm" value={r.status}
                                  onChange={(e) => changeStatus(r.id, e.target.value)}>
                            <option value="available">Available</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-lg-4 d-flex flex-column gap-4">
            <form className="card card-body" onSubmit={addRoom}>
              <h5 className="mb-3">Add room</h5>
              <input className="form-control mb-2" placeholder="Room number (e.g. 305)" required
                     value={roomForm.room_number}
                     onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })} />
              <select className="form-select mb-2" required value={roomForm.room_type}
                      onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })}>
                <option value="">Select room type</option>
                {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input type="number" min="1" className="form-control mb-3" placeholder="Floor"
                     value={roomForm.floor}
                     onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })} />
              <button className="btn btn-navy">Add room</button>
            </form>

            <form className="card card-body" onSubmit={addType}>
              <h5 className="mb-3">Add room type</h5>
              <input className="form-control mb-2" placeholder="Name (e.g. Deluxe)" required
                     value={typeForm.name}
                     onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} />
              <input type="number" min="1" step="0.01" className="form-control mb-2"
                     placeholder="Base price per night" required value={typeForm.base_price}
                     onChange={(e) => setTypeForm({ ...typeForm, base_price: e.target.value })} />
              <input type="number" min="1" className="form-control mb-2" placeholder="Capacity"
                     value={typeForm.capacity}
                     onChange={(e) => setTypeForm({ ...typeForm, capacity: e.target.value })} />
              <textarea className="form-control mb-3" rows="2" placeholder="Description (optional)"
                        value={typeForm.description}
                        onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} />
              <button className="btn btn-navy">Add room type</button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
