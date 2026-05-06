// src/app/(user)/user/profile/page.js
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import {
  User, Phone, Mail, Calendar, Clock,
  ChevronRight, Plus, Trash2, Edit3,
  Users, FileText, Shield, LogOut,
  Building2, FlaskConical, Video,
  CheckCircle, XCircle, AlertCircle,
  Heart, Baby, UserCheck,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

const fmtRs = (n) =>
  `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`

// ── Family member relation icons ──────────────────────────────────────────────
const RELATIONS = [
  { key: 'spouse',  label: 'Spouse',  icon: Heart  },
  { key: 'child',   label: 'Child',   icon: Baby   },
  { key: 'parent',  label: 'Parent',  icon: UserCheck },
  { key: 'sibling', label: 'Sibling', icon: Users  },
  { key: 'other',   label: 'Other',   icon: User   },
]

// ── Booking type icon ─────────────────────────────────────────────────────────
function BookingTypeIcon({ type }) {
  if (type === 'lab')    return <FlaskConical className="w-4 h-4 text-green-500" />
  if (type === 'online') return <Video        className="w-4 h-4 text-purple-500" />
  return <Building2 className="w-4 h-4 text-blue-500" />
}

// ── Tab button ────────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {count !== undefined && count > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
          active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ title, children, action }) {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          {title && (
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          )}
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}

// ── Add / Edit Family Member Modal ────────────────────────────────────────────
function FamilyMemberModal({ isOpen, onClose, onSave, member, loading }) {
  const [form, setForm] = useState({
    name:      '',
    relation:  'spouse',
    age:       '',
    gender:    'male',
    bloodGroup:'',
    phone:     '',
    notes:     '',
  })

  useEffect(() => {
    if (member) {
      setForm({
        name:       member.name       || '',
        relation:   member.relation   || 'spouse',
        age:        member.age        || '',
        gender:     member.gender     || 'male',
        bloodGroup: member.bloodGroup || '',
        phone:      member.phone      || '',
        notes:      member.notes      || '',
      })
    } else {
      setForm({
        name: '', relation: 'spouse', age: '',
        gender: 'male', bloodGroup: '', phone: '', notes: '',
      })
    }
  }, [member, isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-2xl w-full max-w-md max-h-[90vh]
                         overflow-y-auto"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            >
              <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-5">
                  {member ? 'Edit Family Member' : 'Add Family Member'}
                </h2>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5
                                 text-sm focus:outline-none focus:ring-2
                                 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Relation */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Relation *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {RELATIONS.map((r) => (
                        <button
                          key={r.key}
                          onClick={() => setForm({ ...form, relation: r.key })}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl
                                      border text-xs font-medium transition-all ${
                            form.relation === r.key
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          <r.icon className="w-4 h-4" />
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age + Gender */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Age
                      </label>
                      <input
                        type="number"
                        placeholder="Age in years"
                        value={form.age}
                        onChange={(e) => setForm({ ...form, age: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5
                                   text-sm focus:outline-none focus:ring-2
                                   focus:ring-blue-500/20 focus:border-blue-500"
                        min="0"
                        max="120"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Gender
                      </label>
                      <select
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5
                                   text-sm focus:outline-none focus:ring-2
                                   focus:ring-blue-500/20 appearance-none bg-white"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Blood Group + Phone */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Blood Group
                      </label>
                      <select
                        value={form.bloodGroup}
                        onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5
                                   text-sm focus:outline-none focus:ring-2
                                   focus:ring-blue-500/20 appearance-none bg-white"
                      >
                        <option value="">Select</option>
                        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Phone (optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="10-digit number"
                        value={form.phone}
                        onChange={(e) => setForm({
                          ...form,
                          phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                        })}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5
                                   text-sm focus:outline-none focus:ring-2
                                   focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Medical Notes (optional)
                    </label>
                    <textarea
                      placeholder="Allergies, conditions, medications..."
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5
                                 text-sm focus:outline-none focus:ring-2
                                 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200
                               text-sm font-medium text-gray-700 hover:bg-gray-50
                               transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onSave(form)}
                    disabled={!form.name.trim() || loading}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700
                               disabled:opacity-50 text-white text-sm font-semibold
                               transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/40
                                       border-t-white rounded-full animate-spin" />
                    ) : null}
                    {member ? 'Save Changes' : 'Add Member'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Edit Profile Modal ────────────────────────────────────────────────────────
function EditProfileModal({ isOpen, onClose, user, onSaved }) {
  const toast   = useToast()
  const [form,  setForm]    = useState({ name: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user && isOpen) {
      setForm({
        name:  user.name  || '',
        email: user.email || '',
        phone: user.phone || '',
      })
    }
  }, [user, isOpen])

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const res  = await fetch(`/api/users/${user.id}`, {
        method:      'PUT',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          name:  form.name.trim(),
          email: form.email.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Profile updated successfully')
        onSaved()
        onClose()
      } else {
        toast.error(json.error || 'Failed to update profile')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-2xl w-full max-w-sm"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            >
              <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-5">
                  Edit Profile
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5
                                 text-sm focus:outline-none focus:ring-2
                                 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5
                                 text-sm focus:outline-none focus:ring-2
                                 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      disabled
                      placeholder="Phone cannot be changed"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5
                                 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Phone number cannot be changed
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={onClose}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200
                               text-sm font-medium text-gray-700 hover:bg-gray-50
                               transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !form.name.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700
                               disabled:opacity-50 text-white text-sm font-semibold
                               transition-colors flex items-center justify-center gap-2"
                  >
                    {saving && (
                      <span className="w-4 h-4 border-2 border-white/40
                                       border-t-white rounded-full animate-spin" />
                    )}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Main Profile Page ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const router  = useRouter()
  const toast   = useToast()
  const mounted = useMounted()

  const [activeTab,       setActiveTab]       = useState('profile')
  const [editProfile,     setEditProfile]      = useState(false)
  const [familyModal,     setFamilyModal]      = useState(false)
  const [editingMember,   setEditingMember]    = useState(null)
  const [familyLoading,   setFamilyLoading]    = useState(false)
  const [familyMembers,   setFamilyMembers]    = useState([])
  const [loadingFamily,   setLoadingFamily]    = useState(false)
  const [bookingFilter,   setBookingFilter]    = useState('all')
  const [bookingPage,     setBookingPage]      = useState(1)

  // ── Fetch bookings ────────────────────────────────────────────────────────
  const bookingParams = new URLSearchParams({
    page:  bookingPage,
    limit: 10,
    ...(bookingFilter !== 'all' && { status: bookingFilter }),
  })

  const { data: bookingsData, isLoading: bookingsLoading } = useSWR(
    user ? `/api/bookings?${bookingParams}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const bookings   = bookingsData?.bookings || []
  const pagination = bookingsData?.pagination || {}

  // ── Load family members ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user || activeTab !== 'family') return
    loadFamilyMembers()
  }, [user, activeTab])

  const loadFamilyMembers = async () => {
    setLoadingFamily(true)
    try {
      const res  = await fetch(`/api/users/${user.id}/family`, {
        credentials: 'include',
      })
      const json = await res.json()
      if (json.success) {
        setFamilyMembers(json.data || [])
      }
    } catch {
      // Family API might not exist — show empty
      setFamilyMembers([])
    } finally {
      setLoadingFamily(false)
    }
  }

  // ── Add / Edit family member ──────────────────────────────────────────────
  const handleSaveFamilyMember = async (form) => {
    setFamilyLoading(true)
    try {
      const isEdit = !!editingMember
      const url    = isEdit
        ? `/api/users/${user.id}/family/${editingMember.id}`
        : `/api/users/${user.id}/family`

      const res  = await fetch(url, {
        method:      isEdit ? 'PUT' : 'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(form),
      })
      const json = await res.json()

      if (json.success) {
        toast.success(isEdit ? 'Member updated' : 'Family member added')
        setFamilyModal(false)
        setEditingMember(null)
        loadFamilyMembers()
      } else {
        toast.error(json.error || 'Failed to save')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setFamilyLoading(false)
    }
  }

  // ── Delete family member ──────────────────────────────────────────────────
  const handleDeleteMember = async (memberId) => {
    if (!confirm('Remove this family member?')) return
    try {
      const res  = await fetch(`/api/users/${user.id}/family/${memberId}`, {
        method:      'DELETE',
        credentials: 'include',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Family member removed')
        loadFamilyMembers()
      } else {
        toast.error(json.error || 'Failed to remove')
      }
    } catch {
      toast.error('Network error')
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent
                        rounded-full animate-spin" />
      </div>
    )
  }

  const initials = user.name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {/* ── Profile header ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-indigo-700
                     rounded-2xl p-6 mb-6 text-white"
          style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.3)' }}
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center
                            justify-center text-white font-bold text-xl flex-shrink-0
                            border-2 border-white/30">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{user.name}</h1>
              <div className="flex flex-wrap gap-3 mt-1">
                {user.phone && (
                  <span className="flex items-center gap-1 text-blue-100 text-sm">
                    <Phone className="w-3.5 h-3.5" />
                    +91 {user.phone}
                  </span>
                )}
                {user.email && (
                  <span className="flex items-center gap-1 text-blue-100 text-sm">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span className="text-xs bg-white/20 text-white px-2 py-0.5
                                 rounded-full capitalize">
                  {user.role?.replace(/_/g, ' ')}
                </span>
                {user.isVerified && (
                  <span className="ml-2 text-xs bg-emerald-500/30 text-emerald-100
                                   px-2 py-0.5 rounded-full">
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>

            {/* Edit button */}
            <button
              onClick={() => setEditProfile(true)}
              className="flex-shrink-0 w-9 h-9 bg-white/20 hover:bg-white/30
                         rounded-xl flex items-center justify-center transition-colors"
            >
              <Edit3 className="w-4 h-4 text-white" />
            </button>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <TabBtn
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            icon={User}
            label="Profile"
          />
          <TabBtn
            active={activeTab === 'bookings'}
            onClick={() => setActiveTab('bookings')}
            icon={Calendar}
            label="Bookings"
            count={pagination.total}
          />
          <TabBtn
            active={activeTab === 'family'}
            onClick={() => setActiveTab('family')}
            icon={Users}
            label="Family"
            count={familyMembers.length}
          />
          <TabBtn
            active={activeTab === 'account'}
            onClick={() => setActiveTab('account')}
            icon={Shield}
            label="Account"
          />
        </div>

        <AnimatePresence mode="wait">

          {/* ══ PROFILE TAB ══ */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Personal Info */}
              <SectionCard
                title="Personal Information"
                action={
                  <button
                    onClick={() => setEditProfile(true)}
                    className="flex items-center gap-1.5 text-xs font-medium
                               text-blue-600 hover:text-blue-700"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                }
              >
                <div className="space-y-3">
                  {[
                    {
                      icon:  User,
                      label: 'Full Name',
                      value: user.name,
                    },
                    {
                      icon:  Phone,
                      label: 'Phone Number',
                      value: user.phone ? `+91 ${user.phone}` : '—',
                    },
                    {
                      icon:  Mail,
                      label: 'Email Address',
                      value: user.email || '—',
                    },
                    {
                      icon:  Calendar,
                      label: 'Member Since',
                      value: mounted && user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                            dateStyle: 'medium',
                          })
                        : '—',
                    },
                  ].map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 py-2.5 border-b
                                 border-gray-50 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex
                                      items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Quick actions */}
              <SectionCard title="Quick Actions">
                <div className="space-y-2">
                  {[
                    {
                      icon:  Calendar,
                      label: 'My Bookings',
                      sub:   'View all appointments',
                      color: 'bg-blue-50 text-blue-600',
                      action:() => setActiveTab('bookings'),
                    },
                    {
                      icon:  Users,
                      label: 'Family Members',
                      sub:   'Manage family profiles',
                      color: 'bg-purple-50 text-purple-600',
                      action:() => setActiveTab('family'),
                    },
                    {
                      icon:  FileText,
                      label: 'My Invoices',
                      sub:   'Download invoices & receipts',
                      color: 'bg-green-50 text-green-600',
                      action:() => router.push('/user/invoices'),
                    },
                  ].map(({ icon: Icon, label, sub, color, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="w-full flex items-center gap-3 p-3 rounded-xl
                                 hover:bg-gray-50 transition-colors group"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center
                                       justify-center flex-shrink-0 ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-800">
                          {label}
                        </p>
                        <p className="text-xs text-gray-400">{sub}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300
                                               group-hover:text-gray-400" />
                    </button>
                  ))}
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ══ BOOKINGS TAB ══ */}
          {activeTab === 'bookings' && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Filter pills */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  { key: 'all',              label: 'All'       },
                  { key: 'confirmed',        label: 'Upcoming'  },
                  { key: 'completed',        label: 'Completed' },
                  { key: 'cancelled',        label: 'Cancelled' },
                  { key: 'pending_payment',  label: 'Pending'   },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => {
                      setBookingFilter(f.key)
                      setBookingPage(1)
                    }}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs
                                font-medium transition-all ${
                      bookingFilter === f.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Bookings list */}
              {bookingsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl border border-gray-100
                                 p-4 h-24 animate-pulse"
                    />
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <div
                  className="bg-white rounded-2xl border border-gray-100 p-12
                             text-center"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                  <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">
                    No bookings found
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Your appointments will appear here
                  </p>
                  <button
                    onClick={() => router.push('/hospitals')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl
                               text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Book Appointment
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking, i) => (
                    <motion.button
                      key={booking.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() =>
                        router.push(`/user/bookings/${booking.id}`)
                      }
                      className="w-full bg-white rounded-2xl border border-gray-100
                                 p-4 text-left hover:border-blue-200 hover:shadow-sm
                                 transition-all group"
                      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {/* Type icon */}
                          <div className="w-9 h-9 rounded-xl bg-gray-50 flex
                                          items-center justify-center flex-shrink-0
                                          mt-0.5">
                            <BookingTypeIcon type={booking.type} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {booking.bookingId}
                            </p>
                            <p className="text-xs text-gray-500 capitalize mt-0.5">
                              {booking.type === 'lab'
                                ? 'Lab Test'
                                : booking.type === 'online'
                                  ? 'Online Consultation'
                                  : 'Hospital Visit'}
                            </p>
                            {booking.startTime && mounted && (
                              <p className="text-xs text-gray-400 flex items-center
                                            gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                {new Date(booking.startTime).toLocaleDateString(
                                  'en-IN',
                                  { dateStyle: 'medium' }
                                )}{' '}
                                ·{' '}
                                {new Date(booking.startTime).toLocaleTimeString(
                                  'en-IN',
                                  { hour: '2-digit', minute: '2-digit' }
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5
                                        flex-shrink-0">
                          <Badge
                            variant={getStatusVariant(booking.status)}
                            size="sm"
                          >
                            {booking.status?.replace(/_/g, ' ')}
                          </Badge>
                          <p className="text-xs font-semibold text-gray-700">
                            {fmtRs(booking.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                        disabled={bookingPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-gray-200
                                   text-xs font-medium text-gray-600 disabled:opacity-40
                                   hover:bg-gray-50 transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-gray-500">
                        {bookingPage} / {pagination.pages}
                      </span>
                      <button
                        onClick={() =>
                          setBookingPage((p) =>
                            Math.min(pagination.pages, p + 1)
                          )
                        }
                        disabled={bookingPage === pagination.pages}
                        className="px-3 py-1.5 rounded-lg border border-gray-200
                                   text-xs font-medium text-gray-600 disabled:opacity-40
                                   hover:bg-gray-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ══ FAMILY TAB ══ */}
          {activeTab === 'family' && (
            <motion.div
              key="family"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl
                              p-4 flex items-start gap-3">
                <Users className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">
                    Family Members
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Add family members to book appointments on their behalf.
                  </p>
                </div>
              </div>

              {/* Add button */}
              <button
                onClick={() => {
                  setEditingMember(null)
                  setFamilyModal(true)
                }}
                className="w-full flex items-center justify-center gap-2 py-3
                           border-2 border-dashed border-blue-200 rounded-2xl
                           text-sm font-medium text-blue-600 hover:border-blue-400
                           hover:bg-blue-50 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Family Member
              </button>

              {/* Members list */}
              {loadingFamily ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl border border-gray-100
                                 p-4 h-20 animate-pulse"
                    />
                  ))}
                </div>
              ) : familyMembers.length === 0 ? (
                <div
                  className="bg-white rounded-2xl border border-gray-100
                             p-10 text-center"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                  <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">
                    No family members added yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Add your spouse, children, or parents
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {familyMembers.map((member, i) => {
                    const relation = RELATIONS.find(
                      (r) => r.key === member.relation
                    ) || RELATIONS[4]
                    const RelIcon  = relation.icon

                    return (
                      <motion.div
                        key={member.id || i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 p-4"
                        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-purple-100
                                          flex items-center justify-center
                                          flex-shrink-0">
                            <RelIcon className="w-5 h-5 text-purple-600" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">
                              {member.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400 capitalize">
                                {member.relation}
                              </span>
                              {member.age && (
                                <>
                                  <span className="text-gray-200">·</span>
                                  <span className="text-xs text-gray-400">
                                    {member.age} yrs
                                  </span>
                                </>
                              )}
                              {member.gender && (
                                <>
                                  <span className="text-gray-200">·</span>
                                  <span className="text-xs text-gray-400 capitalize">
                                    {member.gender}
                                  </span>
                                </>
                              )}
                              {member.bloodGroup && (
                                <>
                                  <span className="text-gray-200">·</span>
                                  <span className="text-xs font-medium
                                                   text-red-500">
                                    {member.bloodGroup}
                                  </span>
                                </>
                              )}
                            </div>
                            {member.notes && (
                              <p className="text-xs text-gray-400 mt-1 truncate">
                                📋 {member.notes}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => {
                                setEditingMember(member)
                                setFamilyModal(true)
                              }}
                              className="w-8 h-8 rounded-lg flex items-center
                                         justify-center text-gray-400
                                         hover:bg-gray-100 hover:text-gray-600
                                         transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMember(member.id)}
                              className="w-8 h-8 rounded-lg flex items-center
                                         justify-center text-gray-400
                                         hover:bg-red-50 hover:text-red-500
                                         transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ══ ACCOUNT TAB ══ */}
          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Account Status */}
              <SectionCard title="Account Status">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Account Verification
                    </span>
                    {user.isVerified ? (
                      <span className="flex items-center gap-1.5 text-xs
                                       font-medium text-emerald-600">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs
                                       font-medium text-amber-600">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Not Verified
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Account Status</span>
                    {user.isBlocked ? (
                      <span className="flex items-center gap-1.5 text-xs
                                       font-medium text-red-600">
                        <XCircle className="w-3.5 h-3.5" />
                        Blocked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs
                                       font-medium text-emerald-600">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Role</span>
                    <span className="text-xs font-medium text-gray-700
                                     capitalize bg-gray-100 px-2 py-0.5 rounded-full">
                      {user.role?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {mounted && user.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Joined</span>
                      <span className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('en-IN', {
                          dateStyle: 'long',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Danger zone */}
              <SectionCard title="Account Actions">
                <div className="space-y-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-xl
                               hover:bg-red-50 transition-colors group text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center
                                    justify-center flex-shrink-0">
                      <LogOut className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-600">
                        Sign Out
                      </p>
                      <p className="text-xs text-gray-400">
                        Sign out of your MEDLI account
                      </p>
                    </div>
                  </button>
                </div>
              </SectionCard>

              {/* Support */}
              <div className="text-center py-4">
                <p className="text-xs text-gray-400">
                  Need help?{' '}
                  <a
                    href="mailto:support@medli.in"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    support@medli.in
                  </a>
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <Footer />

      {/* ── Modals ── */}
      <EditProfileModal
        isOpen={editProfile}
        onClose={() => setEditProfile(false)}
        user={user}
        onSaved={refreshUser}
      />

      <FamilyMemberModal
        isOpen={familyModal}
        onClose={() => {
          setFamilyModal(false)
          setEditingMember(null)
        }}
        onSave={handleSaveFamilyMember}
        member={editingMember}
        loading={familyLoading}
      />
    </div>
  )
}