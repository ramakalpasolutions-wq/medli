import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { sanitizeInput } from '@/lib/utils/validators'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    const { id } = await params

    const test = await prisma.test.findUnique({ where: { id } })
    if (!test) {
      return errorResponse('Test not found', 'NOT_FOUND', 404)
    }

    return successResponse(test)
  } catch (err) {
    console.error('[Test GET]', err.message)
    return errorResponse('Failed to fetch test', 'SERVER_ERROR', 500)
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin', 'lab_admin')

    const test = await prisma.test.findUnique({ where: { id } })
    if (!test) {
      return errorResponse('Test not found', 'NOT_FOUND', 404)
    }

    if (user.role === 'lab_admin') {
      const lab = await prisma.lab.findUnique({ where: { id: test.labId } })
      if (!lab || lab.adminUserId !== user.id) {
        return errorResponse('Access denied', 'FORBIDDEN', 403)
      }
    }

    const body = await request.json()
    const updateData = {}

    if (body.name !== undefined) updateData.name = sanitizeInput(body.name)
    if (body.code !== undefined) updateData.code = body.code
    if (body.category !== undefined) updateData.category = body.category
    if (body.parameters !== undefined) updateData.parameters = body.parameters
    if (body.price !== undefined) updateData.price = parseFloat(body.price)
    if (body.discountedPrice !== undefined) updateData.discountedPrice = parseFloat(body.discountedPrice)
    if (body.turnaroundTime !== undefined) updateData.turnaroundTime = body.turnaroundTime
    if (body.sampleType !== undefined) updateData.sampleType = body.sampleType
    if (body.preparationInstructions !== undefined) updateData.preparationInstructions = body.preparationInstructions

    const updated = await prisma.test.update({ where: { id }, data: updateData })

    return successResponse(updated, 'Test updated')
  } catch (err) {
    console.error('[Test PUT]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to update test', 'SERVER_ERROR', 500)
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin', 'lab_admin')

    const test = await prisma.test.findUnique({ where: { id } })
    if (!test) {
      return errorResponse('Test not found', 'NOT_FOUND', 404)
    }

    if (user.role === 'lab_admin') {
      const lab = await prisma.lab.findUnique({ where: { id: test.labId } })
      if (!lab || lab.adminUserId !== user.id) {
        return errorResponse('Access denied', 'FORBIDDEN', 403)
      }
    }

    // Soft delete
    const updated = await prisma.test.update({
      where: { id },
      data: { isActive: false },
    })

    return successResponse(updated, 'Test deactivated')
  } catch (err) {
    console.error('[Test DELETE]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to delete test', 'SERVER_ERROR', 500)
  }
}