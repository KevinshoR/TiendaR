import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('cat_token')
    const u = localStorage.getItem('cat_user')
    const s = localStorage.getItem('cat_store')
    if (token && u) {
      setUser(JSON.parse(u))
      if (s) setStore(JSON.parse(s))
    }
    setLoading(false)
  }, [])

  function guardar({ token, user, store }) {
    localStorage.setItem('cat_token', token)
    localStorage.setItem('cat_user', JSON.stringify(user))
    localStorage.setItem('cat_store', JSON.stringify(store))
    setUser(user)
    setStore(store)
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    guardar(data)
    return data
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload)
    guardar(data)
    return data
  }

  function updateStore(nuevo) {
    localStorage.setItem('cat_store', JSON.stringify(nuevo))
    setStore(nuevo)
  }

  function logout() {
    localStorage.removeItem('cat_token')
    localStorage.removeItem('cat_user')
    localStorage.removeItem('cat_store')
    setUser(null)
    setStore(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, store, login, register, logout, updateStore, loading, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
