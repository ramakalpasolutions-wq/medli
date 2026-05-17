import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/cache'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { verifyAuth } from '@/lib/middleware/auth.middleware'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    const { id }           = await params
    const { searchParams } = new URL(request.url)
    const dateStr          = searchParams.get('date')

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return errorResponse('date query param required (YYYY-MM-DD)', 'VALIDATION_ERROR', 400)
    }

    // ✅ Get logged-in user (null if guest)
    let currentUserId = null
    try {
      const user    = await verifyAuth(request)
      currentUserId = user?.userId || user?.id || null
    } catch (_) {}

    const isToday  = dateStr === new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const cacheKey = `slots:${id}:${dateStr}`

    if (!isToday && !currentUserId) {
      const cached = await cache.get(cacheKey)
      if (cached) return successResponse(cached, 'From cache')
    }

    const doctor = await prisma.doctor.findUnique({ where: { id } })
    if (!doctor) {
      return errorResponse('Doctor not found', 'NOT_FOUND', 404)
    }

    const targetDate = new Date(dateStr + 'T00:00:00.000Z')
    const dayOfWeek  = targetDate.getDay()

    // ✅ All exceptions on this date
    const dayExceptions = (doctor.exceptions || []).filter((ex) => {
      const exDate = new Date(ex.date)
      return exDate.toISOString().split('T')[0] === dateStr
    })

    // ✅ Full-day exception
    const fullDayException = dayExceptions.find(
      (ex) => !ex.available && !ex.startTime && !ex.endTime
    )

    if (fullDayException) {
      const result = {
        doctorId:   id,
        date:       dateStr,
        exception:  true,
        reason:     fullDayException.reason || 'Doctor unavailable',
        hourBlocks: [],
        summary:    { totalSlots: 0, bookedSlots: 0, availableSlots: 0 },
      }
      await cache.set(cacheKey, result, 30)
      return successResponse(result)
    }

    // ✅ Partial (hour-based) exceptions
    const partialExceptions = dayExceptions.filter(
      (ex) => !ex.available && ex.startTime && ex.endTime
    )

    const dayAvailability = (doctor.availability || []).filter(
      (a) => a.dayOfWeek === dayOfWeek
    )

    if (dayAvailability.length === 0) {
      const result = {
        doctorId:   id,
        date:       dateStr,
        hourBlocks: [],
        summary:    { totalSlots: 0, bookedSlots: 0, availableSlots: 0 },
      }
      await cache.set(cacheKey, result, 30)
      return successResponse(result)
    }

    // ✅ Overlap helper
    const toMin = (t) => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    }

    const isSlotBlockedByException = (slotStart, slotEnd) => {
      const s = toMin(slotStart)
      const e = toMin(slotEnd)
      return partialExceptions.some((ex) => {
        const exS = toMin(ex.startTime)
        const exE = toMin(ex.endTime)
        return s < exE && e > exS
      })
    }

    // Generate all slots
    const allSlots = []

    for (const avail of dayAvailability) {
      const slotDuration = avail.slotDuration || 10
      const [startH, startM] = avail.startTime.split(':').map(Number)
      const [endH,   endM]   = avail.endTime.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes   = endH   * 60 + endM

      for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
        const slotStartH = Math.floor(m / 60)
        const slotStartM = m % 60
        const slotEndM   = m + slotDuration
        const slotEndH   = Math.floor(slotEndM / 60)
        const slotEndMin = slotEndM % 60

        const startTime = `${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}`
        const endTime   = `${String(slotEndH).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}`

        // ✅ Skip blocked slots
        if (isSlotBlockedByException(startTime, endTime)) {
          continue
        }

        allSlots.push({
          startTime,
          endTime,
          hour:       slotStartH,
          slotStatus: 'available',
          expiresAt:  null,
          isOwner:    false,
        })
      }
    }

    // Query bookings
    const dayStart = new Date(dateStr + 'T00:00:00.000+05:30')
    const dayEnd   = new Date(dateStr + 'T23:59:59.999+05:30')

    const bookedBookings = await prisma.booking.findMany({
      where: {
        doctorId:  id,
        startTime: { gte: dayStart },
        endTime:   { lte: dayEnd },
        status:    { in: ['confirmed', 'pending_payment'] },
      },
      select: {
        startTime: true,
        endTime:   true,
        status:    true,
        createdAt: true,
        userId:    true,
      },
    })

    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000)

    const bookedMap = {}
    for (const b of bookedBookings) {
      const st  = new Date(b.startTime)
      const key = `${String(st.getHours()).padStart(2, '0')}:${String(st.getMinutes()).padStart(2, '0')}`

      if (b.status === 'pending_payment' && new Date(b.createdAt) < fifteenMinsAgo) {
        continue
      }

      bookedMap[key] = {
        slotStatus: b.status === 'pending_payment' ? 'occupied' : 'booked',
        expiresAt:  b.status === 'pending_payment'
          ? new Date(new Date(b.createdAt).getTime() + 15 * 60 * 1000).toISOString()
          : null,
        userId: b.userId,
      }
    }

    allSlots.forEach((slot) => {
      const match = bookedMap[slot.startTime]
      if (match) {
        slot.slotStatus = match.slotStatus
        slot.expiresAt  = match.expiresAt
        slot.isOwner    = !!(currentUserId && match.userId === currentUserId)
      }
    })

    // Group into hour blocks
    const hourMap = {}
    allSlots.forEach((slot) => {
      if (!hourMap[slot.hour]) {
        hourMap[slot.hour] = {
          hour:              slot.hour,
          hourLabel:         `${String(slot.hour).padStart(2, '0')}:00`,
          slots:             [],
          totalSlots:        0,
          bookedSlots:       0,
          availableSlots:    0,
          availabilityLabel: '',
          availabilityColor: '',
        }
      }
      hourMap[slot.hour].slots.push({
        startTime:  slot.startTime,
        endTime:    slot.endTime,
        slotStatus: slot.slotStatus,
        expiresAt:  slot.expiresAt,
        isOwner:    slot.isOwner,
      })
    })

    const hourBlocks = Object.values(hourMap)
      .sort((a, b) => a.hour - b.hour)
      .map((block) => {
        block.totalSlots     = block.slots.length
        block.bookedSlots    = block.slots.filter((s) => s.slotStatus !== 'available').length
        block.availableSlots = block.totalSlots - block.bookedSlots

        if (block.availableSlots >= 4) {
          block.availabilityLabel = 'Available'
          block.availabilityColor = 'green'
        } else if (block.availableSlots >= 2) {
          block.availabilityLabel = 'Filling Fast'
          block.availabilityColor = 'yellow'
        } else if (block.availableSlots === 1) {
          block.availabilityLabel = 'Almost Full'
          block.availabilityColor = 'red'
        } else {
          block.availabilityLabel = 'Full'
          block.availabilityColor = 'grey'
        }

        return block
      })

    const summary = {
      totalSlots:     allSlots.length,
      bookedSlots:    allSlots.filter((s) => s.slotStatus !== 'available').length,
      availableSlots: allSlots.filter((s) => s.slotStatus === 'available').length,
    }

    const result = { doctorId: id, date: dateStr, hourBlocks, summary }

    if (!isToday && !currentUserId) {
      await cache.set(cacheKey, result, 30)
    }

    return successResponse(result)
  } catch (err) {
    console.error('[Doctor Slots]', err.message)
    return errorResponse('Failed to fetch slots', 'SERVER_ERROR', 500)
  }
}