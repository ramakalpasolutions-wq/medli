'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import HospitalCard from '@/components/public/HospitalCard'
import LabCard from '@/components/public/LabCard'
import StatsCard from '@/components/ui/StatsCard'
import { useGeoLocation } from '@/hooks/useGeoLocation'
import {
  Search,
  MapPin,
  Building2,
  FlaskConical,
  Stethoscope,
  Calendar,
  Loader2,
} from 'lucide-react'

const fetcher = (url) => fetch(url).then((r) => r.json()).then((j) => j.data)

// ─── Extract stable string ID from MongoDB document ───────────────────────────
function extractId(doc) {
  if (!doc) return null
  // Prisma $runCommandRaw returns _id as { $oid: "..." }
  if (doc._id && typeof doc._id === 'object' && doc._id.$oid) {
    return doc._id.$oid
  }
  // Already a string
  if (doc._id && typeof doc._id === 'string') return doc._id
  // Prisma normal query returns id
  if (doc.id && typeof doc.id === 'string') return doc.id
  // Fallback: stringify whatever is there
  return JSON.stringify(doc._id || doc.id || Math.random())
}

// ─── Animated hero word ────────────────────────────────────────────────────────
const WORDS = ['Healthcare', 'Appointments', 'Lab Tests', 'Consultations']

function AnimatedHeroText() {
  const [wordIndex, setWordIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const t = setInterval(() => {
      setWordIndex((i) => (i + 1) % WORDS.length)
    }, 2500)
    return () => clearInterval(t)
  }, [])

  // Render static text on server / before mount to avoid hydration mismatch
  if (!mounted) {
    return <span className="text-blue-200 inline-block">Healthcare</span>
  }

  return (
    <span className="text-blue-200 inline-block min-w-[220px]">
      <AnimatePresence mode="wait">
        <motion.span
          key={wordIndex}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35 }}
          className="inline-block"
        >
          {WORDS[wordIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

// ─── Static data ──────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    id:    'qa-hospitals',
    icon:  '🏥',
    label: 'Find Hospitals',
    sub:   'Book appointments',
    href:  '/hospitals',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id:    'qa-labs',
    icon:  '🧪',
    label: 'Book Lab Tests',
    sub:   'Home collection available',
    href:  '/labs',
    color: 'from-green-500 to-green-600',
  },
  {
    id:    'qa-online',
    icon:  '👨‍⚕️',
    label: 'Online Consult',
    sub:   'Video call doctors',
    href:  '/doctors',
    color: 'from-purple-500 to-purple-600',
  },
  {
    id:    'qa-reports',
    icon:  '💊',
    label: 'Check Reports',
    sub:   'Download instantly',
    href:  '/user/bookings',
    color: 'from-orange-500 to-orange-600',
  },
]

const STEPS = [
  {
    id:    'step-1',
    step:  '01',
    title: 'Search & Discover',
    desc:  'Find hospitals, labs and doctors near you with real-time availability.',
  },
  {
    id:    'step-2',
    step:  '02',
    title: 'Book Instantly',
    desc:  'Select your preferred slot and book with a few taps.',
  },
  {
    id:    'step-3',
    step:  '03',
    title: 'Pay Securely',
    desc:  'Pay online securely. Get instant confirmation and reminders.',
  },
]

const STATS = [
  {
    id:     'stat-hospitals',
    value:  500,
    suffix: '+',
    label:  'Hospitals',
    color:  'blue',
    icon:   'building',
  },
  {
    id:     'stat-labs',
    value:  200,
    suffix: '+',
    label:  'Labs',
    color:  'green',
    icon:   'flask',
  },
  {
    id:     'stat-doctors',
    value:  2000,
    suffix: '+',
    label:  'Doctors',
    color:  'purple',
    icon:   'stethoscope',
  },
  {
    id:     'stat-patients',
    value:  50000,
    suffix: '+',
    label:  'Patients Served',
    color:  'orange',
    icon:   'calendar',
  },
]

