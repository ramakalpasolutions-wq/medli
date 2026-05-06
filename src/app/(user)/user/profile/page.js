'use client'

import { useState } from 'react'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import FileUpload from '@/components/ui/FileUpload'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { Save, Lock } from 'lucide-react'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ name }),
      })
      const json = await res.json()
      json.success ? (toast.success('Profile updated'), refreshUser()) : toast.error(json.error)
    } catch { toast.error('Failed') }
    setSaving(false)
  }

  const changePassword = async () => {
    setPwSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      })
      const json = await res.json()
      json.success ? (toast.success('Password changed'), setOldPw(''), setNewPw('')) : toast.error(json.error)
    } catch { toast.error('Failed') }
    setPwSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

        <Card title="Profile Photo">
          <FileUpload purpose="user_avatar" accept="image/*" label="Upload profile photo" onSuccess={() => toast.success('Photo updated')} />
        </Card>

        <Card title="Personal Information" action={<Button size="xs" leftIcon={<Save className="w-3 h-3" />} onClick={saveProfile} loading={saving}>Save</Button>}>
          <div className="space-y-3">
            <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email" defaultValue={user?.email} disabled className="opacity-60" />
            <Input label="Phone" defaultValue={user?.phone} disabled className="opacity-60" />
          </div>
        </Card>

        <Card title="Change Password" action={<Button size="xs" leftIcon={<Lock className="w-3 h-3" />} onClick={changePassword} loading={pwSaving}>Update</Button>}>
          <div className="space-y-3">
            <Input label="Current Password" type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
            <Input label="New Password" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} hint="Min 6 characters" />
          </div>
        </Card>
      </div>
      <Footer />
    </div>
  )
}