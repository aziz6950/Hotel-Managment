import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  const isStaff = user && (user.role === 'admin' || user.role === 'receptionist')
  const linkClass = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`

  // About / Contact: Home page e thakle smooth scroll, onno page e thakle Home e niye jabe
  const goTo = (id) => (e) => {
    close()
    if (location.pathname === '/') {
      e.preventDefault()
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleLogout = () => {
    close()
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar navbar-expand-xl navbar-dark navbar-hotel sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/" onClick={close}>
          <i className="bi bi-building text-gold me-2"></i>Grand Resort
        </Link>
        <button className="navbar-toggler" type="button" aria-label="Toggle navigation"
                onClick={() => setOpen(!open)}>
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto mb-2 mb-xl-0">
            <li className="nav-item">
              <NavLink className={linkClass} to="/" end onClick={close}>Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/rooms" onClick={close}>Rooms</NavLink>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/#about" onClick={goTo('about')}>About</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/#contact" onClick={goTo('contact')}>Contact</Link>
            </li>
            {user && (
              <>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/dashboard" onClick={close}>Dashboard</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/my-bookings" onClick={close}>
                    {isStaff ? 'All Bookings' : 'My Bookings'}
                  </NavLink>
                </li>
              </>
            )}
            {user && !isStaff && (
              <li className="nav-item">
                <NavLink className={linkClass} to="/profile" onClick={close}>My Profile</NavLink>
              </li>
            )}
            {isStaff && (
              <>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/manage-rooms" onClick={close}>Manage Rooms</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/guests" onClick={close}>Guests</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/feedback" onClick={close}>Reviews</NavLink>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex flex-column flex-xl-row align-items-xl-center gap-2">
            {user ? (
              <>
                <span className="text-white small d-flex align-items-center gap-2">
                  <i className="bi bi-person-circle fs-5"></i>
                  {user.username}
                  <span className="badge bg-secondary text-capitalize">{user.role}</span>
                </span>
                <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-1"></i>Logout
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-outline-light btn-sm" to="/login" onClick={close}>Login</Link>
                <Link className="btn btn-gold btn-sm" to="/register" onClick={close}>Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
