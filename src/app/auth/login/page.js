'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth, getDashboardForRole } from '@/context/AuthContext'

/* ─── Safe redirect ──────────────────────────────────────────────────── */
function getSafeRedirect(role, redirectParam) {
  const defaultDash = getDashboardForRole(role)
  if (!redirectParam) return defaultDash
  const allowed = {
    super_admin:      ['/super-admin'],
    regional_manager: ['/regional'],
    hospital_admin:   ['/hospital-admin'],
    lab_admin:        ['/lab-admin'],
    doctor:           ['/doctor'],
    user:             ['/user', '/hospitals', '/labs', '/doctors', '/search', '/'],
  }
  const prefixes = allowed[role] || ['/']
  return prefixes.some((p) => redirectParam.startsWith(p)) ? redirectParam : defaultDash
}

/* ─── Keyframes ──────────────────────────────────────────────────────── */
const KF = `
  @keyframes auth-spin { to { transform: rotate(360deg); } }
  @keyframes auth-in   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes auth-shake{ 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 60%{transform:translateX(6px)} }
  @keyframes auth-slide-in  { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
  @keyframes auth-slide-out { from { opacity:1; transform:translateX(0); }    to { opacity:0; transform:translateX(-16px); } }
`

/* ─── OTP Boxes ──────────────────────────────────────────────────────── */
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
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      onChange(pasted)
      document.getElementById(`${idPrefix}-5`)?.focus()
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <OtpBox
          key={idx}
          id={`${idPrefix}-${idx}`}
          value={digits[idx] || ''}
          onChange={(val) => handleChange(val, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          filled={!!digits[idx]}
        />
      ))}
    </div>
  )
}

function OtpBox({ id, value, onChange, onKeyDown, filled }) {
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
        width: 46, height: 52,
        textAlign: 'center',
        fontSize: 20, fontWeight: 700,
        fontFamily: 'inherit',
        borderRadius: 12,
        border: `2px solid ${focused ? '#6366f1' : filled ? '#a5b4fc' : '#e2e8f0'}`,
        background: filled ? 'rgba(99,102,241,0.05)' : '#fff',
        color: '#0f172a',
        outline: 'none',
        transition: 'all .15s ease',
        boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
      }}
    />
  )
}

/* ─── Labeled Input ──────────────────────────────────────────────────── */
function AuthInput({ label, icon, rightElement, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)',
            color: focused ? '#6366f1' : '#94a3b8',
            display: 'flex', alignItems: 'center',
            pointerEvents: 'none', transition: 'color .15s ease',
          }}>
            {icon}
          </span>
        )}
        <input
          {...props}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
          style={{
            width: '100%',
            padding: icon ? '11px 14px 11px 40px' : '11px 14px',
            paddingRight: rightElement ? 44 : 14,
            fontSize: 14, fontFamily: 'inherit',
            borderRadius: 12,
            border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
            background: '#fff', color: '#0f172a', outline: 'none',
            boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
            transition: 'all .15s ease', boxSizing: 'border-box',
          }}
        />
        {rightElement && (
          <div style={{
            position: 'absolute', right: 12, top: '50%',
            transform: 'translateY(-50%)',
          }}>
            {rightElement}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Primary Button ─────────────────────────────────────────────────── */
function AuthBtn({ children, loading: isLoading, disabled, onClick, type = 'button', style: sx }) {
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
        width: '100%', padding: '13px',
        borderRadius: 12, border: 'none',
        background: isDisabled
          ? '#e2e8f0'
          : h
            ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
            : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: isDisabled ? '#94a3b8' : '#fff',
        fontSize: 14, fontWeight: 600, cursor: isDisabled ? 'not-allowed' : 'pointer',
        boxShadow: isDisabled ? 'none' : h ? '0 8px 24px rgba(99,102,241,0.45)' : '0 4px 14px rgba(99,102,241,0.3)',
        transition: 'all .18s ease',
        transform: h && !isDisabled ? 'scale(1.01)' : 'scale(1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        ...sx,
      }}
    >
      {isLoading ? (
        <span style={{
          width: 16, height: 16, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: '#fff',
          animation: 'auth-spin .7s linear infinite',
          display: 'inline-block',
        }} />
      ) : children}
    </button>
  )
}

/* ─── Error Banner ───────────────────────────────────────────────────── */
function ErrorBanner({ error }) {
  if (!error) return null
  return (
    <div style={{
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 12, padding: '10px 14px',
      fontSize: 13, color: '#ef4444',
      marginBottom: 16,
      animation: 'auth-shake .4s ease',
    }}>
      ⚠ {error}
    </div>
  )
}

