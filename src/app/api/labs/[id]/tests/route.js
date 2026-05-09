import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    const { id } = await params

    const lab = await prisma.lab.findUnique({ where: { id }, select: { id: true } })
    if (!lab) {
      return errorResponse('Lab not found', 'NOT_FOUND', 404)
    }

    const tests = await prisma.test.findMany({
      where: { labId: id, isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    // Group by category
    const grouped = {}
    tests.forEach((test) => {
      const cat = test.category || 'Uncategorized'
      if (!grouped[cat]) {
        grouped[cat] = { category: cat, tests: [] }
      }
      grouped[cat].tests.push(test)
    })

    return successResponse({
      tests,
      grouped: Object.values(grouped),
      totalTests: tests.length,
    })
  } catch (err) {
    console.error('[Lab Tests]', err.message)
    return errorResponse('Failed to fetch tests', 'SERVER_ERROR', 500)
  }
}