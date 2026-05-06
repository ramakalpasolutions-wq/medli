// src/app/(public)/page.js
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import HospitalCard from '@/components/public/HospitalCard'
import LabCard from '@/components/public/LabCard'
import { useGeoLocation } from '@/hooks/useGeoLocation'
import {
  Search, MapPin, Building2, FlaskConical, Stethoscope,
  Calendar, Loader2, ArrowRight, Star, Shield, Clock,
  Heart, CheckCircle, ChevronRight, Sparkles, Zap,
  Video, FileText, AlertCircle, RefreshCw,
} from 'lucide-react'

const fetcher = (url) =>
  fetch(url)
    .then((r) => r.json())
    .then((j) => {
      if (!j.success) throw new Error(j.error || 'Failed to fetch')
      return j.data
    })

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
  const [count,   setCount]   = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const steps     = 60
    const stepTime  = duration / steps
    const increment = target / steps
    let current     = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [started, target, duration])

  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>
}

// ── Animated hero words ───────────────────────────────────────────────────────
const WORDS = ['Healthcare', 'Appointments', 'Lab Tests', 'Consultations', 'Wellness']

function AnimatedHeroText() {
  const [idx,     setIdx]     = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const t = setInterval(() => setIdx((i) => (i + 1) % WORDS.length), 2500)
    return () => clearInterval(t)
  }, [])

  if (!mounted) {
    return <span className="text-blue-200">Healthcare</span>
  }

  return (
    <span className="inline-block min-w-[240px] text-transparent bg-clip-text
                     bg-gradient-to-r from-blue-200 to-cyan-200">
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 20,  filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0,   filter: 'blur(0px)' }}
          exit={{    opacity: 0, y: -20, filter: 'blur(8px)' }}
          transition={{ duration: 0.4 }}
          className="inline-block"
        >
          {WORDS[idx]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

// ── Floating particle ─────────────────────────────────────────────────────────
function FloatingParticle({ delay, size, left, top }) {
  return (
    <motion.div
      className="absolute rounded-full bg-white/10"
      style={{ width: size, height: size, left, top }}
      animate={{
        y:       [0, -30, 0],
        x:       [0, 15, 0],
        opacity: [0.1, 0.3, 0.1],
        scale:   [1, 1.2, 1],
      }}
      transition={{
        duration: 5 + Math.random() * 3,
        repeat:   Infinity,
        delay,
        ease:     'easeInOut',
      }}
    />
  )
}

// ── Nearby section skeleton ───────────────────────────────────────────────────
function NearbySkeletonRow() {
  return (
    <div className="overflow-x-auto flex gap-4 pb-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex-shrink-0 w-72 h-52 bg-gray-100 rounded-2xl animate-pulse"
        />
      ))}
    </div>
  )
}

// ── Nearby error state ────────────────────────────────────────────────────────
function NearbyError({ type, onRetry }) {
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-100
                    rounded-2xl p-4 text-sm text-red-600">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">
        Could not load nearby {type}. Check your location permissions.
      </span>
      <button
        onClick={onRetry}
        className="flex items-center gap-1 text-xs font-medium text-red-600
                   hover:text-red-700"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry
      </button>
    </div>
  )
}

// ── Location permission prompt ────────────────────────────────────────────────
function LocationPrompt({ onAllow }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-center gap-4 bg-blue-50
                 border border-blue-200 rounded-2xl p-5"
    >
      <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center
                      justify-center flex-shrink-0">
        <MapPin className="w-6 h-6 text-blue-600" />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <p className="text-sm font-semibold text-blue-800">
          Enable Location Access
        </p>
        <p className="text-xs text-blue-600 mt-0.5">
          Allow location to see hospitals and labs near you
        </p>
      </div>
      <button
        onClick={onAllow}
        className="flex-shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700
                   text-white text-sm font-semibold rounded-xl transition-colors
                   flex items-center gap-2"
      >
        <MapPin className="w-4 h-4" />
        Allow Location
      </button>
    </motion.div>
  )
}

