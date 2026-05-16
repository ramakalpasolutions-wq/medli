// C:\Users\ASUS\medli2\src\app\api\hospitals\route.js

import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole }  from '@/lib/middleware/rbac.middleware'
import {
  getPaginationParams,
  slugify,
  buildPaginationMeta,
} from '@/lib/utils/helpers'
import {
  sanitizeInput,
  sanitizeName,
  validateRequired,
} from '@/lib/utils/validators'
import {
  successResponse,
  errorResponse,
  handleOptions,
  paginatedResponse,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

/* ────────────────────────────────────────────────────────────
   GET — unchanged (already good)
──────────────────────────────────────────────────────────── */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search     = sanitizeInput(searchParams.get('search') || '')
    const city       = sanitizeInput(searchParams.get('city')   || '')
    const state      = sanitizeInput(searchParams.get('state')  || '')
    const isApproved = searchParams.get('isApproved')
    const isActive   = searchParams.get('isActive')
    const adminOnly  = searchParams.get('adminOnly') === 'true'

    const { page, limit, skip, take } = getPaginationParams(
      searchParams.get('page'),
      searchParams.get('limit'),
    )

    if (adminOnly) {
      return verifyAuth(request, async (req, user) => {
        const hospital = await prisma.hospital.findFirst({
          where: { adminUserId: user.userId },
        })
        return successResponse({
          hospitals:  hospital ? [hospital] : [],
          pagination: { page: 1, limit: 1, total: hospital ? 1 : 0, totalPages: 1 },
        })
      })
    }

    const where = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    const addressFilter = {}
    if (city)  addressFilter.city  = { equals: city,  mode: 'insensitive' }
    if (state) addressFilter.state = { equals: state, mode: 'insensitive' }
    if (Object.keys(addressFilter).length > 0) {
      where.address = { is: addressFilter }
    }

    if (isApproved !== null && isApproved !== '' && isApproved !== undefined) {
      where.isApproved = isApproved === 'true'
    }
    if (isActive !== null && isActive !== '' && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const hasToken =
      !!request.headers.get('authorization') ||
      !!request.cookies.get('accessToken')?.value

    if (!hasToken) {
      where.isApproved = true
      where.isActive   = true
    }

    const [hospitals, total] = await Promise.all([
      prisma.hospital.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, slug: true,
          address: true, location: true,
          departments: true, services: true,
          images: true,
          contactPhone: true, contactEmail: true,
          operatingHours: true,
          rating: true,
          isApproved: true, isActive: true,
          platformFeePercent: true,
          adminUserId: true, regionId: true,
          createdAt: true, updatedAt: true,
        },
      }),
      prisma.hospital.count({ where }),
    ])

    return paginatedResponse(
      hospitals,
      buildPaginationMeta(total, page, limit),
      'hospitals',
    )

  } catch (error) {
    console.error('[GET /api/hospitals]', error)
    return errorResponse('Internal server error', 500)
  }
}

/* ────────────────────────────────────────────────────────────
   POST — ✅ FIXED with proper defaults
──────────────────────────────────────────────────────────── */
export async function POST(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin', 'regional_manager')

      const body    = await request.json()
      const missing = validateRequired(body, ['name'])
      if (missing.length) {
        return errorResponse(`Missing required fields: ${missing.join(', ')}`, 400)
      }

      const name = sanitizeName(body.name)
      if (!name) return errorResponse('Invalid hospital name', 400)

      let slug     = slugify(name)
      const exists = await prisma.hospital.findUnique({ where: { slug } })
      if (exists)  slug = `${slug}-${Date.now()}`

      /* ✅ Smart defaults so cards never look empty */
      const departments = Array.isArray(body.departments) && body.departments.length > 0
        ? body.departments
        : ['General Medicine']

      const services = Array.isArray(body.services) && body.services.length > 0
        ? body.services
        : ['Outpatient', 'Inpatient']

      /* ✅ Default operating hours if not provided */
      const defaultHours = {
        mon: { open: '09:00', close: '18:00', isOpen: true },
        tue: { open: '09:00', close: '18:00', isOpen: true },
        wed: { open: '09:00', close: '18:00', isOpen: true },
        thu: { open: '09:00', close: '18:00', isOpen: true },
        fri: { open: '09:00', close: '18:00', isOpen: true },
        sat: { open: '09:00', close: '14:00', isOpen: true },
        sun: { open: '00:00', close: '00:00', isOpen: false },
      }

      /* ✅ Default empty images structure */
      const defaultImages = {
        cover:   null,
        logo:    null,
        gallery: [],
      }

      const hospital = await prisma.hospital.create({
        data: {
          name,
          slug,
          address:        body.address  || undefined,
          location:       body.location || undefined,
          departments,                                            // ✅ never empty
          services,                                               // ✅ never empty
          images:         body.images || defaultImages,           // ✅ schema-safe defaults
          contactPhone:   sanitizeInput(body.contactPhone || ''),
          contactEmail:   sanitizeInput(body.contactEmail || ''),
          operatingHours: body.operatingHours || defaultHours,    // ✅ default 9-6
          adminUserId:    body.adminUserId || undefined,
          regionId:       body.regionId    || undefined,
          platformFeePercent:
            Number(body.platformFeePercent) ||
            parseFloat(process.env.DEFAULT_PLATFORM_FEE_HOSPITAL || '10'),

          /* ✅ Initialize rating so cards show "New" badge instead of breaking */
          rating: { average: 0, count: 0 },

          /* ✅ Auto-approve & activate when super_admin creates
             (super_admin is a trusted creator — no need for approval) */
          isApproved: user.role === 'super_admin' ? true : false,
          isActive:   true,
        },
      })

      return successResponse(hospital, 'Hospital created successfully', 201)

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[POST /api/hospitals]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}