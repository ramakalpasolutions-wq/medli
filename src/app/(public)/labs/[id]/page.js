'use client'

import { use, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Star, MapPin, Home, ShoppingCart, X, ChevronRight } from 'lucide-react'

const fetcher = (url) => fetch(url).then((r) => r.json()).then((j) => j.data)

export default function LabPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState([])

  const { data: lab, isLoading } = useSWR(`/api/labs/${id}`, fetcher)
  const { data: testsData, isLoading: tLoading } = useSWR(`/api/labs/${id}/tests`, fetcher)

  const allTests = testsData?.tests || []
  const categories = ['all', ...new Set(allTests.map((t) => t.category).filter(Boolean))]
  const filtered = selectedCategory === 'all' ? allTests : allTests.filter((t) => t.category === selectedCategory)

  const addToCart = (test) => {
    if (!cart.find((c) => c.id === test.id)) setCart([...cart, test])
  }
  const removeFromCart = (testId) => setCart(cart.filter((c) => c.id !== testId))
  const cartTotal = cart.reduce((s, t) => s + (t.discountedPrice || t.price), 0)

  if (isLoading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="max-w-4xl mx-auto px-4 pt-24"><SkeletonCard /></div><Footer /></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Navbar />

      {/* Hero */}
      <div className="relative h-56 bg-gradient-to-br from-green-600 to-emerald-700 overflow-hidden mt-16">
        {lab?.images?.cover && <img src={lab.images.cover} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-2xl border-4 border-white shadow-lg overflow-hidden">
            {lab?.images?.logo ? <img src={lab.images.logo} alt="" className="w-full h-full object-cover" /> : '🧪'}
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{lab?.name}</h1>
            {lab?.address?.city && <p className="text-green-200 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{lab.address.city}</p>}
            {lab?.homeCollection?.enabled && <span className="text-xs bg-green-400/20 text-green-200 px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1"><Home className="w-3 h-3" /> Home Collection</span>}
          </div>
          {lab?.rating?.average > 0 && (
            <div className="ml-auto flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-full">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold">{lab.rating.average.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {categories.map((c) => (
            <button key={c} onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === c ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {c === 'all' ? 'All Tests' : c}
            </button>
          ))}
        </div>

        {/* Test cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tLoading ? [1,2,3,4].map((i) => <SkeletonCard key={i} />) :
           !filtered.length ? <div className="col-span-2"><EmptyState title="No tests found" /></div> :
           filtered.map((test) => {
             const inCart = cart.find((c) => c.id === test.id)
             return (
               <motion.div key={test.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                 className="bg-white rounded-2xl p-4 border border-gray-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                 <div className="flex items-start justify-between mb-2">
                   <div>
                     <h4 className="text-sm font-semibold text-gray-800">{test.name}</h4>
                     {test.code && <p className="text-xs text-gray-400">Code: {test.code}</p>}
                   </div>
                   {test.category && <Badge variant="info" size="sm">{test.category}</Badge>}
                 </div>
                 <p className="text-xs text-gray-400 mb-1">Sample: {test.sampleType || 'Blood'}</p>
                 {test.turnaroundTime && <p className="text-xs text-gray-400 mb-3">TAT: {test.turnaroundTime.value} {test.turnaroundTime.unit}</p>}
                 <div className="flex items-center justify-between">
                   <div>
                     {test.discountedPrice ? (
                       <div className="flex items-center gap-1.5">
                         <span className="text-base font-bold text-gray-900">₹{test.discountedPrice}</span>
                         <span className="text-xs text-gray-400 line-through">₹{test.price}</span>
                       </div>
                     ) : (
                       <span className="text-base font-bold text-gray-900">₹{test.price}</span>
                     )}
                   </div>
                   <button
                     onClick={() => inCart ? removeFromCart(test.id) : addToCart(test)}
                     className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${inCart ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-600 text-white hover:bg-green-700'}`}
                     style={{ minHeight: 44 }}
                   >
                     {inCart ? 'Remove' : '+ Add'}
                   </button>
                 </div>
               </motion.div>
             )
           })}
        </div>
      </div>

      {/* Cart floating bar */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between z-30"
            style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.08)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{cart.length} test{cart.length > 1 ? 's' : ''} selected</p>
                <p className="text-sm font-bold text-gray-800">₹{cartTotal.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <Button variant="primary" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}
              onClick={() => router.push(`/user/bookings/new?labId=${id}&testIds=${cart.map((c) => c.id).join(',')}`)}>
              Book Now
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}