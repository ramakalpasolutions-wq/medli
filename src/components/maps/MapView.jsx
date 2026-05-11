'use client'

import dynamic from 'next/dynamic'

const LeafletMap = dynamic(
  () => import('@/components/maps/LeafletMap'),
  { ssr: false }
)

export default function MapView({ items = [], height = '400px' }) {
  const markers = items
    .filter((item) => item.location?.coordinates?.length === 2)
    .map((item) => ({
      id:      item._id || item.id,
      lat:     item.location.coordinates[1],  // GeoJSON = [lng, lat]
      lng:     item.location.coordinates[0],
      name:    item.name,
      address: item.address?.city,
      href:    `/hospitals/${item._id || item.id}`,
      emoji:   '🏥',
      rating:  item.rating?.average ? item.rating.average.toFixed(1) : null,
    }))

  return (
    <div style={{ width: '100%', height }}>
      <LeafletMap markers={markers} height={height} />
    </div>
  )
}