/* ─── Spinner page ───────────────────────────────────────────────────── */
function SpinnerPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <style>{`@keyframes auth-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #6366f1', borderTopColor: 'transparent', animation: 'auth-spin .8s linear infinite' }} />
      <p style={{ fontSize: 13, color: '#94a3b8' }}>Loading...</p>
    </div>
  )
}

/* ─── Login Content ──────────────────────────────────────────────────── */
function LoginContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { login, loginWithOtp, user, loading: authLoading } = useAuth()

  const redirectParam = searchParams.get('redirect') || ''

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
  const [visible,   setVisible]   = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(getSafeRedirect(user.role, redirectParam))
    }
  }, [user, authLoading, redirectParam, router])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  if (authLoading) return <SpinnerPage />

  const resetOtpState = () => {
    setOtpSent(false); setPhoneOtp(''); setEmailOtp(''); setError(''); setCountdown(0)
  }

  const switchTab = (newTab) => {
    setTab(newTab); resetOtpState(); setPassword(''); setPhone(''); setEmail('')
  }

  const sendOtp = async () => {
    setSending(true); setError('')
    try {
      const body = tab === 'phone'
        ? { phone: phone.replace(/\D/g, '') }
        : { email: email.trim().toLowerCase() }
      const res  = await fetch('/api/auth/otp/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) { setOtpSent(true); setCountdown(30) }
      else setError(json.error || 'Failed to send OTP')
    } catch { setError('Network error. Please try again.') }
    finally { setSending(false) }
  }

  const verifyPhoneOtp = async () => {
    if (phoneOtp.length !== 6) { setError('Enter the 6-digit OTP'); return }
    setLoading(true); setError('')
    try {
      const result = await loginWithOtp(phone.replace(/\D/g, ''), phoneOtp)
      if (result.success) router.replace(getSafeRedirect(result.user.role, redirectParam))
      else { setError(result.error || 'Invalid OTP'); setPhoneOtp('') }
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const verifyEmailOtp = async () => {
    if (emailOtp.length !== 6) { setError('Enter the 6-digit OTP'); return }
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth/otp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: emailOtp }),
      })
      const json = await res.json()
      if (json.success) {
        const { user: u, accessToken, refreshToken } = json.data
        await loginWithOtp(null, null, { user: u, accessToken, refreshToken })
        router.replace(getSafeRedirect(u.role, redirectParam))
      } else { setError(json.error || 'Invalid OTP'); setEmailOtp('') }
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const loginWithEmail = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) { setError('Email and password are required'); return }
    setLoading(true); setError('')
    try {
      const result = await login({ email: email.trim().toLowerCase(), password })
      if (result.success) router.replace(getSafeRedirect(result.user.role, redirectParam))
      else setError(result.error || 'Login failed')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const TABS = [
    { key: 'phone',      label: 'Phone OTP', icon: '📱' },
    { key: 'email_otp',  label: 'Email OTP', icon: '📧' },
    { key: 'email_pass', label: 'Password',  icon: '🔒' },
  ]

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  return (
    <>
      <style>{KF}</style>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#16213e 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(16px,4vw,32px)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background orbs */}
        <div style={{ position:'absolute',top:'10%',left:'10%',width:350,height:350,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.12),transparent 70%)',filter:'blur(60px)',pointerEvents:'none' }} />
        <div style={{ position:'absolute',bottom:'10%',right:'10%',width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.1),transparent 70%)',filter:'blur(50px)',pointerEvents:'none' }} />

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 420,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity .4s ease, transform .4s ease',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13,
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
              }}>🏥</div>
              <span style={{
                fontSize: 26, fontWeight: 800,
                backgroundImage: 'linear-gradient(135deg,#818cf8,#a78bfa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', letterSpacing: '-0.5px',
              }}>
                MEDLI
              </span>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              Healthcare made simple
            </p>
          </div>

          {/* Glass card */}
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24, padding: 'clamp(24px,5vw,36px)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
          }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>
              Sign in to your account
            </p>

            {/* Tab switcher */}
            <div style={{
              display: 'flex', gap: 3,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 12, padding: 3, marginBottom: 24,
            }}>
              {TABS.map((t) => (
                <LoginTabBtn
                  key={t.key}
                  label={t.label}
                  icon={t.icon}
                  active={tab === t.key}
                  onClick={() => switchTab(t.key)}
                />
              ))}
            </div>

            {/* Error */}
            <ErrorBanner error={error} />

            {/* ── Phone OTP tab ── */}
            {tab === 'phone' && (
              <div style={{ animation: 'auth-slide-in .2s ease' }}>
                {!otpSent ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <AuthInput
                      label="Phone Number"
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value.replace(/\D/g,'').slice(0,10)); setError('') }}
                      placeholder="10-digit mobile number"
                      icon={<span style={{ fontSize:16 }}>📱</span>}
                      maxLength={10}
                    />
                    <AuthBtn
                      onClick={sendOtp}
                      loading={sending}
                      disabled={phone.length !== 10 || sending}
                    >
                      Send OTP →
                    </AuthBtn>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
                        OTP sent to +91 {phone}
                      </p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                        Enter the 6-digit code below
                      </p>
                    </div>
                    <OtpBoxes value={phoneOtp} onChange={setPhoneOtp} idPrefix="ph-otp" />
                    <AuthBtn onClick={verifyPhoneOtp} loading={loading} disabled={phoneOtp.length !== 6 || loading}>
                      Verify & Sign In
                    </AuthBtn>
                    <ResendRow countdown={countdown} onResend={sendOtp} sending={sending} onBack={resetOtpState} backLabel="← Change number" />
                  </div>
                )}
              </div>
            )}

            {/* ── Email OTP tab ── */}
            {tab === 'email_otp' && (
              <div style={{ animation: 'auth-slide-in .2s ease' }}>
                {!otpSent ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <AuthInput
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                      placeholder="you@example.com"
                      icon={<span style={{ fontSize:16 }}>📧</span>}
                      autoComplete="email"
                    />
                    <AuthBtn onClick={sendOtp} loading={sending} disabled={!isValidEmail || sending}>
                      Send OTP to Email →
                    </AuthBtn>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
                        OTP sent to {email}
                      </p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                        Check inbox and spam/junk folder
                      </p>
                    </div>
                    <OtpBoxes value={emailOtp} onChange={setEmailOtp} idPrefix="em-otp" />
                    <AuthBtn onClick={verifyEmailOtp} loading={loading} disabled={emailOtp.length !== 6 || loading}>
                      Verify & Sign In
                    </AuthBtn>
                    <ResendRow countdown={countdown} onResend={sendOtp} sending={sending} onBack={resetOtpState} backLabel="← Change email" />
                  </div>
                )}
              </div>
            )}

            {/* ── Email + Password tab ── */}
            {tab === 'email_pass' && (
              <div style={{ animation: 'auth-slide-in .2s ease' }}>
                <form onSubmit={loginWithEmail} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <AuthInput
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    placeholder="you@example.com"
                    icon={<span style={{ fontSize:16 }}>📧</span>}
                    autoComplete="email"
                  />
                  <AuthInput
                    label="Password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    placeholder="Your password"
                    autoComplete="current-password"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPass((p) => !p)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, display: 'flex', alignItems: 'center' }}
                      >
                        {showPass ? '🙈' : '👁️'}
                      </button>
                    }
                  />
                  <AuthBtn type="submit" loading={loading} disabled={!email || !password || loading}>
                    Sign In →
                  </AuthBtn>
                </form>
              </div>
            )}

            {/* Register link */}
            <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 24, marginBottom: 0 }}>
              Don&apos;t have an account?{' '}
              <a href="/auth/register" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
                Create one
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Sub-components ─────────────────────────────────────────────────── */
function LoginTabBtn({ label, icon, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        padding: '8px 4px', borderRadius: 9, border: 'none',
        background: active
          ? 'rgba(255,255,255,0.12)'
          : h ? 'rgba(255,255,255,0.06)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.45)',
        fontSize: 12, fontWeight: active ? 600 : 500, cursor: 'pointer',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
        transition: 'all .15s ease',
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function ResendRow({ countdown, onResend, sending, onBack, backLabel }) {
  const [h, setH] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.4)', padding: 0 }}
      >
        {backLabel}
      </button>
      {countdown > 0 ? (
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          Resend in {countdown}s
        </span>
      ) : (
        <button
          onClick={onResend}
          disabled={sending}
          onMouseEnter={() => setH(true)}
          onMouseLeave={() => setH(false)}
          style={{
            background: 'none', border: 'none', cursor: sending ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600,
            color: sending ? 'rgba(255,255,255,0.25)' : h ? '#a5b4fc' : '#818cf8',
            padding: 0, transition: 'color .15s ease',
          }}
        >
          Resend OTP
        </button>
      )}
    </div>
  )
}

/* ─── Page export ────────────────────────────────────────────────────── */
export default function LoginPage() {
  return (
    <Suspense fallback={<SpinnerPage />}>
      <LoginContent />
    </Suspense>
  )
}