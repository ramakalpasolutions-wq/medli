import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request) {
  try {
    await verifyAuth(request)

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const key      = searchParams.get('key')

    // ✅ Single setting fetch — always return consistent object
    if (key) {
      const setting = await prisma.platformSetting.findUnique({ where: { key } })

      // ✅ Return empty placeholder if not found (so frontend doesn't break)
      if (!setting) {
        return successResponse({
          key,
          value:    {},
          category: category || null,
        })
      }

      return successResponse(setting)
    }

    // List by category or all
    const where = {}
    if (category) where.category = category

    const settings = await prisma.platformSetting.findMany({
      where,
      orderBy: { key: 'asc' },
    })

    return successResponse(settings)
  } catch (err) {
    console.error('[Settings GET]', err.message)
    if (err.message?.includes('token') || err.message?.includes('auth')) {
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    }
    return errorResponse('Failed to fetch settings', 'SERVER_ERROR', 500)
  }
}

export async function PUT(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    const body = await request.json()
    const { key, value, category } = body

    if (!key || value === undefined) {
      return errorResponse('key and value are required', 'VALIDATION_ERROR', 400)
    }

    const setting = await prisma.platformSetting.upsert({
      where: { key },
      update: {
        value,
        category:  category || null,
        updatedBy: user.id,
      },
      create: {
        key,
        value,
        category:  category || null,
        updatedBy: user.id,
      },
    })

    return successResponse(setting, 'Setting saved')
  } catch (err) {
    console.error('[Settings PUT]', err.message)
    if (err.message?.includes('Access denied') || err.message?.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to save setting', 'SERVER_ERROR', 500)
  }
}