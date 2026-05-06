// src/app/api/hospitals/route.js
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { getPaginationParams, slugify } from '@/lib/utils/helpers'
import { sanitizeInput } from '@/lib/utils/validators'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const adminOnly = searchParams.get('adminOnly') === 'true'

    // ✅ adminOnly — return only the hospital for the logged-in hospital_admin
    if (adminOnly) {
      const user     = await verifyAuth(request)
      const hospital = await prisma.hospital.findFirst({
        where: { adminUserId: user.id },
      })
      return successResponse({
        hospitals:  hospital ? [hospital] : [],
        pagination: { page: 1, limit: 1, total: hospital ? 1 : 0, totalPages: hospital ? 1 : 0 },
      })
    }

    // Public listing
    const { skip, take, page, limit } = getPaginationParams(
      searchParams.get('page'),
      searchParams.get('limit')
    )

    const city       = searchParams.get('city')
    const state      = searchParams.get('state')
    const isApproved = searchParams.get('isApproved')
    const search     = searchParams.get('search')

    const where = {}

    if (city) {
      where.address = { is: { city: { equals: city, mode: 'insensitive' } } }
    }
    if (state) {
      where.address = {
        ...where.address,
        is: { ...(where.address?.is || {}), state: { equals: state, mode: 'insensitive' } },
      }
    }
    if (isApproved !== null && isApproved !== undefined && isApproved !== '') {
      where.isApproved = isApproved === 'true'
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search.toLowerCase() } },
      ]
    }

    const [hospitals, total] = await Promise.all([
      prisma.hospital.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.hospital.count({ where }),
    ])

    return successResponse({
      hospitals,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[Hospitals GET]', err.message)
    if (err.message?.includes('token') || err.message?.includes('Unauthorized'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse('Failed to fetch hospitals', 'SERVER_ERROR', 500)
  }
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    const body = await request.json()
    if (!body.name) return errorResponse('Hospital name is required', 'VALIDATION_ERROR', 400)

    const slug     = slugify(body.name)
    const existing = await prisma.hospital.findUnique({ where: { slug } })
    if (existing) return errorResponse('Hospital with this name already exists', 'DUPLICATE', 409)

    const hospital = await prisma.hospital.create({
      data: {
        name:               sanitizeInput(body.name),
        slug,
        address:            body.address            || null,
        location:           body.location           || null,
        departments:        body.departments        || [],
        services:           body.services           || [],
        images:             body.images             || null,
        contactPhone:       body.contactPhone       || null,
        contactEmail:       body.contactEmail       || null,
        operatingHours:     body.operatingHours     || null,
        adminUserId:        body.adminUserId        || null,
        regionId:           body.regionId           || null,
        platformFeePercent: body.platformFeePercent ?? parseFloat(process.env.DEFAULT_PLATFORM_FEE_HOSPITAL || '10'),
      },
    })

    return successResponse(hospital, 'Hospital created', 201)
  } catch (err) {
    console.error('[Hospitals POST]', err.message)
    if (err.message?.includes('Access denied') || err.message?.includes('token'))
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    return errorResponse('Failed to create hospital', 'SERVER_ERROR', 500)
  }
}