// ── Distance formatter ────────────────────────────────────────────────────────
function formatDistance(meters) {
  if (!meters) return ''
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

// ── Hospital card (nearby version with distance) ──────────────────────────────
function NearbyHospitalCard({ hospital, onClick }) {
  const dist = formatDistance(hospital.distance)

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={onClick}
      className="flex-shrink-0 w-72 bg-white rounded-2xl border border-gray-100
                 overflow-hidden cursor-pointer group hover:shadow-lg
                 hover:border-blue-100 transition-all"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      {/* Cover image or gradient */}
      <div className="h-32 bg-gradient-to-br from-blue-100 to-indigo-100
                      relative overflow-hidden">
        {hospital.images?.cover ? (
          <img
            src={hospital.images.cover}
            alt={hospital.name}
            className="w-full h-full object-cover group-hover:scale-105
                       transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-10 h-10 text-blue-300" />
          </div>
        )}

        {/* Distance badge */}
        {dist && (
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm
                          rounded-full px-2.5 py-1 flex items-center gap-1
                          text-xs font-semibold text-gray-700">
            <MapPin className="w-3 h-3 text-blue-500" />
            {dist}
          </div>
        )}

        {/* Logo */}
        {hospital.images?.logo && (
          <div className="absolute -bottom-4 left-3 w-10 h-10 rounded-xl
                          bg-white border-2 border-white overflow-hidden shadow-sm">
            <img
              src={hospital.images.logo}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <div className="p-4 pt-5">
        <h3 className="text-sm font-bold text-gray-900 truncate">
          {hospital.name}
        </h3>

        {hospital.address?.city && (
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {hospital.address.city}
            {hospital.address.state ? `, ${hospital.address.state}` : ''}
          </p>
        )}

        {/* Rating */}
        {hospital.rating?.average > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-gray-700">
              {hospital.rating.average.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">
              ({hospital.rating.count})
            </span>
          </div>
        )}

        {/* Departments */}
        {hospital.departments?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {hospital.departments.slice(0, 2).map((d) => (
              <span
                key={d}
                className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"
              >
                {d}
              </span>
            ))}
            {hospital.departments.length > 2 && (
              <span className="text-xs text-gray-400">
                +{hospital.departments.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Book button */}
        <button
          className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white
                     text-xs font-semibold rounded-xl transition-colors"
        >
          Book Now
        </button>
      </div>
    </motion.div>
  )
}

// ── Lab card (nearby version with distance) ───────────────────────────────────
function NearbyLabCard({ lab, onClick }) {
  const dist = formatDistance(lab.distance)

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={onClick}
      className="flex-shrink-0 w-72 bg-white rounded-2xl border border-gray-100
                 overflow-hidden cursor-pointer group hover:shadow-lg
                 hover:border-emerald-100 transition-all"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      {/* Cover */}
      <div className="h-32 bg-gradient-to-br from-emerald-50 to-green-100
                      relative overflow-hidden">
        {lab.images?.cover ? (
          <img
            src={lab.images.cover}
            alt={lab.name}
            className="w-full h-full object-cover group-hover:scale-105
                       transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FlaskConical className="w-10 h-10 text-emerald-300" />
          </div>
        )}

        {/* Distance badge */}
        {dist && (
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm
                          rounded-full px-2.5 py-1 flex items-center gap-1
                          text-xs font-semibold text-gray-700">
            <MapPin className="w-3 h-3 text-emerald-500" />
            {dist}
          </div>
        )}

        {/* Home collection badge */}
        {lab.homeCollection?.enabled && (
          <div className="absolute top-2 left-2 bg-emerald-500 text-white
                          rounded-full px-2.5 py-0.5 text-xs font-semibold">
            🏠 Home Collection
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-sm font-bold text-gray-900 truncate">{lab.name}</h3>

        {lab.address?.city && (
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {lab.address.city}
          </p>
        )}

        {/* Rating */}
        {lab.rating?.average > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-gray-700">
              {lab.rating.average.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">
              ({lab.rating.count})
            </span>
          </div>
        )}

        {/* Certifications */}
        {lab.certifications?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {lab.certifications.slice(0, 2).map((c) => (
              <span
                key={c}
                className="text-xs bg-emerald-50 text-emerald-600
                           px-2 py-0.5 rounded-full font-medium"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <button
          className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700
                     text-white text-xs font-semibold rounded-xl transition-colors"
        >
          Book Test
        </button>
      </div>
    </motion.div>
  )
}

// ── Static data ───────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    id:      'qa-hospitals',
    emoji:   '🏥',
    label:   'Find Hospitals',
    sub:     'Book appointments nearby',
    href:    '/hospitals',
    gradient:'from-blue-500 to-blue-600',
  },
  {
    id:      'qa-labs',
    emoji:   '🧪',
    label:   'Book Lab Tests',
    sub:     'Home collection available',
    href:    '/labs',
    gradient:'from-emerald-500 to-green-600',
  },
  {
    id:      'qa-online',
    emoji:   '👨‍⚕️',
    label:   'Online Consult',
    sub:     'Video call with doctors',
    href:    '/doctors',
    gradient:'from-purple-500 to-violet-600',
  },
  {
    id:      'qa-reports',
    emoji:   '📋',
    label:   'My Reports',
    sub:     'Download lab reports',
    href:    '/user/bookings',
    gradient:'from-orange-500 to-amber-600',
  },
]

const STEPS = [
  {
    id:    'step-1',
    step:  '01',
    icon:  Search,
    title: 'Search & Discover',
    desc:  'Find top-rated hospitals, labs and doctors near you with real-time availability.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id:    'step-2',
    step:  '02',
    icon:  Calendar,
    title: 'Book Instantly',
    desc:  'Select your preferred date, time slot and book in seconds. No waiting.',
    color: 'from-purple-500 to-violet-600',
  },
  {
    id:    'step-3',
    step:  '03',
    icon:  Shield,
    title: 'Pay Securely',
    desc:  'Pay via 1Pay gateway. Get instant confirmation and smart reminders.',
    color: 'from-emerald-500 to-green-600',
  },
]

const STATS = [
  { id: 's1', value: 500,   suffix: '+', label: 'Hospitals',       icon: Building2,    color: 'from-blue-500    to-blue-600'    },
  { id: 's2', value: 200,   suffix: '+', label: 'Labs',            icon: FlaskConical, color: 'from-emerald-500 to-green-600'   },
  { id: 's3', value: 2000,  suffix: '+', label: 'Doctors',         icon: Stethoscope,  color: 'from-purple-500  to-violet-600'  },
  { id: 's4', value: 50000, suffix: '+', label: 'Patients Served', icon: Heart,        color: 'from-rose-500    to-pink-600'    },
]

const TRUST_BADGES = [
  { id: 'tb1', icon: Shield,      label: 'Verified Providers'  },
  { id: 'tb2', icon: Clock,       label: 'Instant Booking'     },
  { id: 'tb3', icon: Star,        label: '4.8★ Average Rating' },
  { id: 'tb4', icon: CheckCircle, label: 'Secure Payments'     },
]

const TESTIMONIALS = [
  {
    id:     't1',
    name:   'Priya Sharma',
    role:   'Patient',
    avatar: 'P',
    text:   'Booked a cardiologist in 2 minutes. The doctor was amazing and the platform is so smooth!',
    rating: 5,
  },
  {
    id:     't2',
    name:   'Rajesh Kumar',
    role:   'Father of 2',
    avatar: 'R',
    text:   'Lab test with home collection was super convenient. Got reports same day. Highly recommend.',
    rating: 5,
  },
  {
    id:     't3',
    name:   'Ananya Patel',
    role:   'Working Professional',
    avatar: 'A',
    text:   'Online consultation saved me a hospital trip. Great video quality and very helpful doctor.',
    rating: 5,
  },
]

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter()
  const geo    = useGeoLocation()

  const [query,   setQuery]   = useState('')
  const [mounted, setMounted] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const heroY       = useTransform(scrollYProgress, [0, 1], [0, 60])

  useEffect(() => { setMounted(true) }, [])

  // ── Nearby API URLs ─────────────────────────────────────────────────────────
  const nearbyHospitalsUrl = geo.lat && geo.lng
    ? `/api/hospitals/nearby?lat=${geo.lat}&lng=${geo.lng}&radius=15000&_r=${retryKey}`
    : null

  const nearbyLabsUrl = geo.lat && geo.lng
    ? `/api/labs/nearby?lat=${geo.lat}&lng=${geo.lng}&radius=15000&_r=${retryKey}`
    : null

  const {
    data: nearbyHospitals,
    error: hospitalsError,
    isLoading: hospitalsLoading,
  } = useSWR(nearbyHospitalsUrl, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  const {
    data: nearbyLabs,
    error: labsError,
    isLoading: labsLoading,
  } = useSWR(nearbyLabsUrl, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleAllowLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Reload to trigger geo hook
          window.location.reload()
        },
        (err) => {
          alert('Could not get location. Please allow in browser settings.')
        }
      )
    }
  }

  // Show nearby section if: loading, has data, or has error (to show error state)
  const showNearby = geo.loading || geo.lat || (!geo.loading && !geo.lat)

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      {/* ══════════════════════════════════════════════════════════════════
          HERO
          ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative min-h-[680px] flex items-center pt-16 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600
                        via-blue-700 to-indigo-900" />

        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.4) 0%, transparent 50%)
            `,
          }}
        />

        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {mounted && (
            <>
              <FloatingParticle delay={0}   size={60} left="10%" top="20%" />
              <FloatingParticle delay={0.5} size={40} left="25%" top="60%" />
              <FloatingParticle delay={1}   size={80} left="45%" top="30%" />
              <FloatingParticle delay={1.5} size={50} left="65%" top="70%" />
              <FloatingParticle delay={2}   size={70} left="80%" top="25%" />
              <FloatingParticle delay={2.5} size={45} left="90%" top="55%" />
            </>
          )}
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm
                           border border-white/20 rounded-full px-4 py-1.5 mb-6"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-xs font-medium text-blue-100">
                  Trusted by 50,000+ patients across India
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold
                           text-white leading-[1.1] mb-6"
              >
                Book Your
                <br />
                <AnimatedHeroText />
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r
                                 from-cyan-300 to-blue-300">
                  Without the Wait
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-blue-100/90 text-lg mb-8 max-w-lg leading-relaxed"
              >
                India&apos;s trusted platform for hospital appointments, lab tests
                and online doctor consultations — all in one place.
              </motion.p>

              {/* Search */}
              <motion.form
                onSubmit={handleSearch}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-2 flex gap-2 max-w-lg"
                style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
              >
                <div className="flex items-center gap-2 flex-1 px-3">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search hospitals, labs, doctors..."
                    className="flex-1 text-sm text-gray-700 placeholder-gray-400
                               focus:outline-none bg-transparent"
                    style={{ minHeight: 44 }}
                  />
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3
                                border-l border-gray-200">
                  {geo.loading
                    ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    : <MapPin  className="w-4 h-4 text-blue-500" />}
                  <span className="text-xs text-gray-500 max-w-[80px] truncate">
                    {geo.address
                      ? geo.address.split(',')[0]
                      : geo.loading
                        ? 'Detecting...'
                        : 'Near me'}
                  </span>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white
                             text-sm font-semibold rounded-xl transition-all
                             flex-shrink-0 flex items-center gap-2"
                  style={{ minHeight: 44 }}
                >
                  Search <ArrowRight className="w-4 h-4" />
                </button>
              </motion.form>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap items-center gap-4 mt-6"
              >
                {TRUST_BADGES.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-1.5 text-blue-200/80"
                  >
                    <badge.icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{badge.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: floating cards */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="hidden lg:block relative h-[440px]"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-0 right-0 bg-white/95 rounded-2xl p-5 w-64"
                style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex
                                  items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">500+ Hospitals</p>
                    <p className="text-xs text-gray-400">Verified and rated</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">4.8 avg</span>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute top-32 left-0 bg-white/95 rounded-2xl p-5 w-60"
                style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex
                                  items-center justify-center">
                    <FlaskConical className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Home Collection</p>
                    <p className="text-xs text-gray-400">Lab tests at your door</p>
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-xl px-3 py-2 text-xs
                                text-emerald-700 font-medium">
                  ✓ Free pickup · Same-day reports
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute bottom-0 right-8 bg-white/95 rounded-2xl p-5 w-56"
                style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex
                                  items-center justify-center">
                    <Video className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Video Consult</p>
                    <p className="text-xs text-gray-400">Talk to doctors live</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-gray-500">2,000+ doctors online</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════
          QUICK ACTIONS
          ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10
                          relative z-10 mb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((item, i) => (
            <motion.a
              key={item.id}
              href={item.href}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-2xl p-6 border border-gray-100
                         cursor-pointer block group relative overflow-hidden"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient}
                               opacity-0 group-hover:opacity-[0.03]
                               transition-opacity duration-300`} />
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br
                               ${item.gradient} flex items-center justify-center
                               mb-4 shadow-lg text-2xl`}>
                {item.emoji}
              </div>
              <p className="text-sm font-bold text-gray-800 mb-1">{item.label}</p>
              <p className="text-xs text-gray-400 mb-3">{item.sub}</p>
              <div className="flex items-center gap-1 text-xs font-medium
                              text-blue-600 opacity-0 group-hover:opacity-100
                              transition-opacity">
                Explore <ChevronRight className="w-3 h-3" />
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          NEARBY HOSPITALS
          ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Section header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 flex
                             items-center gap-2">
                <span className="text-2xl">🏥</span>
                Hospitals Near You
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {geo.lat
                  ? 'Top-rated hospitals within 15km of your location'
                  : 'Allow location to see nearby hospitals'}
              </p>
            </div>
            <a
              href="/hospitals"
              className="flex items-center gap-1.5 text-sm text-blue-600
                         font-semibold hover:text-blue-700 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* States */}
          {!mounted || geo.loading ? (
            // Loading location
            <div className="flex items-center gap-3 bg-blue-50 rounded-2xl p-4">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
              <span className="text-sm text-blue-600">
                Detecting your location...
              </span>
            </div>
          ) : !geo.lat ? (
            // No location permission
            <LocationPrompt onAllow={handleAllowLocation} />
          ) : hospitalsLoading ? (
            // Loading hospitals
            <NearbySkeletonRow />
          ) : hospitalsError ? (
            // Error
            <NearbyError
              type="hospitals"
              onRetry={() => setRetryKey((k) => k + 1)}
            />
          ) : !nearbyHospitals || nearbyHospitals.length === 0 ? (
            // No hospitals found
            <div className="flex items-center gap-3 bg-gray-50 border
                            border-gray-100 rounded-2xl p-5">
              <Building2 className="w-8 h-8 text-gray-200 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  No hospitals found within 15km
                </p>
                <a
                  href="/hospitals"
                  className="text-xs text-blue-600 hover:underline mt-0.5 block"
                >
                  Browse all hospitals →
                </a>
              </div>
            </div>
          ) : (
            // Show hospitals
            <div className="overflow-x-auto -mx-2 px-2">
              <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
                {nearbyHospitals.map((h, idx) => (
                  <NearbyHospitalCard
                    key={h.id || `h-${idx}`}
                    hospital={h}
                    onClick={() => router.push(`/hospitals/${h.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          NEARBY LABS
          ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 flex
                             items-center gap-2">
                <span className="text-2xl">🧪</span>
                Labs Near You
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {geo.lat
                  ? 'Trusted labs with home collection within 15km'
                  : 'Allow location to see nearby labs'}
              </p>
            </div>
            <a
              href="/labs"
              className="flex items-center gap-1.5 text-sm text-emerald-600
                         font-semibold hover:text-emerald-700 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {!mounted || geo.loading ? (
            <div className="flex items-center gap-3 bg-emerald-50 rounded-2xl p-4">
              <Loader2 className="w-5 h-5 text-emerald-500 animate-spin flex-shrink-0" />
              <span className="text-sm text-emerald-600">
                Detecting your location...
              </span>
            </div>
          ) : !geo.lat ? (
            <LocationPrompt onAllow={handleAllowLocation} />
          ) : labsLoading ? (
            <NearbySkeletonRow />
          ) : labsError ? (
            <NearbyError
              type="labs"
              onRetry={() => setRetryKey((k) => k + 1)}
            />
          ) : !nearbyLabs || nearbyLabs.length === 0 ? (
            <div className="flex items-center gap-3 bg-gray-50 border
                            border-gray-100 rounded-2xl p-5">
              <FlaskConical className="w-8 h-8 text-gray-200 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  No labs found within 15km
                </p>
                <a
                  href="/labs"
                  className="text-xs text-emerald-600 hover:underline mt-0.5 block"
                >
                  Browse all labs →
                </a>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 px-2">
              <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
                {nearbyLabs.map((l, idx) => (
                  <NearbyLabCard
                    key={l.id || `l-${idx}`}
                    lab={l}
                    onClick={() => router.push(`/labs/${l.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HOW IT WORKS
          ══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px]
                        h-[600px] rounded-full bg-blue-50/60 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-blue-50 rounded-full
                            px-4 py-1.5 mb-4">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-blue-600">
                Simple Process
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              How MEDLI Works
            </h2>
            <p className="text-gray-500 text-base max-w-md mx-auto">
              Book your healthcare in 3 simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-14 left-[18%]
                            right-[18%] h-0.5 bg-gradient-to-r
                            from-blue-200 via-purple-200 to-emerald-200" />

            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  viewport={{ once: true }}
                >
                  <div className="bg-white rounded-3xl p-8 border border-gray-100
                                  hover:shadow-lg transition-all group"
                    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                  >
                    <div className="relative mb-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br
                                       ${s.color} flex items-center justify-center
                                       shadow-lg group-hover:scale-110 transition-all`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full
                                       bg-gray-900 text-white text-xs font-bold
                                       flex items-center justify-center">
                        {s.step}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          STATS
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-blue-900
                          relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10
                        rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10
                        rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-extrabold text-white mb-2">
              Numbers That Speak
            </h2>
            <p className="text-gray-400">Growing every day with your trust</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br
                                   ${s.color} flex items-center justify-center
                                   mx-auto mb-4 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-white mb-1">
                    <AnimatedCounter
                      target={s.value}
                      suffix={s.suffix}
                      duration={2500}
                    />
                  </p>
                  <p className="text-sm text-gray-400 font-medium">{s.label}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TESTIMONIALS
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-purple-50
                            rounded-full px-4 py-1.5 mb-4">
              <Heart className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs font-semibold text-purple-600">
                Patient Stories
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              What Our Patients Say
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-6 border border-gray-100
                           hover:shadow-lg transition-all"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
              >
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s}
                      className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br
                                  from-blue-500 to-purple-600 flex items-center
                                  justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          CTA
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-blue-600 to-indigo-700
                       rounded-3xl p-10 sm:p-14 text-center overflow-hidden"
            style={{ boxShadow: '0 20px 60px rgba(37,99,235,0.25)' }}
          >
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full
                            bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full
                            bg-white/5 pointer-events-none" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Ready to Book Your First Appointment?
              </h2>
              <p className="text-blue-100 text-base mb-8 max-w-lg mx-auto">
                Join 50,000+ patients who trust MEDLI. Takes less than 2 minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center
                              justify-center gap-4">
                <a href="/hospitals"
                  className="px-8 py-3.5 bg-white text-blue-600 rounded-xl
                             text-sm font-bold hover:bg-blue-50 transition-all
                             flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Find Hospitals
                </a>
                <a href="/auth/register"
                  className="px-8 py-3.5 bg-white/10 border border-white/30
                             text-white rounded-xl text-sm font-bold
                             hover:bg-white/20 transition-all flex items-center gap-2">
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}