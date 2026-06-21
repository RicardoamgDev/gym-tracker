import axios from 'axios'
import { BASE_URL } from '../constants/baseUrl'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { Accept: 'application/json' },
})

// Adjunta el token Bearer en cada petición
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el token expira/invalida -> limpiar y redirigir a login
axiosInstance.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      if (location.pathname !== '/login') location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default axiosInstance
