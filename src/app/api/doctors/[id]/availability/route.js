import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/cache'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

function isValidTime(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)
}

function normalizeAvailability(list = []) {
  return list
    .filter(Boolean)
    .map((item) => ({
      dayOfWeek: Number(item.dayOfWeek),
      startTime: item.startTime,
      endTime: item.endTime,
      slotDuration: Number(item.slotDuration || 10),
    }))
}

function normalizeExceptions(list = []) {
  return list
    .filter((item) => item?.date)
    .map((item) => ({
      date: new Date(item.date),
      available: Boolean(item.available),
      reason: item.reason || null,
    }))
}

function validateAvailability(list) {
  if (!Array.isArray(list)) {
    return 'availability must be an array'
  }

  for (const item of list) {
    if (typeof item !== 'object' || item === null) {
      return 'Each availability item must be an object'
    }

    if (
      !Number.isFinite(Number(item.dayOfWeek)) ||
      Number(item.dayOfWeek) < 0 ||
      Number(item.dayOfWeek) > 6
    ) {
      return 'dayOfWeek must be a number between 0 and 6'
    }

    if (!isValidTime(item.startTime) || !isValidTime(item.endTime)) {
      return 'startTime and endTime must be in HH:mm format'
    }

    if (item.startTime >= item.endTime) {
      return 'startTime must be earlier than endTime'
    }

    if (!Number.isFinite(Number(item.slotDuration)) || Number(item.slotDuration) <= 0) {
      return 'slotDuration must be a positive number'
    }
  }

  return null
}

function validateExceptions(list) {
  if (list == null) return null
  if (!Array.isArray(list)) return 'exceptions must be an array'

  for (const item of list) {
    if (!item?.date || Number.isNaN(new Date(item.date).getTime())) {
      return 'Each exception must have a valid date'
    }
  }

  return null
}

function validateConsultationTypes(list) {
  if (list == null) return null
  if (!Array.isArray(list)) return 'consultationTypes must be an array'

  const allowed = ['offline', 'online']
  const invalid = list.find((v) => !allowed.includes(v))
  if (invalid) return 'consultationTypes contains invalid value'

  return null
}

async function authorizeDoctorAccess(user, doctor) {
  if (user.role === 'doctor' && doctor.userId !== user.id) {
    throw new Error('Access denied')
  }

  if (user.role === 'hospital_admin') {
    const hospital = await prisma.hospital.findUnique({
      where: { id: doctor.hospitalId },
      select: { adminUserId: true },
    })

    if (!hospital || hospital.adminUserId !== user.id) {
      throw new Error('Access denied')
    }
  }
}

export async function GET(request, context) {
  try {
    const { id } = await context.params
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin', 'hospital_admin', 'doctor')

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        hospitalId: true,
        availability: true,
        exceptions: true,
        consultationTypes: true,
      },
    })

    if (!doctor) {
      return errorResponse('Doctor not found', 'NOT_FOUND', 404)
    }

    await authorizeDoctorAccess(user, doctor)

    return successResponse(
      {
        availability: doctor.availability || [],
        exceptions: doctor.exceptions || [],
        consultationTypes: doctor.consultationTypes || [],
      },
      'Availability fetched'
    )
  } catch (err) {
    console.error('[Doctor Availability][GET]', err)
    if (
      err.message?.includes('Access denied') ||
      err.message?.toLowerCase().includes('token')
    ) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to fetch availability', 'SERVER_ERROR', 500)
  }
}

export async function PUT(request, context) {
  try {
    const { id } = await context.params
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin', 'hospital_admin', 'doctor')

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        hospitalId: true,
      },
    })

    if (!doctor) {
      return errorResponse('Doctor not found', 'NOT_FOUND', 404)
    }

    await authorizeDoctorAccess(user, doctor)

    const body = await request.json()

    const availabilityError = validateAvailability(body?.availability)
    if (availabilityError) {
      return errorResponse(availabilityError, 'VALIDATION_ERROR', 400)
    }

    const exceptionsError = validateExceptions(body?.exceptions)
    if (exceptionsError) {
      return errorResponse(exceptionsError, 'VALIDATION_ERROR', 400)
    }

    const consultError = validateConsultationTypes(body?.consultationTypes)
    if (consultError) {
      return errorResponse(consultError, 'VALIDATION_ERROR', 400)
    }

       const updated = await prisma.doctor.update({
      where: { id },
      data: {
        availability: normalizeAvailability(body.availability || []),
        exceptions: normalizeExceptions(body.exceptions || []),
        consultationTypes: body.consultationTypes || [],
      },
      select: {
        id: true,
        availability: true,
        exceptions: true,
        consultationTypes: true,
        updatedAt: true,
      },
    })

    try {
      if (typeof cache?.delPattern === 'function') {
        await cache.delPattern(`slots:${id}:*`)
      } else if (typeof cache?.del === 'function') {
        await cache.del(`slots:${id}`)
      }
    } catch (cacheErr) {
      console.error('[Doctor Availability][Cache Invalidate]', cacheErr)
    }

    return successResponse(updated, 'Availability updated')

if (typeof cache?.delPattern === 'function') {
  await cache.delPattern(`slots:${id}:*`)
}
    return successResponse(updated, 'Availability updated')
  } catch (err) {
    console.error('[Doctor Availability][PUT]', err)
    if (
      err.message?.includes('Access denied') ||
      err.message?.toLowerCase().includes('token')
    ) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to update availability', 'SERVER_ERROR', 500)
  }
}