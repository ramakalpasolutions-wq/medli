import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

// PATCH /api/labs/[id]/tests/[testId]
export async function PATCH(request, { params }) {
  try {
    const { id: labId, testId } = await params
    const body = await request.json()

    const existingTest = await prisma.test.findFirst({
      where: { id: testId, labId }
    })

    if (!existingTest) {
      return errorResponse('Test not found in this lab', 'NOT_FOUND', 404)
    }

    const updateData = {}

    // Allow changing status
    if (body.isActive !== undefined) {
      updateData.isActive = !!body.isActive
    }

    // Allow overriding pricing
    if (body.price !== undefined) {
      updateData.price = parseFloat(body.price)
    }

    if (body.discountedPrice !== undefined) {
      updateData.discountedPrice = body.discountedPrice ? parseFloat(body.discountedPrice) : null
    }

    // For custom tests, allow name/category edits
    if (existingTest.isCustom) {
      if (body.name) updateData.name = body.name
      if (body.category) updateData.category = body.category
      if (body.parameters) updateData.parameters = body.parameters
      if (body.sampleType) updateData.sampleType = body.sampleType
      if (body.preparationInstructions) updateData.preparationInstructions = body.preparationInstructions
      if (body.turnaroundTime) updateData.turnaroundTime = body.turnaroundTime
    }

    const updated = await prisma.test.update({
      where: { id: testId },
      data: updateData
    })

    return successResponse({
      message: 'Test updated successfully',
      test: updated
    })

  } catch (err) {
    console.error('[Lab Test Update PATCH]', err.message)
    return errorResponse('Failed to update test config', 'SERVER_ERROR', 500)
  }
}