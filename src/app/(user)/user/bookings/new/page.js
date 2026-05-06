// src/app/(user)/user/bookings/new/page.js
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import BookingStepper from '@/components/booking/BookingStepper'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Navbar from '@/components/public/Navbar'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/hooks/useAuth'
import {
  Check, Tag, User, Users, Building2,
  Video, Calendar, Clock, Home, MapPin,
} from 'lucide-react'
import useSWR from 'swr'

// ── useMounted: prevents hydration mismatch ───────────────────────────────────
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

function PriceRow({ label, value, green, bold }) {
  return (
    <div className={
      bold
        ? 'flex justify-between py-1.5 border-t border-gray-200 mt-1 pt-2.5'
        : 'flex justify-between py-1.5'
    }>
      <span className={bold ? 'text-sm font-bold text-gray-800' : 'text-sm text-gray-500'}>
        {label}
      </span>
      <span className={
        green
          ? 'text-sm font-semibold text-green-600'
          : bold
            ? 'text-sm font-semibold text-blue-600'
            : 'text-sm font-semibold text-gray-800'
      }>
        {value}
      </span>
    </div>
  )
}

// ── Main booking content ──────────────────────────────────────────────────────
function NewBookingContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const toast        = useToast()
  const { user }     = useAuth()
  const mounted      = useMounted()

  const [step,           setStep]           = useState(1)
  const [bookingId,      setBookingId]      = useState(null)
  const [couponCode,     setCouponCode]     = useState('')
  const [couponResult,   setCouponResult]   = useState(null)
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [loading,        setLoading]        = useState(false)
  const [patientType,    setPatientType]    = useState('myself')
  const [patientName,    setPatientName]    = useState('')

  // Lab collection state
  const [collectionType,    setCollectionType]    = useState('walk_in')
  const [collectionAddress, setCollectionAddress] = useState({
    line1: '', city: '', pinCode: '',
  })
  const [collectionDate, setCollectionDate] = useState('')
  const [collectionTime, setCollectionTime] = useState('')

  // ── URL params ──────────────────────────────────────────────────────────────
  const doctorId = searchParams.get('doctorId')
  const labId    = searchParams.get('labId')
  const testIds  = searchParams.get('testIds')?.split(',').filter(Boolean) || []
  const date     = searchParams.get('date')
  const slot     = searchParams.get('slot')
  const type     = searchParams.get('type') || 'offline'

  const isLab    = !!labId
  const isOnline = type === 'online'

  const doctorStartTime = date && slot
    ? new Date(`${date}T${slot}:00`).toISOString()
    : null
  const doctorEndTime = doctorStartTime
    ? new Date(new Date(doctorStartTime).getTime() + 30 * 60000).toISOString()
    : null

  const labStartTime = collectionDate && collectionTime
    ? new Date(`${collectionDate}T${collectionTime}:00`).toISOString()
    : null

  // ── Fetch doctor / lab / tests (after mount only) ─────────────────────────
  const { data: doctor } = useSWR(
    mounted && doctorId ? `/api/doctors/${doctorId}` : null,
    fetcher
  )
  const { data: lab } = useSWR(
    mounted && labId ? `/api/labs/${labId}` : null,
    fetcher
  )
  const { data: testsData } = useSWR(
    mounted && labId && testIds.length ? `/api/labs/${labId}/tests` : null,
    fetcher
  )

  const allTests      = testsData?.tests || []
  const selectedTests = allTests.filter((t) => testIds.includes(t.id))

  // ── Pricing (all derived, no state) ──────────────────────────────────────
  const baseFee = isLab
    ? selectedTests.reduce((s, t) => s + (t.discountedPrice || t.price || 0), 0)
    : doctor
      ? (isOnline
          ? (doctor.consultationFee?.online  || 0)
          : (doctor.consultationFee?.offline || 0))
      : 0

  const platformFeePercent = isLab
    ? (lab?.platformFeePercent || 8)
    : (doctor?.platformFeePercent || 10)

  const couponDiscount = couponResult?.discountAmount || 0
  const discountedFee  = Math.max(0, baseFee - couponDiscount)
  const platformFee    = Math.round(discountedFee * platformFeePercent / 100)
  const gst            = Math.round(platformFee * 18 / 100)
  const totalAmount    = discountedFee + platformFee + gst

  const bookingTypeLabel = isLab
    ? 'Lab Test'
    : isOnline
      ? 'Online Consultation'
      : 'Hospital Visit'

  // ── Step 1 validation ─────────────────────────────────────────────────────
  const step1Valid = isLab
    ? (testIds.length > 0 && collectionDate && collectionTime &&
        (collectionType !== 'home' ||
          (collectionAddress.line1 && collectionAddress.city)))
    : !!doctorStartTime

  const todayStr = mounted ? new Date().toISOString().split('T')[0] : ''

  // ── Step 1: Create booking ────────────────────────────────────────────────
  const createBooking = async () => {
    if (!step1Valid) {
      toast.error(isLab
        ? 'Please select collection date, time and address'
        : 'No slot selected'
      )
      return
    }
    setLoading(true)
    try {
      const body = {
        type:      isLab ? 'lab' : isOnline ? 'online' : 'hospital',
        doctorId:  doctorId  || undefined,
        labId:     labId     || undefined,
        testIds,
        startTime: isLab ? labStartTime : doctorStartTime,
        endTime:   isLab ? null         : doctorEndTime,
        collectionType:    isLab ? collectionType    : undefined,
        collectionAddress: isLab && collectionType === 'home'
          ? collectionAddress
          : undefined,
        couponCode: couponCode || undefined,
      }

      const res  = await fetch('/api/bookings', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(body),
      })
      const json = await res.json()

      if (json.success) {
        setBookingId(json.data.id)
        setStep(2)
      } else {
        toast.error(json.error || 'Failed to create booking')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Apply coupon ──────────────────────────────────────────────────────────
  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setApplyingCoupon(true)
    try {
      const bType = isLab ? 'lab' : isOnline ? 'online' : 'hospital'
      const res   = await fetch(
        `/api/coupons/validate/${couponCode}?bookingType=${bType}&amount=${baseFee}`,
        { credentials: 'include' }
      )
      const json = await res.json()
      const d    = json.data || json

      if (d.valid) {
        setCouponResult(d)
        toast.success(d.message || 'Coupon applied!')
      } else {
        setCouponResult({ valid: false })
        toast.error(d.message || 'Invalid coupon')
      }
    } catch {
      toast.error('Failed to validate coupon')
    } finally {
      setApplyingCoupon(false)
    }
  }

  // ── Step 4: Initiate 1Pay payment ─────────────────────────────────────────
  // Uses official 1Pay integration:
  //   - Call create-order API
  //   - Build hidden HTML form
  //   - POST form to 1Pay gateway (NOT axios redirect)
  const initiatePayment = async () => {
    if (!bookingId) {
      toast.error('No booking found. Please start over.')
      return
    }

    setLoading(true)

    try {
      // Step A: Get encrypted order from backend
      const res  = await fetch('/api/payments/create-order', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ bookingId }),
      })
      const json = await res.json()

      if (!json.success) {
        toast.error(json.error || 'Payment initiation failed')
        setLoading(false)
        return
      }

      const { merchantId, reqData, paymentUrl } = json.data

      // Debug log
      console.log('[Payment] Submitting to:', paymentUrl)
      console.log('[Payment] merchantId:', merchantId)
      console.log('[Payment] reqData length:', reqData?.length)

      if (!merchantId || !reqData || !paymentUrl) {
        toast.error('Invalid payment data received. Please try again.')
        setLoading(false)
        return
      }

      // Step B: Build hidden HTML form and POST to 1Pay
      // Per official 1Pay docs — must be form POST, not axios/fetch redirect
      const form       = document.createElement('form')
      form.method      = 'POST'
      form.action      = paymentUrl
      form.style.display = 'none'
      form.style.visibility = 'hidden'

      // Helper to add hidden input
      const addField = (name, value) => {
        const input   = document.createElement('input')
        input.type    = 'hidden'
        input.name    = name
        input.value   = String(value)
        form.appendChild(input)
      }

      // Only 2 fields needed per 1Pay docs
      addField('merchantId', merchantId)
      addField('reqData',    reqData)

      // Append to body and submit
      document.body.appendChild(form)

      console.log('[Payment] Submitting form to 1Pay...')
      form.submit()

      // Page will redirect to 1Pay — keep loading=true
      // Do NOT set loading=false here
    } catch (err) {
      console.error('[Payment] Error:', err)
      toast.error('Payment initiation failed. Please try again.')
      setLoading(false)
    }
  }

  const slide = {
    initial:    { x: 40,  opacity: 0 },
    animate:    { x: 0,   opacity: 1 },
    exit:       { x: -40, opacity: 0 },
    transition: { duration: 0.2 },
  }

  // ── Static skeleton before mount ──────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 pt-24 pb-16">
          <div className="h-12 bg-white rounded-2xl border border-gray-100 mb-6 animate-pulse" />
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="h-5 w-40 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 bg-blue-100 rounded-xl animate-pulse mt-6" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 pt-24 pb-16">
        <BookingStepper currentStep={step} />

        <AnimatePresence mode="wait">

          {/* ══ STEP 1: Review / Collection Details ══ */}
          {step === 1 && (
            <motion.div key="step1" {...slide}>
              <div
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                {/* Header gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <h2 className="text-lg font-bold">
                    {isLab ? 'Select Collection Details' : 'Review Appointment'}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {isLab
                      ? 'Choose how and when to collect your sample'
                      : 'Confirm your appointment details'}
                  </p>
                </div>

                <div className="p-6 space-y-4">

                  {/* ── Doctor booking ── */}
                  {!isLab && (
                    <div className="space-y-0 divide-y divide-gray-50">
                      {doctor ? (
                        <>
                          <div className="flex items-center justify-between py-3">
                            <span className="text-sm text-gray-500">Doctor</span>
                            <span className="text-sm font-semibold text-gray-800">
                              Dr. {doctor.name}
                            </span>
                          </div>
                          {doctor.specialization?.length > 0 && (
                            <div className="flex items-center justify-between py-3">
                              <span className="text-sm text-gray-500">Specialization</span>
                              <span className="text-sm text-gray-700">
                                {doctor.specialization.slice(0, 2).join(', ')}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-3 space-y-2">
                          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                        </div>
                      )}

                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-gray-500">Type</span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-800">
                          {isOnline
                            ? <Video     className="w-3.5 h-3.5 text-purple-500" />
                            : <Building2 className="w-3.5 h-3.5 text-blue-500"   />}
                          {bookingTypeLabel}
                        </span>
                      </div>

                      {date && (
                        <div className="flex items-center justify-between py-3">
                          <span className="text-sm text-gray-500 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Date
                          </span>
                          <span className="text-sm font-medium text-gray-800">
                            {new Date(`${date}T00:00:00`)
                              .toLocaleDateString('en-IN', { dateStyle: 'long' })}
                          </span>
                        </div>
                      )}

                      {slot && (
                        <div className="flex items-center justify-between py-3">
                          <span className="text-sm text-gray-500 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Time
                          </span>
                          <span className="text-sm font-medium text-gray-800">{slot}</span>
                        </div>
                      )}

                      {baseFee > 0 && (
                        <div className="flex items-center justify-between py-3">
                          <span className="text-sm text-gray-500">Consultation Fee</span>
                          <span className="text-sm font-bold text-gray-900">
                            {fmtRs(baseFee)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Lab booking ── */}
                  {isLab && (
                    <>
                      {lab && (
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-lg flex-shrink-0">
                            🧪
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{lab.name}</p>
                            <p className="text-xs text-gray-500">
                              {testIds.length} test{testIds.length > 1 ? 's' : ''} selected
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedTests.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                          {selectedTests.map((t) => (
                            <div key={t.id} className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">{t.name}</span>
                              <span className="text-xs font-semibold text-gray-800">
                                {fmtRs(t.discountedPrice || t.price)}
                              </span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                            <span className="text-xs font-semibold text-gray-700">
                              Tests Total
                            </span>
                            <span className="text-xs font-bold text-green-600">
                              {fmtRs(baseFee)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Collection type toggle */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Collection Type
                        </p>
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                          {[
                            { key: 'walk_in', label: 'Walk-in',        icon: <MapPin className="w-4 h-4" /> },
                            { key: 'home',    label: 'Home Collection', icon: <Home   className="w-4 h-4" /> },
                          ].map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => setCollectionType(opt.key)}
                              className={
                                collectionType === opt.key
                                  ? 'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-white text-gray-900 shadow-sm transition-all'
                                  : 'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-gray-500 transition-all'
                              }
                            >
                              {opt.icon} {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Date & time */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            {collectionType === 'home' ? 'Pickup Date' : 'Visit Date'}
                          </label>
                          <input
                            type="date"
                            min={todayStr}
                            value={collectionDate}
                            onChange={(e) => setCollectionDate(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            {collectionType === 'home' ? 'Pickup Time' : 'Visit Time'}
                          </label>
                          <input
                            type="time"
                            value={collectionTime}
                            onChange={(e) => setCollectionTime(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* Home address (animated) */}
                      <AnimatePresence>
                        {collectionType === 'home' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 overflow-hidden"
                          >
                            <p className="text-sm font-semibold text-gray-700">
                              Pickup Address
                            </p>
                            <Input
                              placeholder="Street address / flat no."
                              value={collectionAddress.line1}
                              onChange={(e) =>
                                setCollectionAddress((a) => ({ ...a, line1: e.target.value }))
                              }
                              leftIcon={<MapPin className="w-4 h-4" />}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                placeholder="City"
                                value={collectionAddress.city}
                                onChange={(e) =>
                                  setCollectionAddress((a) => ({ ...a, city: e.target.value }))
                                }
                              />
                              <Input
                                placeholder="PIN Code"
                                value={collectionAddress.pinCode}
                                onChange={(e) =>
                                  setCollectionAddress((a) => ({
                                    ...a,
                                    pinCode: e.target.value,
                                  }))
                                }
                                maxLength={6}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>

                <div className="px-6 pb-6">
                  <Button
                    className="w-full"
                    onClick={createBooking}
                    loading={loading}
                    disabled={loading || !step1Valid}
                  >
                    {isLab ? 'Confirm Collection Details' : 'Continue to Patient Details'}
                  </Button>
                  {!step1Valid && (
                    <p className="text-xs text-gray-400 text-center mt-2">
                      {isLab
                        ? `Please select date and time${collectionType === 'home' ? ' and address' : ''}`
                        : 'No slot selected — please go back and select a slot'}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ STEP 2: Patient Details ══ */}
          {step === 2 && (
            <motion.div key="step2" {...slide}>
              <div
                className="bg-white rounded-2xl border border-gray-100 p-6"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <h2 className="text-lg font-bold text-gray-800 mb-1">Patient Details</h2>
                <p className="text-sm text-gray-400 mb-5">Who is this appointment for?</p>

                {/* Patient type toggle */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-5">
                  {[
                    { key: 'myself', label: 'For Myself', icon: <User  className="w-4 h-4" /> },
                    { key: 'family', label: 'For Family', icon: <Users className="w-4 h-4" /> },
                  ].map((pt) => (
                    <button
                      key={pt.key}
                      onClick={() => setPatientType(pt.key)}
                      className={
                        patientType === pt.key
                          ? 'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-white text-gray-900 shadow-sm transition-all'
                          : 'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-gray-500 transition-all'
                      }
                    >
                      {pt.icon} {pt.label}
                    </button>
                  ))}
                </div>

                {patientType === 'myself' ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {user?.name || '—'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user?.phone || user?.email || '—'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Input
                    label="Patient Name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter family member's full name"
                    leftIcon={<User className="w-4 h-4" />}
                  />
                )}

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setStep(3)}
                    disabled={patientType === 'family' && !patientName.trim()}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ STEP 3: Coupon & Pricing ══ */}
          {step === 3 && (
            <motion.div key="step3" {...slide}>
              <div
                className="bg-white rounded-2xl border border-gray-100 p-6"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <h2 className="text-lg font-bold text-gray-800 mb-1">Coupon & Pricing</h2>
                <p className="text-sm text-gray-400 mb-5">
                  Apply a coupon to save on your booking
                </p>

                {/* Coupon input */}
                <div className="flex gap-2 mb-4">
                  <Input
                    leftIcon={<Tag className="w-4 h-4" />}
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="md"
                    onClick={applyCoupon}
                    loading={applyingCoupon}
                    disabled={!couponCode.trim() || applyingCoupon}
                  >
                    Apply
                  </Button>
                </div>

                <AnimatePresence>
                  {couponResult?.valid && (
                    <motion.div
                      key="coupon-ok"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4"
                    >
                      <Check className="w-4 h-4 flex-shrink-0" />
                      Coupon applied! Saved {fmtRs(couponResult.discountAmount)}
                    </motion.div>
                  )}
                  {couponResult && !couponResult.valid && (
                    <motion.div
                      key="coupon-err"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4"
                    >
                      Invalid or expired coupon
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Price breakdown */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <PriceRow label="Base Fee" value={fmtRs(baseFee)} />
                  {couponDiscount > 0 && (
                    <PriceRow
                      label={`Coupon (${couponCode})`}
                      value={`- ${fmtRs(couponDiscount)}`}
                      green
                    />
                  )}
                  {couponDiscount > 0 && (
                    <PriceRow label="Discounted Fee" value={fmtRs(discountedFee)} />
                  )}
                  <PriceRow
                    label={`Platform Fee (${platformFeePercent}%)`}
                    value={fmtRs(platformFee)}
                  />
                  <PriceRow label="GST (18%)" value={fmtRs(gst)} />
                  <PriceRow label="Total Amount" value={fmtRs(totalAmount)} bold />
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setStep(4)}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ STEP 4: Pay via 1Pay ══ */}
          {step === 4 && (
            <motion.div key="step4" {...slide}>
              <div
                className="bg-white rounded-2xl border border-gray-100 p-6"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <h2 className="text-lg font-bold text-gray-800 mb-1">Pay Securely</h2>
                <p className="text-sm text-gray-400 mb-5">
                  You will be redirected to 1Pay secure payment page
                </p>

                {/* Amount summary card */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
                  <div className="mb-3">
                    <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                      {bookingTypeLabel}
                    </p>
                    <p className="text-xs text-blue-500">
                      {isLab
                        ? `${collectionType === 'home' ? 'Home Collection' : 'Walk-in'} · ${collectionDate} ${collectionTime}`
                        : `${date} · ${slot}`}
                    </p>
                  </div>

                  {/* Price summary */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-xs text-blue-600">
                      <span>Base Fee</span>
                      <span>{fmtRs(baseFee)}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-xs text-green-600">
                        <span>Coupon ({couponCode})</span>
                        <span>- {fmtRs(couponDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-blue-600">
                      <span>Platform Fee ({platformFeePercent}%)</span>
                      <span>{fmtRs(platformFee)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-blue-600">
                      <span>GST (18%)</span>
                      <span>{fmtRs(gst)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                    <span className="text-sm text-blue-700 font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-700">
                      {fmtRs(totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Security + accepted payments */}
                <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-xl">
                  <span className="text-xl flex-shrink-0">🔒</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">
                      Secured by 1Pay Payment Gateway
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Cards · Net Banking · UPI · Wallets
                    </p>
                  </div>
                </div>

                {/* Warning for localhost */}
                {process.env.NEXT_PUBLIC_APP_URL?.includes('localhost') && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-700 font-semibold mb-1">
                      ⚠ Development Mode
                    </p>
                    <p className="text-xs text-amber-600">
                      1Pay callback cannot reach localhost. Use ngrok for testing:
                      <br />
                      <code className="font-mono">ngrok http 3000</code>
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setStep(3)}
                    disabled={loading}
                  >
                    Back
                  </Button>

                  {/* Pay button — official 1Pay form POST */}
                  <button
                    onClick={initiatePayment}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3.5 rounded-xl text-base font-bold transition-all"
                    style={{ minHeight: 52 }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Redirecting to 1Pay...
                      </span>
                    ) : (
                      `PAY ${fmtRs(totalAmount)}`
                    )}
                  </button>
                </div>

                <p className="text-center text-xs text-gray-400 mt-3">
                  By proceeding you agree to our{' '}
                  <a href="/terms" className="underline hover:text-gray-600">Terms</a>
                  {' '}and{' '}
                  <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

export default function NewBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <NewBookingContent />
    </Suspense>
  )
}