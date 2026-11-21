import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate(from ? `${from.pathname}${from.search}` : '/dashboard', { replace: true })
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <div className="container" style={{ maxWidth: 440 }}>
        <div className="card auth-card shadow-lg">
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-4">
              <i className="bi bi-building text-gold" style={{ fontSize: '2.5rem' }}></i>
              <h3 className="fw-bold mt-2 mb-1">Welcome back</h3>
              <p className="text-muted mb-0">Login to manage your bookings</p>
            </div>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="input-group mb-3">
                <span className="input-group-text"><i className="bi bi-person"></i></span>
                <input className="form-control" name="username" placeholder="Username"
                       value={form.username} onChange={handleChange} required />
              </div>
              <div className="input-group mb-4">
                <span className="input-group-text"><i className="bi bi-lock"></i></span>
                <input className="form-control" type="password" name="password" placeholder="Password"
                       value={form.password} onChange={handleChange} required />
              </div>
              <button className="btn btn-gold btn-lg w-100" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <p className="mt-4 mb-0 text-center text-muted">
              Don’t have an account? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
