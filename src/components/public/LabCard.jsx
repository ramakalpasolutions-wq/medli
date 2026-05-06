'use client'

import { motion } from 'framer-motion'
import { MapPin, Star, Home, ChevronRight, Award } from 'lucide-react'

export default function LabCard({ lab, onClick }) {
  const { name, images, address, rating, certifications = [], homeCollection, distance } = lab || {}
  const hasNABL = certifications.some((c) => c?.toLowerCase().includes('nabl'))
  const hasISO  = certifications.some((c) => c?.toLowerCase().includes('iso'))

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 cursor-pointer min-w-[280px] max-w-[320px] flex-shrink-0"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      {/* Cover */}
      <div className="relative h-36 bg-gradient-to-br from-green-100 to-emerald-200 overflow-hidden">
        {images?.cover ? (
          <img src={images.cover} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🧪</div>
        )}
        <div className="absolute top-3 right-3 flex gap-1">
          {hasNABL && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">NABL</span>}
          {hasISO  && <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-semibold">ISO</span>}
        </div>
        <div className="absolute bottom-0 left-4 translate-y-1/2 w-12 h-12 rounded-xl bg-white border-2 border-white flex items-center justify-center text-xl shadow-md overflow-hidden">
          {images?.logo ? <img src={images.logo} alt="" className="w-full h-full object-cover" /> : '🧪'}
        </div>
      </div>

      <div className="p-4 pt-8">
        <h3 className="text-sm font-bold text-gray-900 truncate mb-1">{name || 'Lab'}</h3>

        <div className="flex items-center gap-3 mb-2">
          {rating?.average > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-gray-700">{rating.average.toFixed(1)}</span>
            </div>
          )}
          {distance && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">{(distance / 1000).toFixed(1)} km</span>
            </div>
          )}
        </div>

        {address?.city && (
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {address.city}
          </p>
        )}

        {homeCollection?.enabled && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
              <Home className="w-3 h-3" /> Home Collection
            </span>
          </div>
        )}

        <button className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl transition-colors">
          Book Tests <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}