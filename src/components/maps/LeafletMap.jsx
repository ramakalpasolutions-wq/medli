'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

export default function LeafletMap({
  markers = [],
  selected,
  onSelect,
  height = '400px',
  zoom = 13,
  accentColor = '#1286f5',
}) {
  const mapRef = useRef(null)
  const mapInst = useRef(null)
  const leafletRef = useRef(null)
  const markerRefs = useRef([])
  const userMarker = useRef(null)
  const mountedRef = useRef(false)
  const destroyedRef = useRef(false)
  const invalidateTimerRef = useRef(null)

  const [userLocation, setUserLocation] = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [locError, setLocError] = useState(null)
  const [distances, setDistances] = useState({})

  const validMarkers = useMemo(
    () => markers.filter((m) => m?.lat != null && m?.lng != null),
    [markers]
  )

  const calcDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }, [])

  const formatDist = (km) =>
    km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`

  const isMapSafe = useCallback(() => {
    const map = mapInst.current
    return !!(
      mountedRef.current &&
      !destroyedRef.current &&
      map &&
      map._container &&
      map._mapPane
    )
  }, [])

  const clearMarkers = useCallback(() => {
    markerRefs.current.forEach((m) => {
      try {
        m.off()
        m.closePopup?.()
        m.remove()
      } catch {}
    })
    markerRefs.current = []
  }, [])

  const clearUserMarker = useCallback(() => {
    try {
      userMarker.current?.off?.()
      userMarker.current?.closePopup?.()
      userMarker.current?.remove?.()
    } catch {}
    userMarker.current = null
  }, [])

  const stopMapMotion = useCallback(() => {
    try {
      mapInst.current?.stop?.()
    } catch {}
  }, [])

  const fetchUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported')
      return
    }

    setLocLoading(true)
    setLocError(null)

    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        if (!mountedRef.current || destroyedRef.current) return

        setUserLocation({ lat, lng })
        setLocLoading(false)

        const nextDistances = {}
        validMarkers.forEach((m) => {
          nextDistances[m.id] = calcDistance(lat, lng, m.lat, m.lng)
        })
        setDistances(nextDistances)
      },
      (err) => {
        if (!mountedRef.current || destroyedRef.current) return

        setLocLoading(false)
        setLocError(
          err.code === 1
            ? 'Permission denied'
            : err.code === 2
              ? 'Location unavailable'
              : 'Timeout'
        )
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    )
  }, [validMarkers, calcDistance])

  useEffect(() => {
    mountedRef.current = true
    destroyedRef.current = false

    return () => {
      mountedRef.current = false
      destroyedRef.current = true

      if (invalidateTimerRef.current) {
        clearTimeout(invalidateTimerRef.current)
        invalidateTimerRef.current = null
      }

      stopMapMotion()
      clearMarkers()
      clearUserMarker()

      if (mapInst.current) {
        try {
          mapInst.current.off()
          mapInst.current.remove()
        } catch {}
        mapInst.current = null
      }

      if (mapRef.current?._leaflet_id) {
        try {
          delete mapRef.current._leaflet_id
        } catch {}
      }
    }
  }, [clearMarkers, clearUserMarker, stopMapMotion])

  useEffect(() => {
    if (!mapRef.current || mapInst.current || validMarkers.length === 0) return

    let cancelled = false

    ;(async () => {
      try {
        const Lmod = await import('leaflet')
        if (cancelled || !mountedRef.current || destroyedRef.current || !mapRef.current) return

        const L = Lmod.default || Lmod
        leafletRef.current = L

        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        if (mapRef.current?._leaflet_id) {
          try {
            delete mapRef.current._leaflet_id
          } catch {}
        }

        const first = validMarkers[0]
        if (!first) return

        mapInst.current = L.map(mapRef.current, {
          center: [first.lat, first.lng],
          zoom,
          zoomControl: false,
          scrollWheelZoom: false,
          attributionControl: false,
          fadeAnimation: false,
          markerZoomAnimation: false,
          zoomAnimation: false,
        })

        L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          { maxZoom: 19, subdomains: 'abcd' }
        ).addTo(mapInst.current)

        L.control.attribution({ position: 'bottomright', prefix: false })
          .addAttribution('© <a href="https://carto.com">CARTO</a>')
          .addTo(mapInst.current)

        L.control.zoom({ position: 'bottomright' }).addTo(mapInst.current)

        invalidateTimerRef.current = setTimeout(() => {
          if (!isMapSafe()) return
          try {
            mapInst.current.invalidateSize(false)
          } catch {}
        }, 200)
      } catch (err) {
        if (mountedRef.current && !destroyedRef.current) {
          console.error('[LeafletMap:init]', err)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [validMarkers, zoom, isMapSafe])

  useEffect(() => {
    if (!userLocation) return

    const nextDistances = {}
    validMarkers.forEach((m) => {
      nextDistances[m.id] = calcDistance(userLocation.lat, userLocation.lng, m.lat, m.lng)
    })
    setDistances(nextDistances)
  }, [validMarkers, userLocation, calcDistance])

  useEffect(() => {
    const L = leafletRef.current
    if (!L || !isMapSafe()) return

    clearUserMarker()

    if (!userLocation) return

    try {
      const userIcon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:20px;height:20px;">
            <div style="
              position:absolute;inset:0;
              background:${accentColor};border:3px solid #fff;
              border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.3);z-index:2;
            "></div>
            <div style="
              position:absolute;top:50%;left:50%;
              transform:translate(-50%,-50%);
              width:40px;height:40px;
              background:${accentColor}30;border-radius:50%;
              animation:pulse-ring 2s infinite;z-index:1;
            "></div>
          </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      userMarker.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      })
        .addTo(mapInst.current)
        .bindPopup(
          '<div style="font-family:Arial;font-size:13px;font-weight:600;color:#1a1a2e;padding:4px 2px;">📍 You are here</div>',
          { maxWidth: 160, closeButton: false, autoPan: false }
        )
    } catch {}
  }, [userLocation, accentColor, clearUserMarker, isMapSafe])

  useEffect(() => {
    const L = leafletRef.current
    if (!L || !isMapSafe()) return

    clearMarkers()

    validMarkers.forEach((item) => {
      if (!isMapSafe()) return

      try {
        const isSelected = selected?.id === item.id
        const pinColor = isSelected ? '#f59e0b' : item.color || accentColor
        const pinW = isSelected ? 36 : 30
        const pinH = isSelected ? 48 : 40
        const dist = distances[item.id]

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              position:relative;width:${pinW}px;height:${pinH}px;
              cursor:pointer;filter:drop-shadow(0 3px 6px rgba(0,0,0,.28));
            ">
              <svg viewBox="0 0 36 48" width="${pinW}" height="${pinH}" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 0C10.268 0 4 6.268 4 14C4 24.5 18 48 18 48C18 48 32 24.5 32 14C32 6.268 25.732 0 18 0Z"
                  fill="${pinColor}" stroke="#fff" stroke-width="2"/>
                <circle cx="18" cy="14" r="7" fill="#fff" opacity="0.92"/>
                <text x="18" y="19" font-size="9" text-anchor="middle" font-family="Arial,sans-serif">${item.emoji || '📍'}</text>
              </svg>
              ${isSelected ? `<div style="
                position:absolute;bottom:-3px;left:50%;
                transform:translateX(-50%);
                width:14px;height:4px;
                background:rgba(0,0,0,.15);border-radius:50%;filter:blur(2px);
              "></div>` : ''}
            </div>`,
          iconSize: [pinW, pinH],
          iconAnchor: [pinW / 2, pinH],
          popupAnchor: [0, -(pinH + 2)],
        })

        const distBadge =
          dist != null
            ? `<span style="
                display:inline-flex;align-items:center;gap:3px;
                background:${pinColor}18;border:1px solid ${pinColor}50;
                color:${pinColor};font-size:10px;font-weight:600;
                padding:2px 8px;border-radius:20px;margin-bottom:7px;
              ">📍 ${formatDist(dist)} away</span>`
            : ''

        const popupHtml = `
          <div style="min-width:210px;max-width:260px;padding:8px 2px 4px;font-family:Arial,sans-serif;">
            <p style="font-weight:700;font-size:13px;color:#1a1a2e;margin:0 0 3px;line-height:1.3;">${item.name}</p>
            ${item.address ? `<p style="font-size:11px;color:#6b7280;margin:0 0 5px;">📍 ${item.address}</p>` : ''}
            ${distBadge}
            ${item.rating ? `<p style="font-size:11px;color:#f59e0b;margin:0 0 5px;">⭐ ${item.rating}</p>` : ''}
            ${item.extra || ''}
            <div style="display:flex;gap:5px;margin-top:9px;">
              <a href="${item.href}" style="
                flex:1;text-align:center;background:${pinColor};color:#fff;
                text-decoration:none;padding:7px 10px;border-radius:9px;
                font-size:11px;font-weight:600;">View Details</a>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}"
                target="_blank" rel="noreferrer" style="
                text-align:center;background:#f3f4f6;color:#374151;
                text-decoration:none;padding:7px 10px;border-radius:9px;
                font-size:11px;font-weight:500;">Directions</a>
            </div>
          </div>`

        const marker = L.marker([item.lat, item.lng], { icon })
          .addTo(mapInst.current)
          .bindPopup(popupHtml, {
            maxWidth: 280,
            closeButton: true,
            className: 'medli-popup',
            autoPan: false,
          })

        marker.on('click', () => {
          if (!destroyedRef.current) onSelect?.(item)
        })

        markerRefs.current.push(marker)
      } catch {}
    })

    return () => {
      clearMarkers()
    }
  }, [validMarkers, selected, onSelect, accentColor, distances, clearMarkers, isMapSafe])

  useEffect(() => {
    if (!isMapSafe()) return

    const L = leafletRef.current
    const map = mapInst.current
    if (!L || !map) return

    try {
      stopMapMotion()

      if (selected?.lat != null && selected?.lng != null) {
        map.setView([selected.lat, selected.lng], Math.max(zoom, 15), {
          animate: false,
          reset: true,
        })

        const selectedMarker = markerRefs.current.find((_, index) => {
          return validMarkers[index]?.id === selected.id
        })

        try {
          selectedMarker?.openPopup()
        } catch {}

        return
      }

      if (validMarkers.length > 1) {
        map.fitBounds(
          L.latLngBounds(validMarkers.map((m) => [m.lat, m.lng])),
          {
            padding: [50, 50],
            maxZoom: 15,
            animate: false,
          }
        )
      } else if (validMarkers.length === 1) {
        map.setView([validMarkers[0].lat, validMarkers[0].lng], zoom, {
          animate: false,
          reset: true,
        })
      }
    } catch {}
  }, [selected, validMarkers, zoom, isMapSafe, stopMapMotion])

  if (validMarkers.length === 0) {
    return (
      <div
        className="w-full rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center gap-2"
        style={{ height }}
      >
        <span className="text-3xl">📍</span>
        <p className="text-xs text-gray-400">No locations to display</p>
      </div>
    )
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <style>{`
        @keyframes pulse-ring {
          0% { transform:translate(-50%,-50%) scale(0.8); opacity:.6; }
          70% { transform:translate(-50%,-50%) scale(2.2); opacity:0; }
          100% { transform:translate(-50%,-50%) scale(2.2); opacity:0; }
        }
        .medli-popup .leaflet-popup-content-wrapper {
          border-radius:16px!important;
          box-shadow:0 8px 32px rgba(0,0,0,.12)!important;
          border:1px solid #f1f5f9!important;
          padding:0!important;
          overflow:hidden;
        }
        .medli-popup .leaflet-popup-content { margin:12px 12px 10px!important; }
        .medli-popup .leaflet-popup-tip-container { margin-top:-1px; }
        .leaflet-control-zoom {
          border:none!important;
          box-shadow:0 2px 12px rgba(0,0,0,.1)!important;
          border-radius:10px!important;
          overflow:hidden;
        }
        .leaflet-control-zoom a { border:none!important; }
      `}</style>

      <div style={{ position: 'relative', height, width: '100%' }}>
        <div
          ref={mapRef}
          style={{ height: '100%', width: '100%' }}
          className="rounded-2xl overflow-hidden"
        />

        <button
          onClick={fetchUserLocation}
          disabled={locLoading}
          title={userLocation ? 'Refresh location' : 'Find my location'}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1000,
            width: 42,
            height: 42,
            borderRadius: 12,
            background: userLocation ? accentColor : '#fff',
            color: userLocation ? '#fff' : '#374151',
            border: `1.5px solid ${userLocation ? accentColor : '#e5e7eb'}`,
            boxShadow: '0 2px 12px rgba(0,0,0,.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: locLoading ? 'wait' : 'pointer',
            transition: 'all .2s ease',
          }}
        >
          {locLoading ? (
            <SpinIcon color={userLocation ? '#fff' : accentColor} />
          ) : (
            <LocateIcon active={!!userLocation} color={userLocation ? '#fff' : accentColor} />
          )}
        </button>

        {locError && (
          <div
            style={{
              position: 'absolute',
              top: 58,
              right: 12,
              zIndex: 1000,
              background: '#fee2e2',
              color: '#dc2626',
              fontSize: 11,
              fontWeight: 500,
              padding: '5px 10px',
              borderRadius: 8,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,.1)',
              border: '1px solid #fecaca',
            }}
          >
            ⚠️ {locError}
          </div>
        )}

        {userLocation && Object.keys(distances).length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 52,
              left: 12,
              zIndex: 1000,
              background: '#ffffffee',
              backdropFilter: 'blur(8px)',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: '5px 10px',
              fontSize: 11,
              color: '#6b7280',
              boxShadow: '0 2px 8px rgba(0,0,0,.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                background: accentColor,
                borderRadius: '50%',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            Distances from your location
          </div>
        )}
      </div>
    </>
  )
}

function LocateIcon({ active, color }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" fill={active ? color : 'none'} />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="8" strokeOpacity="0.3" />
    </svg>
  )
}

function SpinIcon({ color }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'spin .8s linear infinite' }}
    >
      <path d="M12 2a10 10 0 1 0 10 10" />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </svg>
  )
}