import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { getPresignedUploadUrl, R2Keys } from '@/lib/utils/cloudflare'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import crypto from 'crypto'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export function OPTIONS() { return handleOptions() }

export async function GET(request) {
  try {
    const user = await verifyAuth(request)
    const { searchParams } = new URL(request.url)

    const fileType = searchParams.get('fileType')
    const purpose = searchParams.get('purpose')
    const entityId = searchParams.get('entityId')

    if (!fileType || !purpose) {
      return errorResponse('fileType and purpose required', 'VALIDATION_ERROR', 400)
    }

    if (!ALLOWED_TYPES.includes(fileType)) {
      return errorResponse('File type not allowed', 'VALIDATION_ERROR', 400)
    }

    const filename = `${crypto.randomUUID()}`
    let key = ''

    switch (purpose) {
      case 'hospital_cover': key = R2Keys.hospitalCover(entityId || user.id); break
      case 'hospital_logo': key = R2Keys.hospitalLogo(entityId || user.id); break
      case 'hospital_gallery': key = R2Keys.hospitalGallery(entityId || user.id, filename); break
      case 'lab_cover': key = R2Keys.labCover(entityId || user.id); break
      case 'lab_logo': key = R2Keys.labLogo(entityId || user.id); break
      case 'doctor_avatar': key = R2Keys.doctorAvatar(entityId || user.id); break
      case 'user_avatar': key = R2Keys.userAvatar(user.id); break
      default: key = `uploads/${user.id}/${filename}`
    }

    const result = await getPresignedUploadUrl({ key, contentType: fileType, expiresIn: 300 })

    return successResponse(result, 'Presigned URL generated')
  } catch (err) {
    console.error('[Presigned URL]', err.message)
    if (err.message.includes('token') || err.message.includes('auth'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse('Failed to generate presigned URL', 'SERVER_ERROR', 500)
  }
}