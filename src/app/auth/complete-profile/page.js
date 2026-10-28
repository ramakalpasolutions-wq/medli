'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, getDashboardForRole } from '@/context/AuthContext'
import { isUserProfileIncomplete } from '@/lib/utils/profileCompletion'

export default function CompleteProfilePage() {
  const router = useRouter()
  const { user, loading, refreshUser } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [redirectTo, setRedirectTo] = useState('/user/dashboard')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('redirect')
    if (requested?.startsWith('/') && !requested.startsWith('//')) {
      setRedirectTo(requested)
    }
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/login')
      return
    }
    if (!isUserProfileIncomplete(user)) {
      router.replace(redirectTo || getDashboardForRole(user.role))
      return
    }
    setName((current) => current || (user.name && !/^user(?:\s+\d+)?$/i.test(user.name.trim()) ? user.name : ''))
    setEmail((current) => current || user.email || '')
  }, [loading, user, redirectTo, router])

  const submit = async (event) => {
    event.preventDefault()
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    if (cleanName.length < 2) {
      setError('Enter your full name (at least 2 characters).')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Enter a valid email address.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: cleanName, email: cleanEmail }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Could not save your profile.')
      }
      await refreshUser()
      router.replace(redirectTo || getDashboardForRole(user.role))
    } catch (saveError) {
      setError(saveError.message || 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f8fafc' }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 440, padding: 28, borderRadius: 20, background: '#fff', boxShadow: '0 16px 48px rgba(15,23,42,.10)' }}>
        <div style={{ width: 46, height: 46, display: 'grid', placeItems: 'center', borderRadius: 14, background: '#ede9fe', color: '#6366f1', fontSize: 22, fontWeight: 800 }}>M</div>
        <h1 style={{ margin: '20px 0 6px', color: '#0f172a', fontSize: 24 }}>Complete your profile</h1>
        <p style={{ margin: '0 0 22px', color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>Add your name and email so we can identify you and send booking confirmations.</p>

        <label htmlFor="profile-name" style={{ display: 'block', marginBottom: 6, color: '#334155', fontSize: 13, fontWeight: 600 }}>Full name</label>
        <input id="profile-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} style={inputStyle} />

        <label htmlFor="profile-email" style={{ display: 'block', margin: '16px 0 6px', color: '#334155', fontSize: 13, fontWeight: 600 }}>Email address</label>
        <input id="profile-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />

        {error && <p role="alert" style={{ margin: '14px 0 0', color: '#dc2626', fontSize: 13 }}>{error}</p>}

        <button type="submit" disabled={saving} style={{ width: '100%', marginTop: 22, padding: '13px 16px', border: 0, borderRadius: 12, background: saving ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
          {saving ? 'Saving…' : 'Save and continue'}
        </button>
      </form>
    </main>
  )
}

const inputStyle = {
  boxSizing: 'border-box',
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  outlineColor: '#6366f1',
  color: '#0f172a',
  fontSize: 14,
}
