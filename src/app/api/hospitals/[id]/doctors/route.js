import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    const { id } = await params

    const hospital = await prisma.hospital.findUnique({ where: { id }, select: { id: true } })
    if (!hospital) {
      return errorResponse('Hospital not found', 'NOT_FOUND', 404)
    }

    const doctors = await prisma.doctor.findMany({
      where: { hospitalId: id, isActive: true },
      orderBy: { name: 'asc' },
    })

    return successResponse(doctors)
  } catch (err) {
    console.error('[Hospital Doctors]', err.message)
    return errorResponse('Failed to fetch doctors', 'SERVER_ERROR', 500)
  }
}