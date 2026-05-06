'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setUser(json.data)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error('[AuthContext] fetchUser error:', err.message)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = useCallback(async (credentials) => {
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      })
      const json = await res.json()
      if (json.success) {
        setUser(json.data.user)
        return { success: true }
      } else {
        setError(json.error)
        return { success: false, error: json.error }
      }
    } catch (err) {
      const msg = 'Login failed. Please try again.'
      setError(msg)
      return { success: false, error: msg }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.error('[AuthContext] logout error:', err.message)
    } finally {
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(() => {
    return fetchUser()
  }, [fetchUser])

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'super_admin',
    isLabAdmin: user?.role === 'lab_admin',
    isHospitalAdmin: user?.role === 'hospital_admin',
    isDoctor: user?.role === 'doctor',
    isRegionalManager: user?.role === 'regional_manager',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

export default AuthContext