function StatIcon({ icon }) {
  if (icon === 'building')    return <Building2 className="w-5 h-5" />
  if (icon === 'flask')       return <FlaskConical className="w-5 h-5" />
  if (icon === 'stethoscope') return <Stethoscope className="w-5 h-5" />
  if (icon === 'calendar')    return <Calendar className="w-5 h-5" />
  return null
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router  = useRouter()
  const geo     = useGeoLocation()
  const [query, setQuery] = useState('')

  const nearbyHospitalsUrl =
    geo.lat && geo.lng
      ? `/api/hospitals/nearby?lat=${geo.lat}&lng=${geo.lng}&radius=10000`
      : null

  const nearbyLabsUrl =
    geo.lat && geo.lng
      ? `/api/labs/nearby?lat=${geo.lat}&lng=${geo.lng}&radius=10000`
      : null

  const { data: nearbyHospitals } = useSWR(nearbyHospitalsUrl, fetcher)
  const { data: nearbyLabs }      = useSWR(nearbyLabsUrl, fetcher)

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[600px] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center pt-16">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={`circle-${i}`}
              className="absolute rounded-full bg-white/5"
              style={{
                width:  80 + i * 60,
                height: 80 + i * 60,
                left:   `${10 + i * 15}%`,
                top:    `${20 + (i % 3) * 25}%`,
              }}
              animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
              transition={{ duration: 6 + i, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
              Book <AnimatedHeroText />
              <br />
              <span className="text-blue-200">Without the Wait</span>
            </h1>

            {/* ✅ Fix: plain text, no &amp; or HTML entities */}
            <p className="text-blue-100 text-lg mb-10 max-w-xl">
              India&apos;s trusted platform for hospital appointments, lab tests
              and online doctor consultations.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-3 flex gap-3 max-w-2xl"
          >
            <div className="flex items-center gap-2 flex-1 px-3">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search hospitals, labs, doctors..."
                className="flex-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
                style={{ minHeight: 44 }}
              />
            </div>

            <div className="flex items-center gap-1.5 px-3 border-l border-gray-200">
              {geo.loading ? (
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 text-blue-500" />
              )}
              <span className="text-xs text-gray-500 max-w-[100px] truncate">
                {geo.address
                  ? geo.address.split(',')[0]
                  : geo.loading
                  ? 'Detecting...'
                  : 'Near me'}
              </span>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
              style={{ minHeight: 44 }}
            >
              Search
            </button>
          </motion.form>
        </div>
      </section>

      {/* ── QUICK ACTIONS ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 mb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((item, i) => (
            <motion.a
              key={item.id}
              href={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 cursor-pointer block"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl mb-3`}
              >
                {item.icon}
              </div>
              <p className="text-sm font-bold text-gray-800 mb-0.5">{item.label}</p>
              <p className="text-xs text-gray-400">{item.sub}</p>
            </motion.a>
          ))}
        </div>
      </section>

           {/* ── NEARBY HOSPITALS ──────────────────────────────────────────────── */}
      {Array.isArray(nearbyHospitals) && nearbyHospitals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Nearby Hospitals</h2>
            <a href="/hospitals" className="text-sm text-blue-600 font-medium hover:underline">
              View all
            </a>
          </div>
          <div className="overflow-x-auto flex gap-4 pb-4">
            {nearbyHospitals.map((h, idx) => (
              <HospitalCard
                key={h.id || `hospital-${idx}`}
                hospital={h}
                onClick={() => router.push(`/hospitals/${h.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── NEARBY LABS ───────────────────────────────────────────────────── */}
      {Array.isArray(nearbyLabs) && nearbyLabs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Nearby Labs</h2>
            <a href="/labs" className="text-sm text-green-600 font-medium hover:underline">
              View all
            </a>
          </div>
          <div className="overflow-x-auto flex gap-4 pb-4">
            {nearbyLabs.map((l, idx) => (
              <LabCard
                key={l.id || `lab-${idx}`}
                lab={l}
                onClick={() => router.push(`/labs/${l.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              How MEDLI Works
            </h2>
            <p className="text-gray-500 mt-2">Book healthcare in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 border border-gray-100"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-sm mb-4">
                  {s.step}
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <StatsCard
                  title={s.label}
                  value={s.value}
                  suffix={s.suffix}
                  color={s.color}
                  icon={<StatIcon icon={s.icon} />}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}