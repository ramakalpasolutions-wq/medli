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
const ACCESS_KEY  = 'medli_access'
const REFRESH_KEY = 'medli_refresh'

// ─── Role → dashboard mapping ──────────────────────────────────────────────
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

// ─── Storage helpers ───────────────────────────────────────────────────────
function safeStorage(type) {
  try {
    return type === 'session' ? sessionStorage : localStorage
  } catch {
    return null
  }
}

function getCachedUser() {
  try {
    const raw = safeStorage('session')?.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.id || !parsed?.role) return null
    return parsed
  } catch { return null }
}

function setCachedUser(user) {
  try {
    const s = safeStorage('session')
    if (!s) return
    if (user?.id && user?.role) {
      s.setItem(SESSION_KEY, JSON.stringify(user))
    } else {
      s.removeItem(SESSION_KEY)
    }
  } catch {}
}

function clearAllAuth() {
  try {
    safeStorage('session')?.removeItem(SESSION_KEY)
    safeStorage('local')?.removeItem(ACCESS_KEY)
    safeStorage('local')?.removeItem(REFRESH_KEY)
  } catch {}
}

function getLS(key) {
  try { return safeStorage('local')?.getItem(key) ?? null }
  catch { return null }
}

function setLS(key, val) {
  try {
    const s = safeStorage('local')
    if (!s) return
    if (val) s.setItem(key, val)
    else     s.removeItem(key)
  } catch {}
}

function hasStoredTokens() {
  return !!(getLS(ACCESS_KEY) || getLS(REFRESH_KEY))
}

// ─── Provider ──────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  // ✅ Start as true only if we KNOW there are tokens
  // This prevents the loading flash and redirect loop
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const refreshingRef  = useRef(false)
  const initDoneRef    = useRef(false)
  const fetchingRef    = useRef(false)   // ✅ prevent concurrent /me calls

  // ── Silent token refresh ─────────────────────────────────────────────────
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
      if (!res.ok) return null

      const json = await res.json()
      if (json.success && json.data?.accessToken) {
        setLS(ACCESS_KEY, json.data.accessToken)
        if (json.data.refreshToken) {
          setLS(REFRESH_KEY, json.data.refreshToken)
        }
        return json.data.accessToken
      }
      return null
    } catch { return null }
    finally   { refreshingRef.current = false }
  }, [])

  // ── Fetch user from /api/auth/me ─────────────────────────────────────────
  const fetchUser = useCallback(async (retried = false) => {
    // ✅ Prevent concurrent calls
    if (fetchingRef.current) return null
    fetchingRef.current = true

    try {
      const token   = getLS(ACCESS_KEY)
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        headers,
        // ✅ No-store prevents browser from caching auth responses
        cache: 'no-store',
      })

      // Token expired — try refresh once
      if (res.status === 401 && !retried) {
        const newToken = await silentRefresh()
        if (newToken) {
          fetchingRef.current = false
          return fetchUser(true)
        }
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
      // Network error — use cache
      const cached = getCachedUser()
      setUser(cached || null)
      setLoading(false)
      return cached || null
    } finally {
      fetchingRef.current = false
    }
  }, [silentRefresh])

  // ── Init on mount — runs ONCE ────────────────────────────────────────────
  useEffect(() => {
    // ✅ Strict mode runs effects twice in dev — guard against it
    if (initDoneRef.current) return
    initDoneRef.current = true
    setMounted(true)

    if (!hasStoredTokens()) {
      // No tokens at all — not logged in, stop loading immediately
      setUser(null)
      setLoading(false)
      return
    }

    // Have tokens — check cache first for instant UI
    const cached = getCachedUser()
    if (cached) {
      setUser(cached)
      setLoading(false)       // ✅ Don't block UI — verify silently
      fetchUser()             // background verify
    } else {
      fetchUser()             // must wait for server
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // ✅ Empty deps — runs once on mount only

  // ── Auto refresh every 12 min ────────────────────────────────────────────
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

  // ── Save auth data ────────────────────────────────────────────────────────
  const saveAuth = useCallback((u, accessToken, refreshToken) => {
    setLS(ACCESS_KEY,  accessToken  || null)
    setLS(REFRESH_KEY, refreshToken || null)
    setCachedUser(u)
    setUser(u)
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

  // ── OTP login ─────────────────────────────────────────────────────────────
  const loginWithOtp = useCallback(async (phone, otp, preloadedData = null) => {
    try {
      // Path A — preloaded (email OTP verified externally)
      if (preloadedData) {
        const { user: u, accessToken, refreshToken } = preloadedData
        saveAuth(u, accessToken, refreshToken)
        return { success: true, user: u }
      }

      // Path B — phone OTP via API
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

  // ── Refresh user ──────────────────────────────────────────────────────────
  const refreshUser = useCallback(() => fetchUser(), [fetchUser])

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