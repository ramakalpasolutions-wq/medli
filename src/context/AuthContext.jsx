// src/context/AuthContext.jsx
'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'

const AuthContext = createContext(null)

const SESSION_KEY = 'medli_user'
const ACCESS_KEY  = 'accessToken'
const REFRESH_KEY = 'refreshToken'

// ─── Role → dashboard mapping ─────────────────────────────────────────────────
export const ROLE_DASHBOARDS = {
  super_admin:      '/super-admin/dashboard',
  regional_manager: '/regional/dashboard',
  hospital_admin:   '/hospital-admin/dashboard',
  lab_admin:        '/lab-admin/dashboard',
  doctor:           '/doctor/dashboard',
  user:             '/user/dashboard',
}

export function getDashboardForRole(role) {
  return ROLE_DASHBOARDS[role] || '/user/dashboard'
}

// ─── Storage helpers (client-only, never called during SSR) ──────────────────
function getCachedUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.id || !parsed?.role) return null
    return parsed
  } catch { return null }
}

function setCachedUser(user) {
  try {
    if (user && user.id && user.role) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } else {
      sessionStorage.removeItem(SESSION_KEY)
    }
  } catch {}
}

function clearAllAuth() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  } catch {}
}

function getLS(key) {
  try { return localStorage.getItem(key) }
  catch { return null }
}

function setLS(key, val) {
  try {
    if (val) localStorage.setItem(key, val)
    else      localStorage.removeItem(key)
  } catch {}
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const refreshingRef = useRef(false)
  const initDoneRef   = useRef(false)

  // ── Silent token refresh ──────────────────────────────────────────────────
  const silentRefresh = useCallback(async () => {
    if (refreshingRef.current) return null
    refreshingRef.current = true
    try {
      const refreshToken = getLS(REFRESH_KEY)
      if (!refreshToken) return null

      const res  = await fetch('/api/auth/refresh-token', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ refreshToken }),
      })
      const json = await res.json()
      if (json.success && json.data?.accessToken) {
        setLS(ACCESS_KEY, json.data.accessToken)
        return json.data.accessToken
      }
      return null
    } catch { return null }
    finally   { refreshingRef.current = false }
  }, [])

  // ── Fetch & verify user from server ──────────────────────────────────────
  const fetchUser = useCallback(async (retried = false) => {
    try {
      const token   = getLS(ACCESS_KEY)
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        headers,
      })

      if (res.status === 401 && !retried) {
        const newToken = await silentRefresh()
        if (newToken) return fetchUser(true)
        clearAllAuth()
        setUser(null)
        setLoading(false)
        return null
      }

      if (!res.ok) {
        clearAllAuth()
        setUser(null)
        setLoading(false)
        return null
      }

      const json = await res.json()
      if (json.success && json.data) {
        setUser(json.data)
        setCachedUser(json.data)
        setLoading(false)
        return json.data
      }

      clearAllAuth()
      setUser(null)
      setLoading(false)
      return null
    } catch {
      // Network error — fall back to cache
      const cached = getCachedUser()
      if (cached) setUser(cached)
      else        setUser(null)
      setLoading(false)
      return null
    }
  }, [silentRefresh])

  // ── Init on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (initDoneRef.current) return
    initDoneRef.current = true
    setMounted(true)

    const hasToken = !!getLS(ACCESS_KEY) || !!getLS(REFRESH_KEY)

    if (hasToken) {
      const cached = getCachedUser()
      if (cached) {
        // Show cached instantly, verify in background
        setUser(cached)
        fetchUser()
      } else {
        fetchUser()
      }
    } else {
      clearAllAuth()
      setUser(null)
      setLoading(false)
    }
  }, [fetchUser])

  // ── Auto refresh every 12 min ─────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return
    const id = setInterval(() => {
      if (getLS(REFRESH_KEY)) {
        silentRefresh().then((token) => {
          if (token) fetchUser()
        })
      }
    }, 12 * 60 * 1000)
    return () => clearInterval(id)
  }, [mounted, silentRefresh, fetchUser])

  // ── Internal helper: save auth data to state + storage ───────────────────
  const saveAuth = useCallback((u, accessToken, refreshToken) => {
    setLS(ACCESS_KEY,  accessToken)
    setLS(REFRESH_KEY, refreshToken)
    setCachedUser(null)   // clear old session first
    setUser(u)
    setCachedUser(u)
  }, [])

  // ── Login with email/password ─────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    try {
      const res  = await fetch('/api/auth/login', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(credentials),
      })
      const json = await res.json()

      if (json.success) {
        const { accessToken, refreshToken, user: u } = json.data
        saveAuth(u, accessToken, refreshToken)
        return { success: true, user: u }
      }

      return { success: false, error: json.error || 'Login failed' }
    } catch {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }, [saveAuth])

  // ── OTP login (phone OTP via API) ─────────────────────────────────────────
  // Also accepts preloadedData for email OTP verified externally
  const loginWithOtp = useCallback(async (phone, otp, preloadedData = null) => {
    try {
      // ── Path A: preloaded data (email OTP verified on login page directly) ──
      if (preloadedData) {
        const { user: u, accessToken, refreshToken } = preloadedData
        saveAuth(u, accessToken, refreshToken)
        return { success: true, user: u }
      }

      // ── Path B: phone OTP verify via API ──────────────────────────────────
      const res  = await fetch('/api/auth/otp/verify', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ phone, otp }),
      })
      const json = await res.json()

      if (json.success) {
        const { accessToken, refreshToken, user: u } = json.data
        saveAuth(u, accessToken, refreshToken)
        return { success: true, user: u }
      }

      return { success: false, error: json.error || 'Invalid OTP' }
    } catch {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }, [saveAuth])

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method:      'POST',
        credentials: 'include',
      })
    } catch { /* ignore */ }
    finally {
      clearAllAuth()
      setUser(null)
    }
  }, [])

  // ── Refresh user from server ──────────────────────────────────────────────
  const refreshUser = useCallback(() => fetchUser(), [fetchUser])

  // ── Context value ─────────────────────────────────────────────────────────
  const value = {
    user,
    loading,
    mounted,
    login,
    loginWithOtp,
    logout,
    refreshUser,
    isAuthenticated:   !!user,
    isAdmin:           user?.role === 'super_admin',
    isLabAdmin:        user?.role === 'lab_admin',
    isHospitalAdmin:   user?.role === 'hospital_admin',
    isDoctor:          user?.role === 'doctor',
    isRegionalManager: user?.role === 'regional_manager',
    isUser:            user?.role === 'user',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext