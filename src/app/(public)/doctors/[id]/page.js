'use client'

import { use, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { Star, MapPin, IndianRupee, Video, User } from 'lucide-react'

const fetcher = (url) => fetch(url).then((r) => r.json()).then((j) => j.data)

function generateDates(count = 14) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); return d
  })
}

const colorClass = {
  green:  'bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium',
  yellow: 'bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-full font-medium',
  red:    'bg-red-50 text-red-700 text-xs px-2 py-1 rounded-full font-medium',
  grey:   'bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full font-medium',
}

export default function DoctorPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const [consultType, setConsultType] = useState('offline')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const dates = generateDates()

  const { data: doctor } = useSWR(`/api/doctors/${id}`, fetcher)
  const { data: slotsData, isLoading: slotsLoading } = useSWR(
    selectedDate ? `/api/doctors/${id}/slots?date=${selectedDate}` : null, fetcher
  )

  const fee = consultType === 'online' ? doctor?.consultationFee?.online : doctor?.consultationFee?.offline

  const handleBook = () => {
    if (!selectedSlot) return
    router.push(`/user/bookings/new?doctorId=${id}&date=${selectedDate}&slot=${selectedSlot}&type=${consultType}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {/* Doctor Info */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden">
              {doctor?.avatar ? <img src={doctor.avatar} alt="" className="w-full h-full object-cover" /> : '👨‍⚕️'}
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">Dr. {doctor?.name || '—'}</h1>
              <p className="text-blue-600 text-sm font-medium">{(doctor?.specialization || []).join(', ')}</p>
              <p className="text-gray-400 text-xs mt-0.5">{(doctor?.qualifications || []).join(', ')}</p>
              {doctor?.experience && <p className="text-xs text-gray-400">{doctor.experience} years experience</p>}
              {doctor?.rating?.average > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-semibold">{doctor.rating.average.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({doctor.rating.count})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Consultation type toggle */}
        <div className="flex gap-3 mb-6">
          {[
            { key: 'offline', label: 'In-Person', icon: <User className="w-4 h-4" />, fee: doctor?.consultationFee?.offline },
            { key: 'online', label: 'Video Call', icon: <Video className="w-4 h-4" />, fee: doctor?.consultationFee?.online },
          ].filter((t) => t.fee > 0 || t.key === 'offline').map((t) => (
            <motion.button key={t.key} whileTap={{ scale: 0.97 }} onClick={() => { setConsultType(t.key); setSelectedSlot(null) }}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${consultType === t.key ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>
              {t.icon}
              <span className="text-xs font-semibold">{t.label}</span>
              {t.fee > 0 && <span className="text-xs">₹{t.fee}</span>}
            </motion.button>
          ))}
        </div>

        {/* Date strip */}
        <div className="overflow-x-auto flex gap-2 pb-3 mb-4">
          {dates.map((d) => {
            const ds = d.toISOString().split('T')[0]
            const isToday = ds === new Date().toISOString().split('T')[0]
            const active = ds === selectedDate
            return (
              <button key={ds} onClick={() => { setSelectedDate(ds); setSelectedSlot(null) }}
                className={`flex flex-col items-center min-w-[52px] px-2 py-2 rounded-xl text-xs transition-colors flex-shrink-0 ${active ? 'bg-blue-600 text-white' : isToday ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'}`}
                style={{ minHeight: 44 }}>
                <span className="font-semibold">{d.toLocaleDateString('en', { weekday: 'short' })}</span>
                <span className="text-lg font-bold">{d.getDate()}</span>
              </button>
            )
          })}
        </div>

        {/* Slot picker */}
        {slotsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : slotsData?.exception ? (
          <EmptyState title="Doctor unavailable" message={slotsData.reason} />
        ) : !slotsData?.hourBlocks?.length ? (
          <EmptyState title="No slots available" message="Try another date" />
        ) : (
          <div className="space-y-4">
            {slotsData.hourBlocks.map((block) => (
              <div key={block.hour} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-gray-700">{block.hourLabel}</span>
                  <span className={colorClass[block.availabilityColor] || colorClass.grey}>
                    {block.availabilityLabel}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {block.slots.map((slot) => {
                    const isSelected = selectedSlot === slot.startTime
                    return (
                      <button key={slot.startTime}
                        disabled={slot.isBooked}
                        onClick={() => setSelectedSlot(isSelected ? null : slot.startTime)}
                        className={`py-2 rounded-lg text-xs text-center transition-all ${
                          slot.isBooked
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isSelected
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'bg-white border border-gray-200 hover:border-blue-500 text-gray-700 cursor-pointer'
                        }`}
                        style={{ minHeight: 36 }}
                      >
                        {slot.startTime}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky footer when slot selected */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-30"
            style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.08)' }}
          >
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500">Selected slot</p>
                <p className="text-sm font-bold text-gray-800">{selectedDate} · {selectedSlot} · {consultType}</p>
                <p className="text-xs text-blue-600 font-semibold">₹{fee || 0}</p>
              </div>
              <Button variant="primary" size="md" onClick={handleBook}>Continue</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}