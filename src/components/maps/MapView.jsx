'use client'

import { useEffect, useRef } from 'react'

export default function MapView({ items = [] }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)

  useEffect(() => {
    if (!mapRef.current || !window.google) return

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      zoom: 13,
      center: { lat: 19.076, lng: 72.8777 },
      styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
    })

    items.forEach((item) => {
      const coords = item.location?.coordinates
      if (!coords) return
      new window.google.maps.Marker({
        position: { lat: coords[1], lng: coords[0] },
        map: mapInstance.current,
        title: item.name,
      })
    })
  }, [items])

  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div ref={mapRef} className="w-full h-full" />
      {typeof window !== 'undefined' && !window.google && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-sm text-gray-500">Map view requires Google Maps API key</p>
          </div>
        </div>
      )}
    </div>
  )
}