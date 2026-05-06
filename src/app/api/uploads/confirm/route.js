import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { getPublicUrl } from '@/lib/utils/cloudflare'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    const body = await request.json()
    const { key, purpose, entityId } = body

    if (!key || !purpose) {
      return errorResponse('key and purpose required', 'VALIDATION_ERROR', 400)
    }

    const publicUrl = getPublicUrl(key)

    // Update the entity with the uploaded file URL
    switch (purpose) {
      case 'hospital_cover':
        await prisma.hospital.update({
          where: { id: entityId },
          data: { images: { cover: publicUrl } },
        })
        break
      case 'hospital_logo':
        await prisma.hospital.update({
          where: { id: entityId },
          data: { images: { logo: publicUrl } },
        })
        break
      case 'lab_cover':
        await prisma.lab.update({ where: { id: entityId }, data: { images: { cover: publicUrl } } })
        break
      case 'lab_logo':
        await prisma.lab.update({ where: { id: entityId }, data: { images: { logo: publicUrl } } })
        break
      case 'doctor_avatar':
        await prisma.doctor.update({ where: { id: entityId }, data: { avatar: publicUrl } })
        break
      case 'user_avatar':
        await prisma.user.update({ where: { id: user.id }, data: { avatar: publicUrl } })
        break
    }

    return successResponse({ key, publicUrl, purpose }, 'Upload confirmed')
  } catch (err) {
    console.error('[Upload Confirm]', err.message)
    return errorResponse('Failed to confirm upload', 'SERVER_ERROR', 500)
  }
}