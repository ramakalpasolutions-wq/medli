// src/app/auth/register/page.js
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, getDashboardForRole } from '@/context/AuthContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import {
  User, Phone, Mail, Lock, Eye, EyeOff,
  ArrowRight, Check, ChevronLeft,
} from 'lucide-react'

// ── 6-digit OTP input boxes ───────────────────────────────────────────────────
function OtpBoxes({ value, onChange, idPrefix = 'reg-otp' }) {
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
    if (pasted) {
      onChange(pasted.padEnd(6, '').slice(0, 6))
      document.getElementById(`${idPrefix}-${Math.min(pasted.length, 5)}`)?.focus()
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
          className="w-11 h-11 text-center text-base font-bold border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Steps:
//   1 → Enter details
//   2 → Verify phone OTP  (only if phone given)
//   3 → Verify email OTP  (only if email given)
//   4 → Confirm + submit
// ─────────────────────────────────────────────────────────────────────────────

function RegisterContent() {
  const router      = useRouter()
  const { loginWithOtp } = useAuth()

  // Form
  const [name,     setName]     = useState('')
  const [phone,    setPhone]    = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Flow
  const [step,          setStep]          = useState(1)
  const [phoneOtp,      setPhoneOtp]      = useState('')
  const [emailOtp,      setEmailOtp]      = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [countdown,     setCountdown]     = useState(0)
  const [error,         setError]         = useState('')
  const [loading,       setLoading]       = useState(false)
  const [sending,       setSending]       = useState(false)

  // Countdown
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // ── Step 1 validation ─────────────────────────────────────────────────────
  const hasPhone  = phone.length === 10
  const hasEmail  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const step1Valid = name.trim().length >= 2 && (hasPhone || hasEmail)

  // ── Send phone OTP ────────────────────────────────────────────────────────
  const sendPhoneOtp = async () => {
    setSending(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/otp/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone }),
      })
      const json = await res.json()
      if (json.success) {
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

  // ── Send email OTP ────────────────────────────────────────────────────────
  const sendEmailOtp = async () => {
    setSending(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/otp/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const json = await res.json()
      if (json.success) {
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

  // ── Step 1 Continue ───────────────────────────────────────────────────────
  const handleStep1 = async () => {
    setError('')
    if (!name.trim() || name.trim().length < 2) {
      setError('Full name must be at least 2 characters')
      return
    }
    if (!hasPhone && !hasEmail) {
      setError('Enter a valid phone number or email address')
      return
    }

    if (hasPhone) {
      await sendPhoneOtp()
      setStep(2)
    } else if (hasEmail) {
      await sendEmailOtp()
      setStep(3)
    }
  }

  // ── Verify phone OTP ──────────────────────────────────────────────────────
  const verifyPhoneOtp = async () => {
    if (phoneOtp.length !== 6) { setError('Enter the 6-digit OTP'); return }
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/otp/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone, otp: phoneOtp, purpose: 'verify_only' }),
      })
      const json = await res.json()
      if (json.success) {
        setPhoneVerified(true)
        setPhoneOtp('')
        if (hasEmail) {
          await sendEmailOtp()
          setStep(3)
        } else {
          setStep(4)
        }
      } else {
        setError(json.error || 'Incorrect OTP')
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
          purpose: 'verify_only',
        }),
      })
      const json = await res.json()
      if (json.success) {
        setEmailVerified(true)
        setEmailOtp('')
        setStep(4)
      } else {
        setError(json.error || 'Incorrect OTP')
        setEmailOtp('')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  // ── Final registration ────────────────────────────────────────────────────
  const handleRegister = async () => {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:     name.trim(),
          phone:    hasPhone ? phone : undefined,
          email:    hasEmail ? email.trim().toLowerCase() : undefined,
          password: password || undefined,
        }),
      })
      const json = await res.json()

      if (json.success) {
        const { user: u, accessToken, refreshToken } = json.data

        // Update auth context via preloadedData
        await loginWithOtp(null, null, { user: u, accessToken, refreshToken })

        router.replace(getDashboardForRole(u.role))
      } else {
        setError(json.error || 'Registration failed')
        if (
          json.code === 'PHONE_NOT_VERIFIED' ||
          json.code === 'EMAIL_NOT_VERIFIED'
        ) {
          setStep(1)
          setPhoneVerified(false)
          setEmailVerified(false)
        }
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Progress ──────────────────────────────────────────────────────────────
  const totalSteps = hasPhone && hasEmail ? 4 : 3
  const progress   = Math.round(((step - 1) / (totalSteps - 1)) * 100)

  const slide = {
    initial:    { x: 30,  opacity: 0 },
    animate:    { x: 0,   opacity: 1 },
    exit:       { x: -30, opacity: 0 },
    transition: { duration: 0.2 },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-2">
            <span className="text-3xl">🏥</span>
            <span className="text-2xl font-bold text-blue-600">MEDLI</span>
          </div>
          <p className="text-gray-500 text-sm">Create your account</p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-3xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}
        >
          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <motion.div
              className="h-full bg-blue-600"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <div className="p-8">

            {/* Error */}
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

              {/* ══ STEP 1: Details ══ */}
              {step === 1 && (
                <motion.div key="step1" {...slide} className="space-y-4">
                  <div className="mb-2">
                    <h2 className="text-lg font-bold text-gray-900">Create account</h2>
                    <p className="text-sm text-gray-400">
                      Fill in your details to get started
                    </p>
                  </div>

                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError('') }}
                    placeholder="Your full name"
                    leftIcon={<User className="w-4 h-4" />}
                  />

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
                    hint="We'll send an OTP to verify"
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    placeholder="you@example.com"
                    leftIcon={<Mail className="w-4 h-4" />}
                    hint={hasPhone ? 'Optional — adds email OTP login' : 'Required if no phone'}
                  />

                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters (optional)"
                      hint="Leave blank to use OTP login only"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                    >
                      {showPass
                        ? <EyeOff className="w-4 h-4" />
                        : <Eye    className="w-4 h-4" />}
                    </button>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleStep1}
                    loading={sending}
                    disabled={!step1Valid || sending}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue
                  </Button>

                  <p className="text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <a
                      href="/auth/login"
                      className="text-blue-600 font-medium hover:underline"
                    >
                      Sign in
                    </a>
                  </p>
                </motion.div>
              )}

              {/* ══ STEP 2: Verify Phone ══ */}
              {step === 2 && (
                <motion.div key="step2" {...slide} className="space-y-5">
                  <button
                    onClick={() => { setStep(1); setPhoneOtp(''); setError('') }}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>

                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                      Verify your phone
                    </h2>
                    <p className="text-sm text-gray-400">
                      OTP sent to <strong className="text-gray-700">+91 {phone}</strong>
                    </p>
                  </div>

                  {/* Progress indicators */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        phoneVerified
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {phoneVerified
                          ? <Check className="w-3 h-3" />
                          : <Phone className="w-3 h-3" />}
                      </div>
                      <span className={phoneVerified ? 'text-emerald-600' : 'text-blue-600'}>
                        Phone
                      </span>
                    </div>
                    {hasEmail && (
                      <>
                        <div className="flex-1 h-px bg-gray-200" />
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                            <Mail className="w-3 h-3" />
                          </div>
                          <span className="text-gray-400">Email</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 text-center">
                      Enter the 6-digit code
                    </p>
                    <OtpBoxes
                      value={phoneOtp}
                      onChange={setPhoneOtp}
                      idPrefix="ph-reg-otp"
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={verifyPhoneOtp}
                    loading={loading}
                    disabled={phoneOtp.length !== 6 || loading}
                  >
                    Verify Phone
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      onClick={() => { setStep(1); setPhoneOtp(''); setError('') }}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Change number
                    </button>
                    {countdown > 0 ? (
                      <span className="text-gray-400 text-xs">
                        Resend in {countdown}s
                      </span>
                    ) : (
                      <button
                        onClick={sendPhoneOtp}
                        disabled={sending}
                        className="text-blue-600 font-medium hover:text-blue-700 disabled:opacity-50 transition-colors"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ══ STEP 3: Verify Email ══ */}
              {step === 3 && (
                <motion.div key="step3" {...slide} className="space-y-5">
                  <button
                    onClick={() => {
                      setStep(hasPhone ? 2 : 1)
                      setEmailOtp('')
                      setError('')
                    }}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>

                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                      Verify your email
                    </h2>
                    <p className="text-sm text-gray-400">
                      OTP sent to <strong className="text-gray-700">{email}</strong>
                    </p>
                  </div>

                  {/* Progress indicators */}
                  <div className="flex items-center gap-2 text-xs">
                    {hasPhone && (
                      <>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                          <span className="text-emerald-600">Phone ✓</span>
                        </div>
                        <div className="flex-1 h-px bg-gray-200" />
                      </>
                    )}
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Mail className="w-3 h-3" />
                      </div>
                      <span className="text-blue-600">Email</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 text-center">
                      Enter the 6-digit code · Check spam/junk folder
                    </p>
                    <OtpBoxes
                      value={emailOtp}
                      onChange={setEmailOtp}
                      idPrefix="em-reg-otp"
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={verifyEmailOtp}
                    loading={loading}
                    disabled={emailOtp.length !== 6 || loading}
                  >
                    Verify Email
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-xs text-gray-400">
                      Didn&apos;t receive it?
                    </span>
                    {countdown > 0 ? (
                      <span className="text-gray-400 text-xs">
                        Resend in {countdown}s
                      </span>
                    ) : (
                      <button
                        onClick={sendEmailOtp}
                        disabled={sending}
                        className="text-blue-600 font-medium hover:text-blue-700 disabled:opacity-50 transition-colors"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ══ STEP 4: Confirm & Create ══ */}
              {step === 4 && (
                <motion.div key="step4" {...slide} className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                      Almost done!
                    </h2>
                    <p className="text-sm text-gray-400">
                      Review your details and create your account.
                    </p>
                  </div>

                  {/* Summary card */}
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-base">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{name}</p>
                        <p className="text-xs text-gray-400">
                          {hasPhone && `+91 ${phone}`}
                          {hasPhone && hasEmail && ' · '}
                          {hasEmail && email}
                        </p>
                      </div>
                    </div>

                    {/* Verified badges */}
                    <div className="flex flex-wrap gap-2">
                      {phoneVerified && (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                          <Check className="w-3 h-3" /> Phone verified
                        </span>
                      )}
                      {emailVerified && (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                          <Check className="w-3 h-3" /> Email verified
                        </span>
                      )}
                      {password && (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
                          <Lock className="w-3 h-3" /> Password set
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleRegister}
                    loading={loading}
                    disabled={loading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Create Account
                  </Button>

                  <p className="text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <a
                      href="/auth/login"
                      className="text-blue-600 font-medium hover:underline"
                    >
                      Sign in
                    </a>
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  )
}