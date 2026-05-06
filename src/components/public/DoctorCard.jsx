'use client'

import { motion } from 'framer-motion'
import { Star, IndianRupee, ChevronRight } from 'lucide-react'

export default function DoctorCard({ doctor, onClick }) {
  const { name, avatar, specialization = [], rating, consultationFee, experience } = doctor || {}

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-5 border border-gray-100 cursor-pointer"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
          {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : '👨‍⚕️'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 truncate">Dr. {name}</h3>
          <p className="text-xs text-blue-600 font-medium truncate">{specialization.slice(0, 2).join(', ') || 'General'}</p>
          {experience && <p className="text-xs text-gray-400">{experience} years exp.</p>}
        </div>
      </div>

      {rating?.average > 0 && (
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-xs font-semibold text-gray-700">{rating.average.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({rating.count} reviews)</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <IndianRupee className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-sm font-bold text-gray-800">{consultationFee?.offline || 0}</span>
          <span className="text-xs text-gray-400">/ visit</span>
        </div>
        {consultationFee?.online > 0 && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Online ₹{consultationFee.online}</span>
        )}
      </div>

      <button className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors">
        Book Appointment <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}