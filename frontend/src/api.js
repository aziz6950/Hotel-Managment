import axios from 'axios'

const API = axios.create({ baseURL: import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000/api' })

// Prottek request e token auto lagiye dey
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Token expire hole auto logout
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('access')) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default API
