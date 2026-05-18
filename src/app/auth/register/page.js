'use client'

import Image from 'next/image'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, getDashboardForRole } from '@/context/AuthContext'
import {
  User,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  ShieldCheck,
  FileCheck,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
} from 'lucide-react'

const KF = `
  @keyframes auth-spin  { to { transform: rotate(360deg); } }
  @keyframes auth-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 60%{transform:translateX(6px)} }
  @keyframes auth-in    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes auth-step  { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
`

function OtpBox({ id, value, onChange, onKeyDown }) {
  const [focused, setFocused] = useState(false)

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: 46,
        height: 52,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 700,
        fontFamily: 'inherit',
        borderRadius: 12,
        border: `2px solid ${
          focused ? '#6366f1' : value ? '#a5b4fc' : 'rgba(255,255,255,0.15)'
        }`,
        background: value ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.06)',
        color: '#fff',
        outline: 'none',
        boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
        transition: 'all .15s ease',
      }}
    />
  )
}

function OtpBoxes({ value, onChange, idPrefix = 'otp' }) {
  const digits = value.padEnd(6, '').split('').slice(0, 6)

  const handleChange = (val, idx) => {
    const clean = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = clean
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
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      onChange(pasted.padEnd(6, '').slice(0, 6))
      document.getElementById(`${idPrefix}-${Math.min(pasted.length, 5)}`)?.focus()
    }
  }

  return (
    <div
      style={{ display: 'flex', gap: 8, justifyContent: 'center' }}
      onPaste={handlePaste}
    >
      {Array.from({ length: 6 }).map((_, idx) => (
        <OtpBox
          key={idx}
          id={`${idPrefix}-${idx}`}
          value={digits[idx] || ''}
          onChange={(val) => handleChange(val, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
        />
      ))}
    </div>
  )
}

function AuthInput({ label, icon: Icon, hint, rightElement, error: fieldError, ...props }) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: fieldError ? '#fca5a5' : 'rgba(255,255,255,0.65)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {label}
          <span style={{ color: '#f87171', fontSize: 13 }}>*</span>
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {Icon && (
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: fieldError
                ? '#fca5a5'
                : focused
                  ? '#818cf8'
                  : 'rgba(255,255,255,0.35)',
              transition: 'color .15s ease',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Icon size={16} strokeWidth={2.2} />
          </span>
        )}

        <input
          {...props}
          onFocus={(e) => {
            setFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            props.onBlur?.(e)
          }}
          style={{
            width: '100%',
            padding: Icon ? '11px 14px 11px 40px' : '11px 14px',
            paddingRight: rightElement ? 44 : 14,
            fontSize: 14,
            fontFamily: 'inherit',
            borderRadius: 12,
            border: `1.5px solid ${
              fieldError
                ? 'rgba(239,68,68,0.5)'
                : focused
                  ? '#6366f1'
                  : 'rgba(255,255,255,0.1)'
            }`,
            background: fieldError ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.07)',
            color: '#fff',
            outline: 'none',
            boxShadow: focused
              ? fieldError
                ? '0 0 0 3px rgba(239,68,68,0.15)'
                : '0 0 0 3px rgba(99,102,241,0.15)'
              : 'none',
            transition: 'all .15s ease',
            boxSizing: 'border-box',
          }}
        />

        {rightElement && (
          <div
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            {rightElement}
          </div>
        )}
      </div>

      {fieldError && (
        <p
          style={{
            fontSize: 11,
            color: '#fca5a5',
            margin: 0,
            paddingLeft: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <AlertCircle size={13} />
          {fieldError}
        </p>
      )}

      {hint && !fieldError && (
        <p
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            margin: 0,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

function AuthBtn({ children, loading: isLoading, disabled, onClick, type = 'button' }) {
  const [h, setH] = useState(false)
  const isDisabled = disabled || isLoading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => !isDisabled && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: '100%',
        padding: '13px',
        borderRadius: 12,
        border: 'none',
        background: isDisabled
          ? 'rgba(255,255,255,0.1)'
          : h
            ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
            : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: isDisabled ? 'rgba(255,255,255,0.3)' : '#fff',
        fontSize: 14,
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        boxShadow: isDisabled
          ? 'none'
          : h
            ? '0 8px 24px rgba(99,102,241,0.5)'
            : '0 4px 14px rgba(99,102,241,0.3)',
        transition: 'all .18s ease',
        transform: h && !isDisabled ? 'scale(1.01)' : 'scale(1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {isLoading ? (
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff',
            animation: 'auth-spin .7s linear infinite',
            display: 'inline-block',
          }}
        />
      ) : (
        children
      )}
    </button>
  )
}

