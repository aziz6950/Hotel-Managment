import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import API from '../api'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await API.post('/auth/register/', form)
      navigate('/login')
    } catch (err) {
      const data = err.response?.data
      setError(data ? Object.values(data).flat().join(' ') : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <div className="container" style={{ maxWidth: 460 }}>
        <div className="card auth-card shadow-lg">
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-4">
              <i className="bi bi-person-plus text-gold" style={{ fontSize: '2.5rem' }}></i>
              <h3 className="fw-bold mt-2 mb-1">Create your account</h3>
              <p className="text-muted mb-0">Register to book rooms online</p>
            </div>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="input-group mb-3">
                <span className="input-group-text"><i className="bi bi-person"></i></span>
                <input className="form-control" name="username" placeholder="Username"
                       value={form.username} onChange={handleChange} required />
              </div>
              <div className="input-group mb-3">
                <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                <input className="form-control" type="email" name="email" placeholder="Email"
                       value={form.email} onChange={handleChange} required />
              </div>
              <div className="input-group mb-3">
                <span className="input-group-text"><i className="bi bi-telephone"></i></span>
                <input className="form-control" name="phone" placeholder="Phone (optional)"
                       value={form.phone} onChange={handleChange} />
              </div>
              <div className="input-group mb-4">
                <span className="input-group-text"><i className="bi bi-lock"></i></span>
                <input className="form-control" type="password" name="password" placeholder="Password"
                       value={form.password} onChange={handleChange} required />
              </div>
              <button className="btn btn-gold btn-lg w-100" disabled={loading}>
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </form>
            <p className="mt-4 mb-0 text-center text-muted">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
