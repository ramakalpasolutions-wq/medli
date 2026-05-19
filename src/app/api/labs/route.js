// C:\Users\ASUS\medli2\src\app\api\labs\route.js
// ✅ FIXED: Public listing always filters inactive labs.
//           Only super_admin / regional_manager can see inactive ones.

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
   GET
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

    // ── adminOnly: lab_admin fetching their own lab ───────────────────────────
    if (adminOnly) {
      return verifyAuth(request, async (req, user) => {
        const lab = await prisma.lab.findFirst({
          where: { adminUserId: user.userId },
        })
        return successResponse({
          labs:       lab ? [lab] : [],
          pagination: { page: 1, limit: 1, total: lab ? 1 : 0, totalPages: 1 },
        })
      })
    }

    // ── Determine caller role ────────────────────────────────────────────────
    let callerRole = null
    try {
      const user = await verifyAuth(request)
      if (user) callerRole = user.role
    } catch {
      // unauthenticated — fine
    }

    const isSuperOrRegional =
      callerRole === 'super_admin' || callerRole === 'regional_manager'

    // ── Build where ──────────────────────────────────────────────────────────
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

    if (isSuperOrRegional) {
      // Admins may pass explicit filters
      if (isApproved !== null && isApproved !== '' && isApproved !== undefined) {
        where.isApproved = isApproved === 'true'
      }
      if (isActive !== null && isActive !== '' && isActive !== undefined) {
        where.isActive = isActive === 'true'
      }
    } else {
      // ✅ Everyone else always sees only active + approved labs
      where.isApproved = true
      where.isActive   = true
    }

    const [labs, total] = await Promise.all([
      prisma.lab.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, slug: true,
          address: true, location: true,
          images: true,
          certifications: true, homeCollection: true, walkInSlots: true,
          contactPhone: true, contactEmail: true,
          rating: true,
          isApproved: true, isActive: true,
          platformFeePercent: true,
          adminUserId: true, regionId: true,
          createdAt: true, updatedAt: true,
        },
      }),
      prisma.lab.count({ where }),
    ])

    return paginatedResponse(
      labs,
      buildPaginationMeta(total, page, limit),
      'labs',
    )

  } catch (error) {
    console.error('[GET /api/labs]', error)
    return errorResponse('Internal server error', 500)
  }
}

/* ────────────────────────────────────────────────────────────
   POST
──────────────────────────────────────────────────────────── */
export async function POST(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin', 'regional_manager')

      const body    = await request.json()
      const missing = validateRequired(body, ['name'])
      if (missing.length) return errorResponse(`Missing: ${missing.join(', ')}`, 400)

      const name = sanitizeName(body.name)
      if (!name) return errorResponse('Invalid lab name', 400)

      let slug     = slugify(name)
      const exists = await prisma.lab.findUnique({ where: { slug } })
      if (exists)  slug = `${slug}-${Date.now()}`

      const certifications = Array.isArray(body.certifications) && body.certifications.length > 0
        ? body.certifications : ['Diagnostic Services']

      const defaultHomeCollection = { enabled: false, areaCoverage: [], slots: [] }
      const defaultImages         = { cover: null, logo: null, gallery: [] }

      const lab = await prisma.lab.create({
        data: {
          name,
          slug,
          address:            body.address  || undefined,
          location:           body.location || undefined,
          images:             body.images   || defaultImages,
          certifications,
          homeCollection:     body.homeCollection || defaultHomeCollection,
          walkInSlots:        Array.isArray(body.walkInSlots) ? body.walkInSlots : [],
          contactPhone:       sanitizeInput(body.contactPhone || ''),
          contactEmail:       sanitizeInput(body.contactEmail || ''),
          adminUserId:        body.adminUserId || undefined,
          regionId:           body.regionId    || undefined,
          platformFeePercent:
            Number(body.platformFeePercent) ||
            parseFloat(process.env.DEFAULT_PLATFORM_FEE_LAB || '8'),
          rating:     { average: 0, count: 0 },
          isApproved: user.role === 'super_admin',
          isActive:   true,
        },
      })

      return successResponse(lab, 'Lab created successfully', 201)

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[POST /api/labs]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}