function TermsCheckbox({ checked, onChange, error: fieldError }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '12px 14px',
          borderRadius: 12,
          border: `1.5px solid ${
            fieldError
              ? 'rgba(239,68,68,0.5)'
              : checked
                ? '#6366f1'
                : hovered
                  ? 'rgba(255,255,255,0.2)'
                  : 'rgba(255,255,255,0.1)'
          }`,
          background: fieldError
            ? 'rgba(239,68,68,0.05)'
            : checked
              ? 'rgba(99,102,241,0.08)'
              : hovered
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(255,255,255,0.02)',
          cursor: 'pointer',
          transition: 'all .15s ease',
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0, marginTop: 1 }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            style={{
              position: 'absolute',
              opacity: 0,
              width: 18,
              height: 18,
              margin: 0,
              cursor: 'pointer',
            }}
          />
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 5,
              border: `2px solid ${
                fieldError
                  ? 'rgba(239,68,68,0.6)'
                  : checked
                    ? '#6366f1'
                    : 'rgba(255,255,255,0.3)'
              }`,
              background: checked ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all .15s ease',
              boxShadow: checked ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
            }}
          >
            {checked && <Check size={12} strokeWidth={3} color="#fff" />}
          </div>
        </div>

        <span
          style={{
            fontSize: 12,
            lineHeight: 1.5,
            color: fieldError ? '#fca5a5' : 'rgba(255,255,255,0.7)',
            userSelect: 'none',
          }}
        >
          I agree to the{' '}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}
          >
            Privacy Policy
          </a>
          <span style={{ color: '#f87171', marginLeft: 2 }}>*</span>
        </span>
      </label>

      {fieldError && (
        <p
          style={{
            fontSize: 11,
            color: '#fca5a5',
            margin: 0,
            paddingLeft: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <AlertCircle size={13} />
          {fieldError}
        </p>
      )}
    </div>
  )
}

function GhostBtn({ children, onClick }) {
  const [h, setH] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 13,
        color: h ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'color .15s ease',
      }}
    >
      {children}
    </button>
  )
}

function ErrorBanner({ error }) {
  if (!error) return null

  return (
    <div
      style={{
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: 12,
        padding: '10px 14px',
        fontSize: 13,
        color: '#fca5a5',
        marginBottom: 16,
        animation: 'auth-shake .4s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <AlertCircle size={16} />
      {error}
    </div>
  )
}

function ProgressBar({ progress }) {
  return (
    <div
      style={{
        height: 3,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 2,
        marginBottom: 28,
      }}
    >
      <div
        style={{
          height: '100%',
          borderRadius: 2,
          background: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
          width: `${progress}%`,
          transition: 'width .4s ease',
        }}
      />
    </div>
  )
}

function VerifiedBadge({ icon: Icon, label, color = '#10b981' }) {
  const rgb = color === '#10b981' ? '16,185,129' : '99,102,241'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 100,
        background: `rgba(${rgb},0.12)`,
        border: `1px solid rgba(${rgb},0.25)`,
        color,
      }}
    >
      <Icon size={13} strokeWidth={2.4} />
      {label}
    </span>
  )
}

function SpinnerPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg,#0f0f1a,#1a1a2e,#16213e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <style>{`@keyframes auth-spin{to{transform:rotate(360deg)}}`}</style>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '3px solid #6366f1',
          borderTopColor: 'transparent',
          animation: 'auth-spin .8s linear infinite',
        }}
      />
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Loading...</p>
    </div>
  )
}

function StepIndicators({ step, phoneVerified }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
      <StepDot
        icon={phoneVerified ? Check : Smartphone}
        label="Phone"
        done={phoneVerified}
        active={step === 2}
      />
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
      <StepDot icon={Mail} label="Email" done={false} active={step === 3} />
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
      <StepDot icon={BadgeCheck} label="Done" done={false} active={step === 4} />
    </div>
  )
}

function StepDot({ icon: Icon, label, done, active }) {
  const bg = done
    ? 'rgba(16,185,129,0.15)'
    : active
      ? 'rgba(99,102,241,0.2)'
      : 'rgba(255,255,255,0.06)'

  const color = done ? '#10b981' : active ? '#818cf8' : 'rgba(255,255,255,0.3)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: bg,
          border: `1px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={12} strokeWidth={2.6} color={color} />
      </div>
      <span style={{ color, fontWeight: done || active ? 600 : 400 }}>{label}</span>
    </div>
  )
}

function ResendRow({ countdown, onResend, sending, onBack, backLabel }) {
  const [h, setH] = useState(false)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <GhostBtn onClick={onBack}>
        <ArrowLeft size={14} />
        {backLabel}
      </GhostBtn>

      {countdown > 0 ? (
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          Resend in {countdown}s
        </span>
      ) : (
        <button
          onClick={onResend}
          disabled={sending}
          onMouseEnter={() => setH(true)}
          onMouseLeave={() => setH(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: sending ? 'not-allowed' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: sending ? 'rgba(255,255,255,0.2)' : h ? '#a5b4fc' : '#818cf8',
            padding: 0,
            transition: 'color .15s ease',
          }}
        >
          Resend OTP
        </button>
      )}
    </div>
  )
}

function validateStep1({ name, phone, email, password, agreedTerms }) {
  const errors = {}

  if (!name.trim() || name.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters'
  }
  if (!phone || phone.length !== 10) {
    errors.phone = 'Valid 10-digit phone number is required'
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Valid email address is required'
  }
  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }
  if (!agreedTerms) {
    errors.terms = 'You must accept the Terms & Privacy Policy'
  }

  return errors
}

function RegisterContent() {
  const router = useRouter()
  const { loginWithOtp } = useAuth()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)

  const [step, setStep] = useState(1)
  const [phoneOtp, setPhoneOtp] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const progress = Math.round(((step - 1) / 3) * 100)

  const sendPhoneOtp = async () => {
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const json = await res.json()
      if (json.success) {
        setCountdown(30)
      } else {
        setError(json.error || 'Failed to send phone OTP')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const sendEmailOtp = async () => {
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const json = await res.json()
      if (json.success) {
        setCountdown(30)
      } else {
        setError(json.error || 'Failed to send email OTP')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleStep1 = async () => {
    const errors = validateStep1({ name, phone, email, password, agreedTerms })
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Please fix the highlighted fields before continuing.')
      return
    }
    setFieldErrors({})
    setError('')
    await sendPhoneOtp()
    setStep(2)
  }

  const verifyPhoneOtp = async () => {
    if (phoneOtp.length !== 6) {
      setError('Enter the 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: phoneOtp, purpose: 'verify_only' }),
      })
      const json = await res.json()
      if (json.success) {
        setPhoneVerified(true)
        setPhoneOtp('')
        await sendEmailOtp()
        setStep(3)
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

  const verifyEmailOtp = async () => {
    if (emailOtp.length !== 6) {
      setError('Enter the 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: emailOtp,
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

  const handleRegister = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          email: email.trim().toLowerCase(),
          password,
          agreedToTerms: true,
          termsVersion: '1.0',
        }),
      })
      const json = await res.json()
      if (json.success) {
        const { user: u, accessToken, refreshToken } = json.data
        await loginWithOtp(null, null, { user: u, accessToken, refreshToken })
        router.replace(getDashboardForRole(u.role))
      } else {
        setError(json.error || 'Registration failed')
        if (json.code === 'PHONE_NOT_VERIFIED' || json.code === 'EMAIL_NOT_VERIFIED') {
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

  const field = (setter, key) => (e) => {
    setter(key === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value)
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
    setError('')
  }

  return (
    <>
      <style>{KF}</style>

      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#16213e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(16px,4vw,32px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(99,102,241,0.12),transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(139,92,246,0.1),transparent 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            width: '100%',
            maxWidth: 440,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity .4s ease, transform .4s ease',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                textDecoration: 'none',
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                <Image
                  src="/MEDLI-LOGOICON.png"
                  alt="MEDLI Logo"
                  width={44}
                  height={44}
                  priority
                  style={{ objectFit: 'contain', display: 'block' }}
                />
              </div>

              <div style={{ lineHeight: 1, textAlign: 'left' }}>
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: 24,
                    background: 'linear-gradient(135deg,#818cf8,#a78bfa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.5px',
                  }}
                >
                  MEDLI
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '1.5px',
                    fontWeight: 600,
                  }}
                >
                  HEALTHCARE
                </div>
              </div>
            </a>

            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Create your account
            </p>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24,
              padding: 'clamp(24px,5vw,36px)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
            }}
          >
            <ProgressBar progress={progress} />
            <ErrorBanner error={error} />

            {step === 1 && (
              <div style={{ animation: 'auth-step .2s ease' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
                  Create account
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.4)',
                    margin: '0 0 6px',
                  }}
                >
                  All fields are required
                </p>

                <p
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.3)',
                    margin: '0 0 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span style={{ color: '#f87171', fontSize: 13 }}>*</span>
                  Required field
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <AuthInput
                    label="Full Name"
                    value={name}
                    onChange={field(setName, 'name')}
                    placeholder="Your full name"
                    icon={User}
                    error={fieldErrors.name}
                  />

                  <AuthInput
                    label="Phone Number"
                    type="tel"
                    value={phone}
                    onChange={field(setPhone, 'phone')}
                    placeholder="10-digit mobile number"
                    icon={Smartphone}
                    maxLength={10}
                    hint="OTP will be sent for verification"
                    error={fieldErrors.phone}
                  />

                  <AuthInput
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={field(setEmail, 'email')}
                    placeholder="you@example.com"
                    icon={Mail}
                    hint="OTP will be sent for verification"
                    error={fieldErrors.email}
                  />

                  <AuthInput
                    label="Password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={field(setPassword, 'password')}
                    placeholder="Min 6 characters"
                    icon={Lock}
                    hint="Used for password login"
                    error={fieldErrors.password}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPass((p) => !p)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          color: 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />

                  <TermsCheckbox
                    checked={agreedTerms}
                    onChange={(v) => {
                      setAgreedTerms(v)
                      setFieldErrors((prev) => ({ ...prev, terms: undefined }))
                      setError('')
                    }}
                    error={fieldErrors.terms}
                  />

                  <AuthBtn onClick={handleStep1} loading={sending} disabled={sending}>
                    Verify Phone & Email To Continue
                    {!sending && <ArrowRight size={16} />}
                  </AuthBtn>

                  <p
                    style={{
                      textAlign: 'center',
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.4)',
                      margin: 0,
                    }}
                  >
                    Already have an account?{' '}
                    <a
                      href="/auth/login"
                      style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}
                    >
                      Sign in
                    </a>
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ animation: 'auth-step .2s ease' }}>
                <GhostBtn
                  onClick={() => {
                    setStep(1)
                    setPhoneOtp('')
                    setError('')
                  }}
                >
                  <ArrowLeft size={14} />
                  Back
                </GhostBtn>

                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: '#fff',
                    margin: '16px 0 4px',
                  }}
                >
                  Verify your phone
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.4)',
                    margin: '0 0 20px',
                  }}
                >
                  OTP sent to <strong style={{ color: 'rgba(255,255,255,0.7)' }}>+91 {phone}</strong>
                </p>

                <StepIndicators step={2} phoneVerified={phoneVerified} />

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    marginTop: 20,
                  }}
                >
                  <p
                    style={{
                      textAlign: 'center',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.4)',
                      margin: 0,
                    }}
                  >
                    Enter the 6-digit code
                  </p>

                  <OtpBoxes value={phoneOtp} onChange={setPhoneOtp} idPrefix="ph-reg-otp" />

                  <AuthBtn
                    onClick={verifyPhoneOtp}
                    loading={loading}
                    disabled={phoneOtp.length !== 6 || loading}
                  >
                    Verify Phone
                    {!loading && <ArrowRight size={16} />}
                  </AuthBtn>

                  <ResendRow
                    countdown={countdown}
                    onResend={sendPhoneOtp}
                    sending={sending}
                    onBack={() => {
                      setStep(1)
                      setPhoneOtp('')
                      setError('')
                    }}
                    backLabel="Change number"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ animation: 'auth-step .2s ease' }}>
                <GhostBtn
                  onClick={() => {
                    setStep(2)
                    setEmailOtp('')
                    setError('')
                  }}
                >
                  <ArrowLeft size={14} />
                  Back
                </GhostBtn>

                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: '#fff',
                    margin: '16px 0 4px',
                  }}
                >
                  Verify your email
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.4)',
                    margin: '0 0 20px',
                  }}
                >
                  OTP sent to <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{email}</strong>
                </p>

                <StepIndicators step={3} phoneVerified={phoneVerified} />

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    marginTop: 20,
                  }}
                >
                  <p
                    style={{
                      textAlign: 'center',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.4)',
                      margin: 0,
                    }}
                  >
                    Enter the 6-digit code · Check spam/junk folder
                  </p>

                  <OtpBoxes value={emailOtp} onChange={setEmailOtp} idPrefix="em-reg-otp" />

                  <AuthBtn
                    onClick={verifyEmailOtp}
                    loading={loading}
                    disabled={emailOtp.length !== 6 || loading}
                  >
                    Verify Email
                    {!loading && <ArrowRight size={16} />}
                  </AuthBtn>

                  <ResendRow
                    countdown={countdown}
                    onResend={sendEmailOtp}
                    sending={sending}
                    onBack={() => {
                      setStep(2)
                      setEmailOtp('')
                      setError('')
                    }}
                    backLabel="Back"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div style={{ animation: 'auth-step .2s ease' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
                  Almost done!
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.4)',
                    margin: '0 0 20px',
                  }}
                >
                  Review your details and create your account.
                </p>

                <div
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>
                        {name}
                      </p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                        +91 {phone} · {email}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {phoneVerified && (
                      <VerifiedBadge icon={Check} label="Phone verified" color="#10b981" />
                    )}
                    {emailVerified && (
                      <VerifiedBadge icon={Check} label="Email verified" color="#10b981" />
                    )}
                    <VerifiedBadge icon={ShieldCheck} label="Password set" color="#6366f1" />
                    <VerifiedBadge icon={FileCheck} label="Terms accepted" color="#10b981" />
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: 16,
                    lineHeight: 1.5,
                  }}
                >
                  By creating your account you confirm you have agreed to our{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Privacy Policy
                  </a>
                  . This acceptance is recorded.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <AuthBtn onClick={handleRegister} loading={loading} disabled={loading}>
                    Create Account
                    {!loading && <ArrowRight size={16} />}
                  </AuthBtn>

                  <p
                    style={{
                      textAlign: 'center',
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.4)',
                      margin: 0,
                    }}
                  >
                    Already have an account?{' '}
                    <a
                      href="/auth/login"
                      style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}
                    >
                      Sign in
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<SpinnerPage />}>
      <RegisterContent />
    </Suspense>
  )
}