import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    const { id }         = await params
    const { searchParams } = new URL(request.url)

    // ✅ Parse ids param — "?ids=id1,id2,id3"
    const idsParam = searchParams.get('ids')
    const idsArray = idsParam
      ? idsParam.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    const lab = await prisma.lab.findUnique({ where: { id }, select: { id: true } })
    if (!lab) {
      return errorResponse('Lab not found', 'NOT_FOUND', 404)
    }

    const where = { labId: id, isActive: true }

    // ✅ If ids provided, filter only those tests
    if (idsArray.length > 0) {
      where.id = { in: idsArray }
    }

    const tests = await prisma.test.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    // Group by category
    const grouped = {}
    tests.forEach((test) => {
      const cat = test.category || 'Uncategorized'
      if (!grouped[cat]) grouped[cat] = { category: cat, tests: [] }
      grouped[cat].tests.push(test)
    })

    return successResponse({
      tests,
      grouped:    Object.values(grouped),
      totalTests: tests.length,
    })

  } catch (err) {
    console.error('[Lab Tests]', err.message)
    return errorResponse('Failed to fetch tests', 'SERVER_ERROR', 500)
  }
}