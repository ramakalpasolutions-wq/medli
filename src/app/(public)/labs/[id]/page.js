'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'

const fetcher = (url) => fetch(url).then((r) => r.json()).then((j) => j.data)

function CartBar({ cart, labId, onRemove, router }) {
  const [show, setShow] = useState(false)
  const cartTotal = cart.reduce((s, t) => s + (t.discountedPrice || t.price), 0)

  useState(() => { setShow(cart.length > 0) }, [cart.length])

  if (!cart.length) return null

  return (
    <div style={{
      position:'fixed',bottom:0,left:0,right:0,
      background:'rgba(255,255,255,0.97)',
      borderTop:'1px solid #f1f5f9',
      padding:'12px clamp(16px,3vw,32px)',
      display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,
      zIndex:200,
      boxShadow:'0 -8px 32px rgba(0,0,0,0.1)',
      backdropFilter:'blur(20px)',
      animation:'slideUp .3s ease',
    }}>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
        <div style={{
          width:40,height:40,borderRadius:12,
          background:'rgba(16,185,129,0.1)',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,
        }}>🛒</div>
        <div>
          <p style={{ fontSize:12,color:'#94a3b8',margin:0 }}>
            {cart.length} test{cart.length>1?'s':''} selected
          </p>
          <p style={{ fontSize:15,fontWeight:700,color:'#0f172a',margin:0 }}>
            ₹{cartTotal.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
      <BookNowBtn onClick={() => router.push(`/user/bookings/new?labId=${labId}&testIds=${cart.map((c)=>c.id).join(',')}`)} />
    </div>
  )
}

function BookNowBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding:'11px 24px',borderRadius:12,border:'none',
        background: h ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#10b981,#059669)',
        color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',
        boxShadow: h ? '0 8px 24px rgba(16,185,129,0.5)' : '0 4px 14px rgba(16,185,129,0.35)',
        transition:'all .18s ease',
        display:'flex',alignItems:'center',gap:8,
        transform: h ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      Book Now →
    </button>
  )
}

function TestCard({ test, inCart, onAdd, onRemove }) {
  const [addHover, setAddHover] = useState(false)

  return (
    <div style={{
      background:'#fff',borderRadius:20,padding:18,
      border:`1.5px solid ${inCart?'#a7f3d0':'#f1f5f9'}`,
      boxShadow: inCart ? '0 4px 16px rgba(16,185,129,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
      transition:'all .2s ease',
    }}>
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,marginBottom:8 }}>
        <div style={{ flex:1,minWidth:0 }}>
          <h4 style={{ fontSize:13,fontWeight:700,color:'#0f172a',margin:'0 0 2px',lineHeight:1.4 }}>
            {test.name}
          </h4>
          {test.code && <p style={{ fontSize:11,color:'#94a3b8',margin:0 }}>Code: {test.code}</p>}
        </div>
        {test.category && <Badge variant="info" size="sm">{test.category}</Badge>}
      </div>

      <div style={{ display:'flex',gap:12,marginBottom:12 }}>
        <p style={{ fontSize:11,color:'#94a3b8',margin:0 }}>
          🧪 {test.sampleType || 'Blood'}
        </p>
        {test.turnaroundTime && (
          <p style={{ fontSize:11,color:'#94a3b8',margin:0 }}>
            ⏱ {test.turnaroundTime.value} {test.turnaroundTime.unit}
          </p>
        )}
      </div>

      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <div>
          {test.discountedPrice ? (
            <div style={{ display:'flex',alignItems:'baseline',gap:6 }}>
              <span style={{ fontSize:18,fontWeight:800,color:'#0f172a' }}>₹{test.discountedPrice}</span>
              <span style={{ fontSize:12,color:'#94a3b8',textDecoration:'line-through' }}>₹{test.price}</span>
              <span style={{
                fontSize:10,fontWeight:600,
                background:'rgba(16,185,129,0.1)',color:'#059669',
                padding:'1px 6px',borderRadius:100,
              }}>
                {Math.round((1-test.discountedPrice/test.price)*100)}% off
              </span>
            </div>
          ) : (
            <span style={{ fontSize:18,fontWeight:800,color:'#0f172a' }}>₹{test.price}</span>
          )}
        </div>
        <button
          onClick={() => inCart ? onRemove(test.id) : onAdd(test)}
          onMouseEnter={() => setAddHover(true)}
          onMouseLeave={() => setAddHover(false)}
          style={{
            padding:'8px 16px',borderRadius:10,border:'none',fontSize:12,fontWeight:600,cursor:'pointer',
            background: inCart
              ? addHover ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)'
              : addHover ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#10b981,#059669)',
            color: inCart ? '#ef4444' : '#fff',
            boxShadow: !inCart && addHover ? '0 4px 12px rgba(16,185,129,0.4)' : 'none',
            transition:'all .15s ease',
            minHeight:36,
          }}
        >
          {inCart ? '✕ Remove' : '+ Add'}
        </button>
      </div>
    </div>
  )
}

