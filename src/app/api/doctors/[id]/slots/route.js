import prisma from '@/lib/prisma'
import { cache } from '@/lib/cache'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return errorResponse('date query param required (YYYY-MM-DD)', 'VALIDATION_ERROR', 400)
    }

    // Check cache
    const cacheKey = `slots:${id}:${dateStr}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return successResponse(cached, 'From cache')
    }

    const doctor = await prisma.doctor.findUnique({ where: { id } })
    if (!doctor) {
      return errorResponse('Doctor not found', 'NOT_FOUND', 404)
    }

    const targetDate = new Date(dateStr + 'T00:00:00.000Z')
    const dayOfWeek = targetDate.getDay() // 0=Sun

    // Check exceptions
    const hasException = (doctor.exceptions || []).find((ex) => {
      const exDate = new Date(ex.date)
      return exDate.toISOString().split('T')[0] === dateStr
    })

    if (hasException && !hasException.available) {
      const result = {
        doctorId: id,
        date: dateStr,
        exception: true,
        reason: hasException.reason || 'Doctor unavailable',
        hourBlocks: [],
        summary: {
          totalSlots: 0,
          bookedSlots: 0,
          availableSlots: 0,
        },
      }
      await cache.set(cacheKey, result, 30)
      return successResponse(result)
    }

    // Find availability for this day
    const dayAvailability = (doctor.availability || []).filter(
      (a) => a.dayOfWeek === dayOfWeek
    )

    if (dayAvailability.length === 0) {
      const result = {
        doctorId: id,
        date: dateStr,
        hourBlocks: [],
        summary: { totalSlots: 0, bookedSlots: 0, availableSlots: 0 },
      }
      await cache.set(cacheKey, result, 30)
      return successResponse(result)
    }

    // Generate all slots
    const allSlots = []

    for (const avail of dayAvailability) {
      const slotDuration = avail.slotDuration || 10
      const [startH, startM] = avail.startTime.split(':').map(Number)
      const [endH, endM] = avail.endTime.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM

      for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
        const slotStartH = Math.floor(m / 60)
        const slotStartM = m % 60
        const slotEndM = m + slotDuration
        const slotEndH = Math.floor(slotEndM / 60)
        const slotEndMin = slotEndM % 60

        const startTime = `${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}`
        const endTime = `${String(slotEndH).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}`

        allSlots.push({
          startTime,
          endTime,
          hour: slotStartH,
          isBooked: false,
        })
      }
    }

    // Query booked slots
    const dayStart = new Date(dateStr + 'T00:00:00.000+05:30')
    const dayEnd = new Date(dateStr + 'T23:59:59.999+05:30')

    const bookedBookings = await prisma.booking.findMany({
      where: {
        doctorId: id,
        startTime: { gte: dayStart },
        endTime: { lte: dayEnd },
        status: { in: ['confirmed', 'pending_payment'] },
      },
      select: { startTime: true, endTime: true },
    })

    // Mark booked slots
    const bookedTimes = bookedBookings.map((b) => {
      const st = new Date(b.startTime)
      return `${String(st.getHours()).padStart(2, '0')}:${String(st.getMinutes()).padStart(2, '0')}`
    })

    allSlots.forEach((slot) => {
      if (bookedTimes.includes(slot.startTime)) {
        slot.isBooked = true
      }
    })

    // Group into hour blocks (6 slots per block)
    const hourMap = {}
    allSlots.forEach((slot) => {
      if (!hourMap[slot.hour]) {
        hourMap[slot.hour] = {
          hour: slot.hour,
          hourLabel: `${String(slot.hour).padStart(2, '0')}:00`,
          slots: [],
          totalSlots: 0,
          bookedSlots: 0,
          availableSlots: 0,
          availabilityLabel: '',
          availabilityColor: '',
        }
      }
      hourMap[slot.hour].slots.push({
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: slot.isBooked,
      })
    })

    const hourBlocks = Object.values(hourMap)
      .sort((a, b) => a.hour - b.hour)
      .map((block) => {
        block.totalSlots = block.slots.length
        block.bookedSlots = block.slots.filter((s) => s.isBooked).length
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
      totalSlots: allSlots.length,
      bookedSlots: allSlots.filter((s) => s.isBooked).length,
      availableSlots: allSlots.filter((s) => !s.isBooked).length,
    }

    const result = {
      doctorId: id,
      date: dateStr,
      hourBlocks,
      summary,
    }

    await cache.set(cacheKey, result, 30)

    return successResponse(result)
  } catch (err) {
    console.error('[Doctor Slots]', err.message)
    return errorResponse('Failed to fetch slots', 'SERVER_ERROR', 500)
  }
}