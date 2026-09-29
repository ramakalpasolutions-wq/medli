import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

// GET /api/labs/[id]/packages
export async function GET(request, { params }) {
  try {
    const { id: labId } = await params

    const packages = await prisma.testPackage.findMany({
      where: { labId },
      orderBy: { createdAt: 'desc' }
    })

    // To prevent manual UI joins, we resolve the nested Test array records for each package
    const detailedPackages = await Promise.all(
      packages.map(async (pkg) => {
        const tests = await prisma.test.findMany({
          where: {
            id: { in: pkg.testIds },
            labId
          }
        })
        return {
          ...pkg,
          tests
        }
      })
    )

    return successResponse({ packages: detailedPackages })

  } catch (err) {
    console.error('[Lab Packages GET]', err.message)
    return errorResponse('Failed to load packages', 'SERVER_ERROR', 500)
  }
}

// POST /api/labs/[id]/packages
export async function POST(request, { params }) {
  try {
    const { id: labId } = await params
    const body = await request.json()

    const { name, code, description, testIds, price, discountedPrice } = body

    if (!name || !testIds || testIds.length === 0 || !price) {
      return errorResponse('Missing required payload: name, testIds[], and price are required.', 'BAD_REQUEST', 400)
    }

    const packageCode = code ? code.toUpperCase().trim() : `PKG-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    const duplicate = await prisma.testPackage.findFirst({
      where: { labId, code: packageCode }
    })

    if (duplicate) {
      return errorResponse('A package with this code code already exists.', 'CONFLICT', 409)
    }

    const pkg = await prisma.testPackage.create({
      data: {
        labId,
        name,
        code: packageCode,
        description,
        testIds, // Injected as clean native String MongoDB ObjectId array
        price: parseFloat(price),
        discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
        isActive: true
      }
    })

    return successResponse({
      message: 'Package created successfully',
      package: pkg
    }, 201)

  } catch (err) {
    console.error('[Lab Package POST]', err.message)
    return errorResponse('Failed to create package', 'SERVER_ERROR', 500)
  }
}