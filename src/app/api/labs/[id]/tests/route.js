import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

// GET /api/labs/[id]/tests
export async function GET(request, { params }) {
  try {
    const { id: labId } = await params
    const { searchParams } = new URL(request.url)

    const idsParam = searchParams.get('ids')
    const activeOnly = searchParams.get('activeOnly') === 'true'
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const lab = await prisma.lab.findUnique({ where: { id: labId }, select: { id: true } })
    if (!lab) {
      return errorResponse('Lab not found', 'NOT_FOUND', 404)
    }

    // Build filter
    const where = { labId }

    if (activeOnly) {
      where.isActive = true
    }

    if (idsParam) {
      const idsArray = idsParam.split(',').map((s) => s.trim()).filter(Boolean)
      if (idsArray.length > 0) {
        where.id = { in: idsArray }
      }
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ]
    }

    const tests = await prisma.test.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    // Group items for display
    const grouped = {}
    tests.forEach((test) => {
      const cat = test.category || 'Uncategorized'
      if (!grouped[cat]) grouped[cat] = { category: cat, tests: [] }
      grouped[cat].tests.push(test)
    })

    return successResponse({
      tests,
      grouped: Object.values(grouped),
      totalTests: tests.length,
    })

  } catch (err) {
    console.error('[Lab Tests GET Error]', err.message)
    return errorResponse('Failed to fetch tests', 'SERVER_ERROR', 500)
  }
}

// POST /api/labs/[id]/tests -> Create completely Custom Test
export async function POST(request, { params }) {
  try {
    const { id: labId } = await params
    const body = await request.json()

    const { 
      name, 
      code, 
      category, 
      parameters, 
      price, 
      discountedPrice, 
      turnaroundTime, 
      sampleType, 
      preparationInstructions 
    } = body

    if (!name || !price) {
      return errorResponse('Name and Price are required fields', 'BAD_REQUEST', 400)
    }

    // Generate unique code if not provided
    const testCode = code ? code.toUpperCase().trim() : `CUST-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // Check for unique constraint violation manually before writing to MongoDB
    const duplicatedCode = await prisma.test.findFirst({
      where: { labId, code: testCode }
    })

    if (duplicatedCode) {
      return errorResponse('A test with this code already exists in your lab inventory.', 'CONFLICT', 409)
    }

    const newTest = await prisma.test.create({
      data: {
        labId,
        name,
        code: testCode,
        category: category || 'Custom tests',
        parameters: parameters || [],
        price: parseFloat(price),
        discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
        turnaroundTime,
        sampleType,
        preparationInstructions,
        isActive: true, // Auto-activate on creation
        isCustom: true
      }
    })

    return successResponse({
      message: 'Custom test created successfully',
      test: newTest
    }, 201)

  } catch (err) {
    console.error('[Lab Tests POST Error]', err.message)
    return errorResponse('Failed to create custom test', 'SERVER_ERROR', 500)
  }
}