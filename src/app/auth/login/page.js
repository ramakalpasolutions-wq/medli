// src/app/auth/login/page.js
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, getDashboardForRole } from '@/context/AuthContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Eye, EyeOff, Phone, Mail, ArrowRight, Lock } from 'lucide-react'

// ── Safe redirect helper ──────────────────────────────────────────────────────
function getSafeRedirect(role, redirectParam) {
  const defaultDash = getDashboardForRole(role)
  if (!redirectParam) return defaultDash

  const allowedPrefixes = {
    super_admin:      ['/super-admin'],
    regional_manager: ['/regional'],
    hospital_admin:   ['/hospital-admin'],
    lab_admin:        ['/lab-admin'],
    doctor:           ['/doctor'],
    user:             ['/user', '/hospitals', '/labs', '/doctors', '/search', '/'],
  }

  const prefixes = allowedPrefixes[role] || ['/']
  const safe     = prefixes.some((p) => redirectParam.startsWith(p))
  return safe ? redirectParam : defaultDash
}

// ── 6-digit OTP input boxes ───────────────────────────────────────────────────
function OtpBoxes({ value, onChange, idPrefix = 'otp' }) {
  const digits = value.padEnd(6, '').split('').slice(0, 6)

  const handleChange = (val, idx) => {
    const clean = val.replace(/\D/g, '').slice(-1)
    const next  = [...digits]
    next[idx]   = clean
    onChange(next.join(''))
    if (clean && idx < 5) {
      document.getElementById(`${idPrefix}-${idx + 1}`)?.focus()
    }
  }

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      document.getElementById(`${idPrefix}-${idx - 1}`)?.focus()
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      onChange(pasted)
      document.getElementById(`${idPrefix}-5`)?.focus()
    }
    e.preventDefault()
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          id={`${idPrefix}-${idx}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[idx] || ''}
          onChange={(e) => handleChange(e.target.value, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          className="w-12 h-12 text-center text-lg font-bold border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function LoginContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const {
    login,
    loginWithOtp,
    user,
    loading: authLoading,
  } = useAuth()

  const redirectParam = searchParams.get('redirect') || ''

  // 'phone' | 'email_otp' | 'email_pass'
  const [tab,       setTab]       = useState('phone')
  const [phone,     setPhone]     = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [phoneOtp,  setPhoneOtp]  = useState('')
  const [emailOtp,  setEmailOtp]  = useState('')
  const [otpSent,   setOtpSent]   = useState(false)
  const [sending,   setSending]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [countdown, setCountdown] = useState(0)

  // ── Redirect if already logged in ─────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(getSafeRedirect(user.role, redirectParam))
    }
  }, [user, authLoading, redirectParam, router])

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const resetOtpState = () => {
    setOtpSent(false)
    setPhoneOtp('')
    setEmailOtp('')
    setError('')
    setCountdown(0)
  }

  // ── Send OTP ──────────────────────────────────────────────────────────────
  const sendOtp = async () => {
    setSending(true)
    setError('')
    try {
      const body = tab === 'phone'
        ? { phone: phone.replace(/\D/g, '') }
        : { email: email.trim().toLowerCase() }

      const res  = await fetch('/api/auth/otp/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const json = await res.json()

      if (json.success) {
        setOtpSent(true)
        setCountdown(30)
      } else {
        setError(json.error || 'Failed to send OTP')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  // ── Verify phone OTP ──────────────────────────────────────────────────────
  const verifyPhoneOtp = async () => {
    if (phoneOtp.length !== 6) { setError('Enter the 6-digit OTP'); return }
    setLoading(true)
    setError('')
    try {
      const result = await loginWithOtp(phone.replace(/\D/g, ''), phoneOtp)
      if (result.success) {
        router.replace(getSafeRedirect(result.user.role, redirectParam))
      } else {
        setError(result.error || 'Invalid OTP')
        setPhoneOtp('')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  // ── Verify email OTP ──────────────────────────────────────────────────────
  const verifyEmailOtp = async () => {
    if (emailOtp.length !== 6) { setError('Enter the 6-digit OTP'); return }
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/otp/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email: email.trim().toLowerCase(),
          otp:   emailOtp,
        }),
      })
      const json = await res.json()

      if (json.success) {
        const { user: u, accessToken, refreshToken } = json.data
        // Use preloadedData path in loginWithOtp to update context
        await loginWithOtp(null, null, { user: u, accessToken, refreshToken })
        router.replace(getSafeRedirect(u.role, redirectParam))
      } else {
        setError(json.error || 'Invalid OTP')
        setEmailOtp('')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  // ── Email + Password login ────────────────────────────────────────────────
  const loginWithEmail = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Email and password are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await login({
        email:    email.trim().toLowerCase(),
        password,
      })
      if (result.success) {
        router.replace(getSafeRedirect(result.user.role, redirectParam))
      } else {
        setError(result.error || 'Login failed')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { key: 'phone',      label: 'Phone OTP', icon: <Phone className="w-3.5 h-3.5" /> },
    { key: 'email_otp',  label: 'Email OTP', icon: <Mail  className="w-3.5 h-3.5" /> },
    { key: 'email_pass', label: 'Password',  icon: <Lock  className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="text-4xl">🏥</span>
            <span className="text-3xl font-bold text-blue-600">MEDLI</span>
          </div>
          <p className="text-gray-500 text-sm">Healthcare made simple</p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-3xl p-8 border border-gray-100"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}
        >
          <h1 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-gray-400 text-sm mb-6">Sign in to your account</p>

          {/* 3-tab toggle */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key)
                  resetOtpState()
                  setPassword('')
                  setPhone('')
                  setEmail('')
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  tab === t.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">

            {/* ══ Tab: Phone OTP ══ */}
            {tab === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {!otpSent ? (
                  <>
                    <Input
                      label="Phone Number"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                        setError('')
                      }}
                      placeholder="10-digit mobile number"
                      leftIcon={<Phone className="w-4 h-4" />}
                      maxLength={10}
                    />
                    <Button
                      className="w-full"
                      onClick={sendOtp}
                      loading={sending}
                      disabled={phone.length !== 10 || sending}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Send OTP
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-center space-y-1 mb-2">
                      <p className="text-sm font-medium text-gray-700">
                        OTP sent to +91 {phone}
                      </p>
                      <p className="text-xs text-gray-400">
                        Enter the 6-digit code below
                      </p>
                    </div>
                    <OtpBoxes
                      value={phoneOtp}
                      onChange={setPhoneOtp}
                      idPrefix="ph-otp"
                    />
                    <Button
                      className="w-full"
                      onClick={verifyPhoneOtp}
                      loading={loading}
                      disabled={phoneOtp.length !== 6 || loading}
                    >
                      Verify & Sign In
                    </Button>
                    <div className="flex items-center justify-between text-sm">
                      <button
                        onClick={resetOtpState}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        ← Change number
                      </button>
                      {countdown > 0 ? (
                        <span className="text-gray-400 text-xs">
                          Resend in {countdown}s
                        </span>
                      ) : (
                        <button
                          onClick={sendOtp}
                          disabled={sending}
                          className="text-blue-600 font-medium hover:text-blue-700 disabled:opacity-50 transition-colors"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ══ Tab: Email OTP ══ */}
            {tab === 'email_otp' && (
              <motion.div
                key="email_otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {!otpSent ? (
                  <>
                    <Input
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                      placeholder="you@example.com"
                      leftIcon={<Mail className="w-4 h-4" />}
                      autoComplete="email"
                    />
                    <Button
                      className="w-full"
                      onClick={sendOtp}
                      loading={sending}
                      disabled={
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || sending
                      }
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Send OTP to Email
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-center space-y-1 mb-2">
                      <p className="text-sm font-medium text-gray-700">
                        OTP sent to {email}
                      </p>
                      <p className="text-xs text-gray-400">
                        Check inbox and spam/junk folder
                      </p>
                    </div>
                    <OtpBoxes
                      value={emailOtp}
                      onChange={setEmailOtp}
                      idPrefix="em-otp"
                    />
                    <Button
                      className="w-full"
                      onClick={verifyEmailOtp}
                      loading={loading}
                      disabled={emailOtp.length !== 6 || loading}
                    >
                      Verify & Sign In
                    </Button>
                    <div className="flex items-center justify-between text-sm">
                      <button
                        onClick={resetOtpState}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        ← Change email
                      </button>
                      {countdown > 0 ? (
                        <span className="text-gray-400 text-xs">
                          Resend in {countdown}s
                        </span>
                      ) : (
                        <button
                          onClick={sendOtp}
                          disabled={sending}
                          className="text-blue-600 font-medium hover:text-blue-700 disabled:opacity-50 transition-colors"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ══ Tab: Email + Password ══ */}
            {tab === 'email_pass' && (
              <motion.div
                key="email_pass"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={loginWithEmail} className="space-y-4">
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    placeholder="you@example.com"
                    leftIcon={<Mail className="w-4 h-4" />}
                    autoComplete="email"
                  />
                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError('') }}
                      placeholder="Your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPass
                        ? <EyeOff className="w-4 h-4" />
                        : <Eye    className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    loading={loading}
                    disabled={!email || !password || loading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Sign In
                  </Button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <a
              href="/auth/register"
              className="text-blue-600 font-medium hover:underline"
            >
              Create one
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}