export default function LabDetailPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState([])

  const { data: lab,      isLoading: lLoading } = useSWR(`/api/labs/${id}`,       fetcher)
  const { data: testsData, isLoading: tLoading } = useSWR(`/api/labs/${id}/tests`, fetcher)

  const allTests   = testsData?.tests || []
  const categories = ['all', ...new Set(allTests.map((t) => t.category).filter(Boolean))]
  const filtered   = selectedCategory === 'all' ? allTests : allTests.filter((t) => t.category === selectedCategory)

  const addToCart    = (test) => { if (!cart.find((c) => c.id===test.id)) setCart([...cart, test]) }
  const removeFromCart = (id)  => setCart(cart.filter((c) => c.id !== id))

  if (lLoading) {
    return (
      <div style={{ minHeight:'100vh',background:'#f8fafc' }}>
        <Navbar />
        <div style={{ maxWidth:800,margin:'0 auto',padding:'100px 16px 64px' }}>
          <SkeletonCard />
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ minHeight:'100vh',background:'#f8fafc',paddingBottom: cart.length?80:0 }}>
        <Navbar />

        {/* Hero */}
        <div style={{
          position:'relative',height:240,
          background:'linear-gradient(135deg,#059669,#10b981)',
          overflow:'hidden',marginTop:64,
        }}>
          {lab?.images?.cover && (
            <img src={lab.images.cover} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
          )}
          <div style={{ position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.6),rgba(0,0,0,0.1))' }} />

          <div style={{
            position:'absolute',bottom:0,left:0,right:0,
            padding:'0 clamp(16px,3vw,32px) 20px',
            display:'flex',alignItems:'flex-end',gap:14,flexWrap:'wrap',
          }}>
            <div style={{
              width:56,height:56,borderRadius:14,background:'#fff',
              border:'3px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:26,boxShadow:'0 6px 20px rgba(0,0,0,0.15)',overflow:'hidden',flexShrink:0,
            }}>
              {lab?.images?.logo
                ? <img src={lab.images.logo} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                : '🧪'}
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <h1 style={{ fontSize:'clamp(16px,3vw,22px)',fontWeight:800,color:'#fff',margin:'0 0 4px',lineHeight:1.2 }}>
                {lab?.name}
              </h1>
              {lab?.address?.city && (
                <p style={{ fontSize:12,color:'rgba(255,255,255,0.8)',margin:'0 0 4px' }}>
                  📍 {lab.address.city}
                </p>
              )}
              {lab?.homeCollection?.enabled && (
                <span style={{
                  display:'inline-flex',alignItems:'center',gap:4,
                  background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.25)',
                  borderRadius:100,padding:'2px 10px',fontSize:11,fontWeight:600,color:'#fff',
                }}>
                  🏠 Home Collection
                </span>
              )}
            </div>
            {lab?.rating?.average > 0 && (
              <div style={{
                display:'flex',alignItems:'center',gap:6,
                background:'rgba(255,255,255,0.92)',backdropFilter:'blur(8px)',
                borderRadius:100,padding:'5px 12px',flexShrink:0,
              }}>
                <span>⭐</span>
                <span style={{ fontSize:13,fontWeight:700,color:'#1e293b' }}>{lab.rating.average.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Certifications strip */}
        {lab?.certifications?.length > 0 && (
          <div style={{
            background:'#fff',borderBottom:'1px solid #f1f5f9',
            padding:'10px clamp(16px,3vw,32px)',
            display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',
          }}>
            <span style={{ fontSize:11,color:'#94a3b8',fontWeight:600 }}>CERTIFIED:</span>
            {lab.certifications.map((c) => (
              <Badge key={c} variant="success" size="sm">{c}</Badge>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ maxWidth:860,margin:'0 auto',padding:'clamp(20px,4vw,32px) clamp(16px,3vw,32px)' }}>

          {/* Category filter */}
          <div style={{
            display:'flex',gap:6,overflowX:'auto',paddingBottom:12,marginBottom:16,
            scrollbarWidth:'none',
          }}>
            {categories.map((c) => (
              <CategoryBtn
                key={c}
                label={c === 'all' ? 'All Tests' : c}
                active={selectedCategory === c}
                onClick={() => setSelectedCategory(c)}
              />
            ))}
          </div>

          {/* Test grid */}
          {tLoading ? (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14 }}>
              {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : !filtered.length ? (
            <EmptyState title="No tests found" />
          ) : (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14 }}>
              {filtered.map((test) => (
                <TestCard
                  key={test.id}
                  test={test}
                  inCart={!!cart.find((c) => c.id === test.id)}
                  onAdd={addToCart}
                  onRemove={removeFromCart}
                />
              ))}
            </div>
          )}
        </div>

        <CartBar cart={cart} labId={id} onRemove={removeFromCart} router={router} />
        <Footer />
      </div>
    </>
  )
}

function CategoryBtn({ label, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding:'6px 14px',borderRadius:100,
        fontSize:12,fontWeight:500,
        background: active
          ? 'linear-gradient(135deg,#10b981,#059669)'
          : h ? '#e2e8f0' : '#f1f5f9',
        color: active ? '#fff' : '#64748b',
        border:'none',cursor:'pointer',whiteSpace:'nowrap',
        boxShadow: active ? '0 2px 8px rgba(16,185,129,0.35)' : 'none',
        transition:'all .15s ease',
        transform: active ? 'scale(1.02)' : 'scale(1)',
        flexShrink:0,
      }}
    >
      {label}
    </button>
  )
}