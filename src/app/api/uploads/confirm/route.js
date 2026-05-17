// src/app/api/uploads/confirm/route.js
import { prisma }       from '@/lib/prisma'
import { verifyAuth }   from '@/lib/middleware/auth.middleware'
import { getPublicUrl } from '@/lib/utils/cloudflare'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

const ENTITY_PURPOSES = [
  'hospital_cover',  'hospital_logo',  'hospital_gallery',
  'lab_cover',       'lab_logo',       'lab_gallery',
  'doctor_avatar',
]

/**
 * Build merged images composite for hospital/lab
 */
function mergeImages(existing, patch) {
  return {
    cover:   patch.cover   !== undefined ? patch.cover   : (existing?.cover   ?? null),
    logo:    patch.logo    !== undefined ? patch.logo    : (existing?.logo    ?? null),
    gallery: patch.gallery !== undefined ? patch.gallery : (existing?.gallery ?? []),
  }
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    const body = await request.json()
    const { key, purpose, entityId } = body

    if (!key || !purpose) {
      return errorResponse('key and purpose required', 'VALIDATION_ERROR', 400)
    }

    if (ENTITY_PURPOSES.includes(purpose) && !entityId) {
      return errorResponse(
        `entityId is required for purpose "${purpose}"`,
        'VALIDATION_ERROR',
        400,
      )
    }

    const publicUrl = getPublicUrl(key)

    switch (purpose) {

      /* ───── HOSPITAL ───── */
      case 'hospital_cover': {
        const hosp = await prisma.hospital.findUnique({
          where:  { id: entityId },
          select: { images: true },
        })
        await prisma.hospital.update({
          where: { id: entityId },
          data:  { images: mergeImages(hosp?.images, { cover: publicUrl }) },
        })
        break
      }

      case 'hospital_logo': {
        const hosp = await prisma.hospital.findUnique({
          where:  { id: entityId },
          select: { images: true },
        })
        await prisma.hospital.update({
          where: { id: entityId },
          data:  { images: mergeImages(hosp?.images, { logo: publicUrl }) },
        })
        break
      }

      case 'hospital_gallery': {
        const hosp = await prisma.hospital.findUnique({
          where:  { id: entityId },
          select: { images: true },
        })
        const gallery = [...(hosp?.images?.gallery || []), publicUrl]
        await prisma.hospital.update({
          where: { id: entityId },
          data:  { images: mergeImages(hosp?.images, { gallery }) },
        })
        break
      }

      /* ───── LAB ───── */
      case 'lab_cover': {
        const lab = await prisma.lab.findUnique({
          where:  { id: entityId },
          select: { images: true },
        })
        await prisma.lab.update({
          where: { id: entityId },
          data:  { images: mergeImages(lab?.images, { cover: publicUrl }) },
        })
        break
      }

      case 'lab_logo': {
        const lab = await prisma.lab.findUnique({
          where:  { id: entityId },
          select: { images: true },
        })
        await prisma.lab.update({
          where: { id: entityId },
          data:  { images: mergeImages(lab?.images, { logo: publicUrl }) },
        })
        break
      }

      case 'lab_gallery': {
        const lab = await prisma.lab.findUnique({
          where:  { id: entityId },
          select: { images: true },
        })
        const gallery = [...(lab?.images?.gallery || []), publicUrl]
        await prisma.lab.update({
          where: { id: entityId },
          data:  { images: mergeImages(lab?.images, { gallery }) },
        })
        break
      }

      /* ───── DOCTOR & USER (flat field) ───── */
      case 'doctor_avatar':
        await prisma.doctor.update({
          where: { id: entityId },
          data:  { avatar: publicUrl },
        })
        break

      case 'user_avatar':
        await prisma.user.update({
          where: { id: user.id },
          data:  { avatar: publicUrl },
        })
        break

      default:
        break
    }

    return successResponse({ key, publicUrl, purpose }, 'Upload confirmed')
  } catch (err) {
    console.error('[Upload Confirm]', err)
    return errorResponse(err.message || 'Failed to confirm upload', 'SERVER_ERROR', 500)
  }
}