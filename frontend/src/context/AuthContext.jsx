import { createContext, useContext, useEffect, useState } from 'react'
import { Auth } from '../api/client.js'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    Auth.me()
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (credentials) => {
    const { user, token } = await Auth.login(credentials)
    localStorage.setItem('token', token)
    setUser(user)
  }

  const register = async (data) => {
    const { user, token } = await Auth.register(data)
    localStorage.setItem('token', token)
    setUser(user)
  }

  const logout = async () => {
    try { await Auth.logout() } catch (_) {}
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
