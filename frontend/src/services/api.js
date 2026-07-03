import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

/* Adjunta el token a cada petición */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cat_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/* Sesión expirada → limpiar y volver al login */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      localStorage.removeItem('cat_token')
      localStorage.removeItem('cat_user')
      localStorage.removeItem('cat_store')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
