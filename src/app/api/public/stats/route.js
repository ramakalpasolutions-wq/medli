import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET() {
  try {
    const [hospitals, labs, doctors, patients] = await Promise.all([
      prisma.hospital.count({ where: { isApproved: true, isActive: true } }),
      prisma.lab.count({ where: { isApproved: true, isActive: true } }),
      prisma.doctor.count({ where: { isVerified: true, isActive: true } }),
      prisma.user.count({ where: { role: 'user', isBlocked: false } }),
    ])

    return successResponse({ hospitals, labs, doctors, patients })
  } catch (error) {
    console.error('[GET /api/public/stats]', error)
    return errorResponse('Unable to load public statistics', 500)
  }
}
