'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import DoctorCard from '@/components/public/DoctorCard'
import Tabs from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { useState } from 'react'
import { Star, MapPin, Phone, Mail } from 'lucide-react'

const fetcher = (url) => fetch(url).then((r) => r.json()).then((j) => j.data)

export default function HospitalPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const [tab, setTab] = useState('doctors')

  const { data: hospital, isLoading } = useSWR(`/api/hospitals/${id}`, fetcher)
  const { data: doctorsData, isLoading: dLoading } = useSWR(`/api/hospitals/${id}/doctors`, fetcher)

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50"><Navbar /><div className="max-w-4xl mx-auto px-4 pt-24 pb-16"><SkeletonCard /></div><Footer /></div>
  )

  if (!hospital) return (
    <div className="min-h-screen bg-gray-50"><Navbar /><div className="pt-24"><EmptyState title="Hospital not found" /></div><Footer /></div>
  )

  const tabs = [
    { key: 'doctors', label: 'Doctors', count: doctorsData?.length || 0 },
    { key: 'about', label: 'About' },
    { key: 'gallery', label: 'Gallery', count: hospital.images?.gallery?.length || 0 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="relative h-64 bg-gradient-to-br from-blue-600 to-indigo-700 overflow-hidden mt-16">
        {hospital.images?.cover && <img src={hospital.images.cover} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-3xl border-4 border-white shadow-lg overflow-hidden">
            {hospital.images?.logo ? <img src={hospital.images.logo} alt="" className="w-full h-full object-cover" /> : '🏥'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{hospital.name}</h1>
            {hospital.address?.city && (
              <p className="text-blue-200 text-sm flex items-center gap-1"><MapPin className="w-3 h-3" />{hospital.address.city}</p>
            )}
          </div>
          {hospital.rating?.average > 0 && (
            <div className="ml-auto flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-full">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold">{hospital.rating.average.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs tabs={tabs} activeTab={tab} onChange={setTab} className="mb-6" />

        {tab === 'doctors' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dLoading ? [1,2,3,4].map((i) => <SkeletonCard key={i} />) :
             !doctorsData?.length ? <div className="col-span-2"><EmptyState title="No doctors listed" /></div> :
             doctorsData.map((d) => <DoctorCard key={d.id} doctor={d} onClick={() => router.push(`/doctors/${d.id}`)} />)}
          </div>
        )}

        {tab === 'about' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">Departments</h3>
              <div className="flex flex-wrap gap-2">
                {(hospital.departments || []).map((d) => <Badge key={d} variant="info" size="md">{d}</Badge>)}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">Contact</h3>
              <div className="space-y-2">
                {hospital.contactPhone && <p className="text-sm text-gray-600 flex items-center gap-2"><Phone className="w-4 h-4 text-blue-500" />{hospital.contactPhone}</p>}
                {hospital.contactEmail && <p className="text-sm text-gray-600 flex items-center gap-2"><Mail className="w-4 h-4 text-blue-500" />{hospital.contactEmail}</p>}
              </div>
            </div>
          </div>
        )}

        {tab === 'gallery' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(hospital.images?.gallery || []).map((img, i) => (
              <motion.img key={i} src={img} alt="" className="w-full h-48 object-cover rounded-2xl" whileHover={{ scale: 1.02 }} />
            ))}
            {!hospital.images?.gallery?.length && <div className="col-span-3"><EmptyState title="No gallery images" /></div>}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}