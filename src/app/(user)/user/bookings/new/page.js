
'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { load } from '@cashfreepayments/cashfree-js'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'

import Navbar from '@/components/public/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'

const rs = (value) =>
  `₹${Number(value ?? 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

async function readResponse(response) {
  const json = await response.json().catch(() => ({}))

  if (!response.ok || json.success === false) {
    throw new Error(
      json.error ||
      json.message ||
      `Request failed (${response.status})`
    )
  }

  return json.data ?? json
}

const getJSON = (url) =>
  fetch(url, {
    credentials: 'include',
  }).then(readResponse)

const postJSON = (url, data) =>
  fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then(readResponse)

// ============================================================
// STYLES
// ============================================================

const css = `
.medli-checkout{min-height:100vh;background:#f8fafc;color:#0f172a}
.medli-checkout *{box-sizing:border-box}
.medli-checkout main{width:min(560px,calc(100% - 28px));margin:auto;padding:90px 0 65px}

.mc-steps{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:25px}
.mc-step{flex:1;position:relative;display:flex;align-items:center;flex-direction:column;gap:5px;min-width:0}
.mc-step:not(:last-child):after{content:"";position:absolute;height:2px;left:calc(50% + 21px);right:calc(-50% + 21px);top:16px;background:#e2e8f0}
.mc-step.done:not(:last-child):after{background:#10b981}
.mc-circle{height:34px;width:34px;display:grid;place-items:center;border-radius:50%;background:#eef2f7;color:#94a3b8;font-size:14px;font-weight:800;position:relative;z-index:1}
.mc-step.done .mc-circle{background:#10b981;color:#fff}
.mc-step.active .mc-circle{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 3px 12px #6366f144}
.mc-step small{font-size:10px;color:#94a3b8}
.mc-step.done small{color:#10b981}
.mc-step.active small{color:#6366f1}

.mc-card{background:#fff;border-radius:20px;border:1px solid #f1f5f9;box-shadow:0 3px 12px #0f172a0a;padding:24px}
.mc-card h2{font-size:19px;font-weight:800;margin:0 0 5px}
.mc-sub{color:#94a3b8;font-size:13px;margin:0 0 21px}
.mc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.mc-stack{display:grid;gap:14px}

.mc-field{display:grid;gap:6px;min-width:0;flex:1}
.mc-field span{font-size:12px;font-weight:650;color:#475569}
.mc-field input{border:1.5px solid #e2e8f0;border-radius:12px;padding:11px 12px;width:100%;min-width:0;font-size:13px;color:#1e293b;outline:none;background:#fff}
.mc-field input:focus,.mc-family-select:focus{border-color:#818cf8;box-shadow:0 0 0 3px #6366f115}

.mc-family-select{width:100%;padding:12px 13px;border:1.5px solid #e2e8f0;border-radius:12px;background:#fff;color:#1e293b;font-size:13px;outline:none;cursor:pointer}
.mc-family-select:disabled{opacity:.5;cursor:not-allowed}
.mc-family-actions{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.mc-family-actions a{color:#4f46e5;font-weight:600;font-size:12px}
.mc-family-actions button{background:#eef2ff;color:#4f46e5;font-size:12px;padding:8px 10px;border:0;border-radius:8px;cursor:pointer}

.mc-btn{min-height:46px;padding:11px 14px;display:inline-flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;min-width:0}
.mc-btn.primary{background:linear-gradient(135deg,#6366f1,#8b5cf6);box-shadow:0 4px 14px #6366f13b;color:#fff}
.mc-btn.secondary{border:1.5px solid #e2e8f0;background:#fff;color:#475569}
.mc-btn:disabled{opacity:.52;cursor:not-allowed;box-shadow:none}
.mc-actions{display:flex;gap:10px;margin-top:18px}
.mc-actions>*{flex:1}

.mc-options{display:flex;gap:8px}
.mc-options button{flex:1;background:#fff;border:1px solid #e2e8f0;border-radius:12px;color:#64748b;font-size:13px;font-weight:650;padding:12px;cursor:pointer}
.mc-options button.active{border-color:#a5b4fc;background:#eef2ff;color:#4f46e5}

.mc-price{background:#f8fafc;border-radius:15px;padding:16px;display:grid;gap:9px;margin:14px 0 6px}
.mc-price.payment{background:linear-gradient(135deg,#f3f2ff,#fafaff);border:1px solid #dcdcff;padding:18px}
.mc-price-line{display:flex;justify-content:space-between;gap:14px;font-size:13px;color:#64748b;align-items:center}
.mc-price-line strong{font-weight:650;color:#334155;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.mc-price-line.discount strong{color:#059669}
.mc-price-line.total{padding-top:13px;margin-top:5px;border-top:1px solid #e2e8f0;color:#4f46e5;font-weight:800}
.mc-price-line.total strong{font-size:22px;font-weight:850;color:#4f46e5}

.mc-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px}
.mc-row span:first-child{color:#64748b}
.mc-row strong{text-align:right;overflow-wrap:anywhere;color:#334155}
.mc-note{font-size:12px;line-height:1.5;color:#94a3b8}
.mc-error{padding:11px 12px;border-radius:11px;border:1px solid #fecaca;background:#fef2f2;color:#b91c1c;font-size:12px}
.mc-success{padding:11px 12px;border-radius:11px;border:1px solid #bbf7d0;background:#f0fdf4;color:#047857;font-size:12px}

@media(max-width:450px){
  .medli-checkout main{padding-top:82px}
  .mc-card{padding:18px}
  .mc-actions{flex-wrap:wrap}
  .mc-actions>*{flex:1 1 130px}
  .mc-sub{margin-bottom:16px}
}
`

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

function Steps({ step }) {
  return (
    <div className="mc-steps">
      {['Details', 'Patient', 'Pricing', 'Payment'].map((label, i) => {
        const n = i + 1

        return (
          <div
            key={label}
            className={`mc-step ${
              n < step ? 'done' : n === step ? 'active' : ''
            }`}
          >
            <div className="mc-circle">
              {n < step ? <Check size={16} /> : n}
            </div>
            <small>{label}</small>
          </div>
        )
      })}
    </div>
  )
}

function Card({ title, sub, children }) {
  return (
    <section className="mc-card">
      <h2>{title}</h2>
      <p className="mc-sub">{sub}</p>
      {children}
    </section>
  )
}

function Field({ label, ...props }) {
  return (
    <label className="mc-field">
      <span>{label}</span>
      <input {...props} />
    </label>
  )
}

function Btn({ children, secondary, ...props }) {
  return (
    <button
      type="button"
      className={`mc-btn ${secondary ? 'secondary' : 'primary'}`}
      {...props}
    >
      {children}
    </button>
  )
}

// ============================================================
// PRICE SUMMARY
// Platform fee and GST are combined visually.
// ============================================================

function Summary({ pricing, payment = false }) {
  if (!pricing) return null

  const charges =
    Math.round(
      (
        Number(pricing.platformFee ?? 0) +
        Number(pricing.gst ?? 0)
      ) * 100
    ) / 100

  return (
    <div className={`mc-price ${payment ? 'payment' : ''}`}>
      <div className="mc-price-line">
        <span>Base Fee</span>
        <strong>{rs(pricing.baseFee)}</strong>
      </div>

      {Number(pricing.couponDiscount) > 0 && (
        <div className="mc-price-line discount">
          <span>Coupon Discount</span>
          <strong>− {rs(pricing.couponDiscount)}</strong>
        </div>
      )}

      <div className="mc-price-line">
        <span>GST &amp; Other Charges</span>
        <strong>{rs(charges)}</strong>
      </div>

      {Number(pricing.adminCouponDiscount) > 0 && (
        <div className="mc-price-line discount">
          <span>Coupon Discount</span>
          <strong>− {rs(pricing.adminCouponDiscount)}</strong>
        </div>
      )}

      <div className="mc-price-line total">
        <span>Total Amount</span>
        <strong>{rs(pricing.totalAmount)}</strong>
      </div>
    </div>
  )
}

// ============================================================
// MAIN CHECKOUT
// ============================================================

function BookingContent() {
  const router = useRouter()
  const params = useSearchParams()
  const toast = useToast()
  const { user, refreshUser } = useAuth()

  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(1)
  const [working, setWorking] = useState(false)
  const busyRef = useRef(false)
  const [booking, setBooking] = useState(null)

  const [patientType, setPatientType] = useState('myself')
  const [selectedFamilyId, setSelectedFamilyId] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  const [collectionType, setCollectionType] = useState('walk_in')
  const [collectionDate, setCollectionDate] = useState('')
  const [collectionTime, setCollectionTime] = useState('')
  const [collectionAddr, setCollectionAddr] = useState({
    line1: '',
    city: '',
    pinCode: '',
  })

  const [couponCode, setCouponCode] = useState('')
  const [validatedCoupon, setValidatedCoupon] = useState(null)
  const [couponWorking, setCouponWorking] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const doctorId = params.get('doctorId')
  const labId = params.get('labId')
  const isLab = Boolean(labId)
  const isOnline = params.get('type') === 'online'

  const bookingType = isLab
    ? 'lab'
    : isOnline
      ? 'online'
      : 'hospital'

  const typeLabel = isLab
    ? 'Lab Test'
    : isOnline
      ? 'Online Consultation'
      : 'Hospital Visit'

  const date = params.get('date')
  const slot = params.get('slot')
  const idsString = params.get('testIds') || ''

  const testIds = useMemo(
    () => idsString.split(',').filter(Boolean),
    [idsString]
  )

  // ==========================================================
  // FETCH DOCTOR / LAB
  // ==========================================================

  const { data: doctor, error: doctorError } = useSWR(
    mounted && doctorId ? `/api/doctors/${doctorId}` : null,
    getJSON
  )

  const { data: lab, error: labError } = useSWR(
    mounted && labId ? `/api/labs/${labId}` : null,
    getJSON
  )

  const { data: testsData } = useSWR(
    mounted && isLab && testIds.length
      ? `/api/labs/${labId}/tests`
      : null,
    getJSON
  )

  const selectedTests = useMemo(
    () =>
      (testsData?.tests ?? []).filter(
        (test) => testIds.includes(test.id)
      ),
    [testsData, testIds]
  )

  // ==========================================================
  // FETCH FAMILY MEMBERS FROM THE SAME API AS PROFILE
  // ==========================================================

  const {
    data: familyData,
    error: familyError,
    isLoading: familyLoading,
    mutate: refreshFamily,
  } = useSWR(
    mounted &&
    user?.id &&
    patientType === 'family' &&
    !booking
      ? `/api/users/${user.id}/family`
      : null,
    getJSON,
    {
      revalidateOnFocus: false,
    }
  )

  const familyMembers = Array.isArray(familyData)
    ? familyData
    : []

  const selectedFamilyMember = familyMembers.find(
    (member) => member.id === selectedFamilyId
  )

  // ==========================================================
  // SERVICE FEE
  // ==========================================================

  const baseFee = isLab
    ? selectedTests.reduce((total, test) => {
        const normal = Number(test.price ?? 0)
        const discount = Number(test.discountedPrice)

        const effective =
          test.discountedPrice != null &&
          Number.isFinite(discount) &&
          discount > 0 &&
          discount < normal
            ? discount
            : normal

        return total + effective
      }, 0)
    : Number(
        isOnline
          ? doctor?.consultationFee?.online ?? 0
          : doctor?.consultationFee?.offline ?? 0
      )

  // Appointment times interpreted as India Standard Time.

  const selectedTime = isLab
    ? collectionDate && collectionTime
      ? `${collectionDate}T${collectionTime}:00+05:30`
      : null
    : date && slot
      ? `${date}T${slot}:00+05:30`
      : null

  const startTime =
    selectedTime &&
    !Number.isNaN(Date.parse(selectedTime))
      ? new Date(selectedTime).toISOString()
      : null

  const detailsReady = Boolean(
    isLab
      ? startTime &&
          testIds.length &&
          selectedTests.length === testIds.length &&
          baseFee > 0 &&
          (
            collectionType !== 'home' ||
            (
              lab?.homeCollection?.enabled &&
              collectionAddr.line1.trim() &&
              collectionAddr.city.trim()
            )
          )
      : startTime &&
          doctor?.id &&
          baseFee > 0
  )

  // ==========================================================
  // SERVER PRICE PREVIEW
  // ==========================================================

  const appliedCode = validatedCoupon?.valid
    ? validatedCoupon.code
    : null

  const quotePayload = useMemo(
    () => ({
      bookingType,
      doctorId: isLab ? null : doctorId,
      labId: isLab ? labId : null,
      testIds: isLab ? testIds : [],
      couponCode: appliedCode,
    }),
    [
      bookingType,
      doctorId,
      labId,
      isLab,
      testIds,
      appliedCode,
    ]
  )

  const previewKey =
    mounted &&
    step === 3 &&
    !booking &&
    baseFee > 0
      ? [
          '/api/bookings/price-preview',
          JSON.stringify(quotePayload),
        ]
      : null

  const {
    data: quote,
    error: quoteError,
    isLoading: quoteLoading,
  } = useSWR(
    previewKey,
    ([url, payload]) =>
      postJSON(url, JSON.parse(payload)),
    { revalidateOnFocus: false }
  )

  const pricing = booking || quote

  const dateParts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(new Date())
      .map((part) => [
        part.type,
        part.value,
      ])
  )

  const today =
    `${dateParts.year}-${dateParts.month}-${dateParts.day}`

  // ==========================================================
  // SAVE PATIENT CONTACT DETAILS
  // ==========================================================

  async function savePatient() {
    if (working) return

    if (!user?.id) {
      toast.error('Please sign in again')
      return
    }

    if (patientType === 'family') {
      if (
        familyLoading ||
        familyError ||
        !selectedFamilyMember
      ) {
        toast.error('Select a saved family member')
        return
      }
    }

    const needEmail = !user.email?.trim()
    const needPhone = !user.phone?.trim()

    const email = needEmail
      ? contactEmail.trim().toLowerCase()
      : user.email

    const phone = needPhone
      ? contactPhone.replace(/\D/g, '')
      : user.phone

    if (
      needEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      toast.error('Enter a valid email')
      return
    }

    if (
      needPhone &&
      !/^[6-9]\d{9}$/.test(phone)
    ) {
      toast.error('Enter a valid mobile number')
      return
    }

    if (needEmail || needPhone) {
      setWorking(true)

      try {
        await readResponse(
          await fetch(`/api/users/${user.id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...(needEmail ? { email } : {}),
              ...(needPhone ? { phone } : {}),
            }),
          })
        )

        await refreshUser?.()
      } catch (error) {
        toast.error(error.message)
        return
      } finally {
        setWorking(false)
      }
    }

    setStep(3)
  }

  // ==========================================================
  // APPLY COUPON
  // ==========================================================

  async function applyCoupon() {
    if (
      !couponCode.trim() ||
      booking ||
      couponWorking
    ) {
      return
    }

    setCouponWorking(true)

    try {
      const url =
        `/api/coupons/validate/${encodeURIComponent(
          couponCode.trim()
        )}` +
        `?bookingType=${bookingType}` +
        `&amount=${encodeURIComponent(baseFee)}`

      const data = await getJSON(url)

      if (!data.valid) {
        throw new Error(
          data.message || 'Invalid coupon'
        )
      }

      setValidatedCoupon({
        code: couponCode.trim(),
        valid: true,
      })

      toast.success(
        data.message || 'Coupon applied'
      )
    } catch (error) {
      setValidatedCoupon(null)
      toast.error(error.message || 'Invalid coupon')
    } finally {
      setCouponWorking(false)
    }
  }

  // ==========================================================
  // CREATE BOOKING AFTER SELECTING PATIENT AND COUPON
  // ==========================================================

  async function createBooking() {
    if (busyRef.current) return

    if (booking?.id) {
      setStep(4)
      return
    }

    if (!detailsReady) {
      toast.error('Complete appointment details first')
      return
    }

    if (
      patientType === 'family' &&
      !selectedFamilyMember
    ) {
      toast.error('Select a valid saved family member')
      setStep(2)
      return
    }

    if (quoteLoading || quoteError || !quote) {
      toast.error(
        quoteError?.message ||
        'Price is not ready'
      )
      return
    }

    if (appliedCode && !quote.couponApplied) {
      toast.error(
        'Coupon was not accepted by the pricing server'
      )
      return
    }

    busyRef.current = true
    setWorking(true)

    try {
      const saved = await postJSON('/api/bookings', {
        type: bookingType,

        doctorId: isLab ? undefined : doctorId,
        labId: isLab ? labId : undefined,
        testIds: isLab ? testIds : [],

        startTime,

        collectionType: isLab
          ? collectionType
          : undefined,

        collectionAddress:
          isLab && collectionType === 'home'
            ? collectionAddr
            : undefined,

        // No manual patient name.
        // Server verifies member and resolves patient name.

        patientType:
          patientType === 'family'
            ? 'family'
            : 'self',

        familyMemberId:
          patientType === 'family'
            ? selectedFamilyId
            : null,

        couponCode: appliedCode || undefined,
      })

      if (
        !saved?.id ||
        !Number.isFinite(Number(saved.totalAmount))
      ) {
        throw new Error(
          'The server did not return the booked price'
        )
      }

      setBooking(saved)

      if (
        Math.abs(
          Number(saved.totalAmount) -
          Number(quote.totalAmount)
        ) >= 0.01
      ) {
        toast.error(
          'Price changed. Review the amount before paying.'
        )
      }

      setStep(4)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setWorking(false)
      busyRef.current = false
    }
  }

  // ==========================================================
  // CASHFREE PAYMENT — USE SAVED BOOKING TOTAL
  // ==========================================================

  async function initiatePayment() {
    if (busyRef.current || !booking?.id) return

    busyRef.current = true
    setWorking(true)

    try {
      const order = await postJSON(
        '/api/payments/create-order',
        { bookingId: booking.id }
      )

      if (
        Math.round(Number(order.amount) * 100) !==
        Math.round(Number(booking.totalAmount) * 100)
      ) {
        throw new Error(
          'Booking and payment order totals do not match'
        )
      }

      const orderId =
        order.orderId ||
        order.cashfreeOrderId

      if (
        !orderId ||
        !order.paymentSessionId?.trim()
      ) {
        throw new Error(
          'Payment session unavailable'
        )
      }

      if (
        !['sandbox', 'production'].includes(
          order.cashfreeEnvironment
        )
      ) {
        throw new Error(
          'Invalid payment environment'
        )
      }

      const cashfree = await load({
        mode: order.cashfreeEnvironment,
      })

      const outcome = await cashfree.checkout({
        paymentSessionId:
          order.paymentSessionId.trim(),
        redirectTarget: '_modal',
      })

      if (outcome?.error) {
        throw new Error(
          outcome.error.message ||
          'Payment cancelled'
        )
      }

      // Always verify payment on the server.

      const response = await fetch(
        '/api/payments/verify',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            bookingId: booking.id,
          }),
        }
      )

      const verified = await response.json().catch(
        () => ({})
      )

      if (
        response.status === 202 ||
        verified.pending
      ) {
        toast.error(
          'Payment processing. Check your booking status.'
        )

        router.replace(
          `/user/bookings/${booking.id}`
        )
      } else if (
        !response.ok ||
        !verified.success
      ) {
        toast.error(
          verified.error ||
          'Payment verification failed'
        )

        router.replace(
          `/user/bookings/${booking.id}/failed`
        )
      } else {
        toast.success('Payment successful')

        router.replace(
          `/user/bookings/${booking.id}/success`
        )
      }
    } catch (error) {
      console.error(
        '[MEDLI Payment]',
        error.message
      )
      toast.error(
        error.message ||
        'Could not open payment'
      )
    } finally {
      setWorking(false)
      busyRef.current = false
    }
  }

  // ==========================================================
  // PAGE UI
  // ==========================================================

  return (
    <div className="medli-checkout">
      <style>{css}</style>
      <Navbar />

      <main>
        <Steps step={step} />

        {(doctorError || labError) && (
          <p className="mc-error">
            {doctorError?.message ||
              labError?.message}
          </p>
        )}

        {/* STEP 1 — APPOINTMENT */}

        {step === 1 && (
          <Card
            title={
              isLab
                ? 'Collection Details'
                : 'Review Appointment'
            }
            sub={
              isLab
                ? 'Select your sample collection date and location'
                : 'Confirm your appointment details'
            }
          >
            <div className="mc-stack">
              {isLab ? (
                <>
                  <div className="mc-row">
                    <span>Lab</span>
                    <strong>{lab?.name || 'Loading…'}</strong>
                  </div>

                  <div className="mc-row">
                    <span>Selected Tests</span>
                    <strong>{selectedTests.length}</strong>
                  </div>

                  {selectedTests.map((test) => (
                    <div className="mc-row" key={test.id}>
                      <span>{test.name}</span>
                      <strong>
                        {rs(test.discountedPrice || test.price)}
                      </strong>
                    </div>
                  ))}

                  <div className="mc-options">
                    <button
                      type="button"
                      className={
                        collectionType === 'walk_in'
                          ? 'active'
                          : ''
                      }
                      onClick={() => setCollectionType('walk_in')}
                    >
                      Walk-in
                    </button>

                    <button
                      type="button"
                      disabled={!lab?.homeCollection?.enabled}
                      className={
                        collectionType === 'home'
                          ? 'active'
                          : ''
                      }
                      onClick={() => setCollectionType('home')}
                    >
                      Home Collection
                    </button>
                  </div>

                  <div className="mc-grid">
                    <Field
                      label="Date"
                      type="date"
                      min={today}
                      value={collectionDate}
                      onChange={(e) =>
                        setCollectionDate(e.target.value)
                      }
                    />

                    <Field
                      label="Time"
                      type="time"
                      value={collectionTime}
                      onChange={(e) =>
                        setCollectionTime(e.target.value)
                      }
                    />
                  </div>

                  {collectionType === 'home' && (
                    <>
                      <Field
                        label="Street Address"
                        value={collectionAddr.line1}
                        onChange={(e) =>
                          setCollectionAddr((value) => ({
                            ...value,
                            line1: e.target.value,
                          }))
                        }
                      />

                      <div className="mc-grid">
                        <Field
                          label="City"
                          value={collectionAddr.city}
                          onChange={(e) =>
                            setCollectionAddr((value) => ({
                              ...value,
                              city: e.target.value,
                            }))
                          }
                        />

                        <Field
                          label="PIN Code"
                          value={collectionAddr.pinCode}
                          maxLength={6}
                          onChange={(e) =>
                            setCollectionAddr((value) => ({
                              ...value,
                              pinCode: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="mc-row">
                    <span>Doctor</span>
                    <strong>
                      {doctor
                        ? `Dr. ${doctor.name}`
                        : 'Loading…'}
                    </strong>
                  </div>

                  <div className="mc-row">
                    <span>Visit Type</span>
                    <strong>{typeLabel}</strong>
                  </div>

                  <div className="mc-row">
                    <span>Date</span>
                    <strong>{date || '—'}</strong>
                  </div>

                  <div className="mc-row">
                    <span>Time</span>
                    <strong>{slot || '—'}</strong>
                  </div>

                  <div className="mc-row">
                    <span>Base Fee</span>
                    <strong>{rs(baseFee)}</strong>
                  </div>
                </>
              )}

              {!detailsReady && (
                <p className="mc-note">
                  Select the required date, time, and
                  appointment details to continue.
                </p>
              )}

              <Btn
                disabled={!detailsReady}
                onClick={() => setStep(2)}
              >
                Continue
                <ChevronRight size={16} />
              </Btn>
            </div>
          </Card>
        )}

        {/* STEP 2 — PATIENT DETAILS */}

        {step === 2 && (
          <Card
            title="Patient Details"
            sub="Who is this appointment for?"
          >
            <div className="mc-stack">
              <div className="mc-options">
                <button
                  type="button"
                  className={
                    patientType === 'myself'
                      ? 'active'
                      : ''
                  }
                  onClick={() => {
                    setPatientType('myself')
                    setSelectedFamilyId('')
                  }}
                >
                  <UserRound size={14} />
                  {' '}Self
                </button>

                <button
                  type="button"
                  className={
                    patientType === 'family'
                      ? 'active'
                      : ''
                  }
                  onClick={() => setPatientType('family')}
                >
                  <Users size={14} />
                  {' '}Family
                </button>
              </div>

              {patientType === 'family' ? (
                <div className="mc-stack">
                  <label className="mc-field">
                    <span>Select Family Member *</span>

                    <select
                      className="mc-family-select"
                      value={selectedFamilyId}
                      onChange={(e) =>
                        setSelectedFamilyId(e.target.value)
                      }
                      disabled={familyLoading || !!familyError}
                    >
                      <option value="">
                        Choose a family member
                      </option>

                      {familyMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} — {member.relation}
                        </option>
                      ))}
                    </select>
                  </label>

                  {familyLoading && (
                    <p className="mc-note">
                      Loading saved family members…
                    </p>
                  )}

                  {familyError && (
                    <div className="mc-error" role="alert">
                      Could not load family members:
                      {' '}{familyError.message}
                    </div>
                  )}

                  {!familyLoading &&
                    !familyError &&
                    familyMembers.length === 0 && (
                      <div className="mc-error">
                        No family members saved yet.
                        Add one under Profile → Family.
                      </div>
                    )}

                  {selectedFamilyMember && (
                    <div className="mc-row">
                      <span>Selected Patient</span>
                      <strong>
                        {selectedFamilyMember.name}
                        {' ('}
                        {selectedFamilyMember.relation}
                        {')'}
                      </strong>
                    </div>
                  )}

                  <div className="mc-family-actions">
                    <a
                      href="/user/profile"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Manage Family Members
                    </a>

                    <button
                      type="button"
                      onClick={() => refreshFamily()}
                      disabled={familyLoading}
                    >
                      Refresh List
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mc-row">
                  <span>Patient</span>
                  <strong>
                    {user?.name || 'Signed-in patient'}
                  </strong>
                </div>
              )}

              {!user?.email?.trim() && (
                <Field
                  label="Contact Email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) =>
                    setContactEmail(e.target.value)
                  }
                  placeholder="name@example.com"
                />
              )}

              {!user?.phone?.trim() && (
                <Field
                  label="Mobile Number"
                  type="tel"
                  maxLength={10}
                  value={contactPhone}
                  onChange={(e) =>
                    setContactPhone(
                      e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 10)
                    )
                  }
                  placeholder="10-digit mobile number"
                />
              )}

              <div className="mc-actions">
                <Btn
                  secondary
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft size={16} />
                  Back
                </Btn>

                <Btn disabled={working} onClick={savePatient}>
                  Continue
                  <ChevronRight size={16} />
                </Btn>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 3 — COUPON & PRICING */}

        {step === 3 && (
          <Card
            title="Coupon & Pricing"
            sub="Apply a coupon to save on your booking"
          >
            <div className="mc-stack">
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-end',
                }}
              >
                <Field
                  label="Coupon Code (Optional)"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  disabled={!!booking}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase())
                    setValidatedCoupon(null)
                  }}
                />

                <Btn
                  secondary
                  disabled={
                    couponWorking ||
                    !!booking ||
                    !couponCode.trim()
                  }
                  onClick={applyCoupon}
                >
                  {couponWorking ? 'Checking…' : 'Apply'}
                </Btn>
              </div>

              {validatedCoupon && !booking && (
                <div className="mc-success">
                  Coupon validated. Final savings are
                  calculated on the server.
                </div>
              )}

              {couponCode && !booking && (
                <button
                  type="button"
                  className="mc-btn secondary"
                  onClick={() => {
                    setCouponCode('')
                    setValidatedCoupon(null)
                  }}
                >
                  Remove Coupon
                </button>
              )}

              {quoteLoading && !booking && (
                <p className="mc-note">
                  Calculating exact price…
                </p>
              )}

              {quoteError && !booking && (
                <p className="mc-error">
                  {quoteError.message}
                </p>
              )}

              {pricing && <Summary pricing={pricing} />}

              {appliedCode &&
                quote &&
                !quote.couponApplied &&
                !booking && (
                  <p className="mc-error">
                    Coupon could not be applied.
                    Remove it before continuing.
                  </p>
                )}

              <div className="mc-actions">
                <Btn
                  secondary
                  disabled={!!booking}
                  onClick={() => setStep(2)}
                >
                  <ChevronLeft size={16} />
                  Back
                </Btn>

                <Btn
                  onClick={createBooking}
                  disabled={
                    working ||
                    (
                      !booking &&
                      (
                        quoteLoading ||
                        !!quoteError ||
                        !quote ||
                        !!(
                          appliedCode &&
                          !quote.couponApplied
                        )
                      )
                    )
                  }
                >
                  {working
                    ? 'Creating…'
                    : 'Continue to Payment'}
                  <ChevronRight size={16} />
                </Btn>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 4 — PAYMENT */}

        {step === 4 && (
          <Card
            title="Pay Securely"
            sub="Cashfree secure checkout will open in a popup"
          >
            <div className="mc-stack">
              <div
                style={{
                  color: '#6366f1',
                  fontWeight: 800,
                  letterSpacing: 1,
                  fontSize: 11,
                }}
              >
                {typeLabel.toUpperCase()}
              </div>

              <div className="mc-note">
                {isLab
                  ? `${collectionDate} · ${collectionTime}`
                  : `${date} · ${slot}`}
              </div>

              {booking?.patientName && (
                <div className="mc-row">
                  <span>Patient</span>
                  <strong>{booking.patientName}</strong>
                </div>
              )}

              {booking ? (
                <Summary pricing={booking} payment />
              ) : (
                <div className="mc-error">
                  No saved booking found.
                  Return to Pricing.
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  borderRadius: 12,
                  padding: 14,
                  background: '#f8fafc',
                }}
              >
                <ShieldCheck size={25} color="#6366f1" />

                <div>
                  <strong style={{ fontSize: 13 }}>
                    Secured by Cashfree Payments
                  </strong>

                  <p
                    className="mc-note"
                    style={{ margin: '4px 0 0' }}
                  >
                    Cards · Net Banking · UPI · Wallets · EMI
                  </p>
                </div>
              </div>

              <div className="mc-actions">
                <Btn
                  secondary
                  disabled={working}
                  onClick={() => setStep(3)}
                >
                  <ChevronLeft size={16} />
                  Back
                </Btn>

                <Btn
                  disabled={!booking || working}
                  onClick={initiatePayment}
                >
                  {working
                    ? 'Opening Checkout…'
                    : `PAY ${rs(booking?.totalAmount)}`}
                </Btn>
              </div>

              <p
                className="mc-note"
                style={{
                  textAlign: 'center',
                  margin: 0,
                }}
              >
                By proceeding, you agree to our{' '}
                <a href="/terms">Terms</a>
                {' '}and{' '}
                <a href="/privacy">Privacy Policy</a>.
              </p>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}

export default function NewBookingPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: 60,
            textAlign: 'center',
          }}
        >
          Loading booking…
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  )
}
