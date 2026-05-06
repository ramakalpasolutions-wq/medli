'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import DoctorCard from '@/components/public/DoctorCard'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { SkeletonCard } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { Search } from 'lucide-react'

const fetcher = (url) => fetch(url).then((r) => r.json()).then((j) => j.data)

const SPECIALIZATIONS = [
  'Cardiologist',
  'Neurologist',
  'Gynecologist',
  'Dermatologist',
  'Orthopedic Surgeon',
  'General Physician',
  'Pediatrician',
  'Diabetologist',
]

export default function DoctorsPage() {
  const router         = useRouter()
  const [search,       setSearch]       = useState('')
  const [specialization, setSpecialization] = useState('')

  const qs = new URLSearchParams({ limit: 20 })
  if (search)         qs.set('search', search)
  if (specialization) qs.set('specialization', specialization)

  const { data, isLoading } = useSWR(`/api/doctors?${qs}`, fetcher)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Doctors in Guntur
          </h1>
          <p className="text-gray-500 text-sm">
            Book appointments with verified doctors — in-person or online
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Input
            placeholder="Search doctors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="w-72"
          />
          <Select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="w-52"
            placeholder="All Specializations"
          >
            {SPECIALIZATIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>

        {/* Specialization pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSpecialization('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !specialization
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {SPECIALIZATIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSpecialization(s === specialization ? '' : s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                specialization === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Doctor grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : !data?.doctors?.length ? (
          <EmptyState
            title="No doctors found"
            message="Try adjusting your search or specialization filter"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.doctors.map((d) => (
              <DoctorCard
                key={d.id}
                doctor={d}
                onClick={() => router.push(`/doctors/${d.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}