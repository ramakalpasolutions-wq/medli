import { prisma }         from '@/lib/prisma'
import { verifyAuth }     from '@/lib/middleware/auth.middleware'
import { checkRole }      from '@/lib/middleware/rbac.middleware'
import { hashPassword }   from '@/lib/utils/encryption'
import { logAdminAction } from '@/lib/middleware/audit.middleware'
import {
  getPaginationParams,
  buildPaginationMeta,
} from '@/lib/utils/helpers'
import {
  sanitizeInput,
  validatePhone,
  validateEmail,
} from '@/lib/utils/validators'
import {
  successResponse,
  errorResponse,
  handleOptions,
  paginatedResponse,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

/* ─── GET /api/users — List users ────────────────────────────────────── */
export async function GET(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin', 'regional_manager')

      const { searchParams } = new URL(request.url)
      const search    = sanitizeInput(searchParams.get('search') || '')
      const role      = searchParams.get('role')      || ''
      const isBlocked = searchParams.get('isBlocked')

      const { page, limit, skip, take } = getPaginationParams(
        searchParams.get('page'),
        searchParams.get('limit'),
      )

      const where = {}
      if (search) {
        where.OR = [
          { name:  { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      }
      if (role) where.role = role
      if (isBlocked !== null && isBlocked !== '' && isBlocked !== undefined) {
        where.isBlocked = isBlocked === 'true'
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where, skip, take,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, name: true, phone: true, email: true,
            role: true, isVerified: true, isBlocked: true,
            avatar: true, wallet: true, familyMembers: true,
            createdAt: true, updatedAt: true,
          },
        }),
        prisma.user.count({ where }),
      ])

      return paginatedResponse(
        users,
        buildPaginationMeta(total, page, limit),
        'users',
      )
    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[GET /api/users]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}

/* ─── POST /api/users — Create user ─────────────────────────────────── */
export async function POST(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      // ✅ Allow super_admin AND hospital_admin (for doctors)
      checkRole(user, 'super_admin', 'hospital_admin')

      const body = await request.json()
      const { name, email, phone, password, role, hospitalId, labId } = body

      // ── Role-based restrictions ─────────────────────────────────────
      if (user.role === 'hospital_admin') {
        // Hospital admins can ONLY create doctor accounts
        if (role !== 'doctor') {
          return errorResponse(
            'Hospital admins can only create doctor accounts',
            403
          )
        }
      }

      // ── Validate inputs ─────────────────────────────────────────────
      if (!name?.trim()) return errorResponse('Name is required', 400)
      if (!email && !phone) {
        return errorResponse('Email or phone is required', 400)
      }
      if (!password || password.length < 6) {
        return errorResponse('Password must be at least 6 characters', 400)
      }
      if (!role) return errorResponse('Role is required', 400)

      const ALLOWED_ROLES = [
        'user', 'doctor', 'hospital_admin', 'lab_admin',
        'regional_manager', 'super_admin',
      ]
      if (!ALLOWED_ROLES.includes(role)) {
        return errorResponse(`Invalid role: ${role}`, 400)
      }

      if (phone && !validatePhone(phone)) {
        return errorResponse('Invalid phone (10 digits, starts with 6-9)', 400)
      }
      if (email && !validateEmail(email)) {
        return errorResponse('Invalid email address', 400)
      }

      // ── Validate entity link based on role ──────────────────────────
      if (role === 'hospital_admin' && !hospitalId) {
        return errorResponse('hospitalId is required for hospital_admin', 400)
      }
      if (role === 'lab_admin' && !labId) {
        return errorResponse('labId is required for lab_admin', 400)
      }

      // ── Normalize ────────────────────────────────────────────────────
      const cleanEmail = email ? email.toLowerCase().trim() : undefined
      const cleanPhone = phone ? String(phone).trim() : undefined

      // ── Check duplicates ────────────────────────────────────────────
      const orClause = []
      if (cleanEmail) orClause.push({ email: cleanEmail })
      if (cleanPhone) orClause.push({ phone: cleanPhone })

      const existing = await prisma.user.findFirst({
        where:  { OR: orClause },
        select: { id: true, email: true, phone: true },
      })

      if (existing) {
        const field = existing.email === cleanEmail ? 'email' : 'phone'
        return errorResponse(`User with this ${field} already exists`, 409)
      }

      // ── Verify hospital/lab exists & has no admin (for admin roles) ─
      if (role === 'hospital_admin' && hospitalId) {
        const hospital = await prisma.hospital.findUnique({
          where: { id: hospitalId },
          select: { id: true, adminUserId: true, name: true },
        })
        if (!hospital) return errorResponse('Hospital not found', 404)
        if (hospital.adminUserId) {
          return errorResponse(
            `Hospital "${hospital.name}" already has an admin`,
            409
          )
        }
      }
      if (role === 'lab_admin' && labId) {
        const lab = await prisma.lab.findUnique({
          where: { id: labId },
          select: { id: true, adminUserId: true, name: true },
        })
        if (!lab) return errorResponse('Lab not found', 404)
        if (lab.adminUserId) {
          return errorResponse(
            `Lab "${lab.name}" already has an admin`,
            409
          )
        }
      }

      // ── Hash password ───────────────────────────────────────────────
      const passwordHash = await hashPassword(password)

      // ── Create user ─────────────────────────────────────────────────
      let newUser
      try {
        newUser = await prisma.user.create({
          data: {
            name: name.trim(),
            email: cleanEmail,
            phone: cleanPhone,
            passwordHash,
            role,
            isVerified: true,
            isBlocked: false,
            familyMembers: [],
          },
          select: {
            id: true, name: true, email: true, phone: true,
            role: true, isVerified: true, avatar: true, createdAt: true,
          },
        })
      } catch (prismaErr) {
        if (prismaErr?.code === 'P2002') {
          const target = (prismaErr?.meta?.target || []).join(',').toLowerCase()
          const field  = target.includes('email')
            ? 'email'
            : target.includes('phone') ? 'phone number' : 'account'
          return errorResponse(
            `User with this ${field} already exists`,
            409
          )
        }
        throw prismaErr
      }

      // ── Link to hospital/lab ────────────────────────────────────────
      try {
        if (role === 'hospital_admin' && hospitalId) {
          await prisma.hospital.update({
            where: { id: hospitalId },
            data:  { adminUserId: newUser.id },
          })
        }
        if (role === 'lab_admin' && labId) {
          await prisma.lab.update({
            where: { id: labId },
            data:  { adminUserId: newUser.id },
          })
        }
      } catch (linkErr) {
        console.error('[users] link failed:', linkErr?.message)
      }

      // ── Audit log ───────────────────────────────────────────────────
      logAdminAction(
        request, user, 'USER_CREATED', 'User', newUser.id,
        {
          createdRole: role,
          email: cleanEmail,
          hospitalId: hospitalId || null,
          labId: labId || null,
          createdBy: user.role,
        }
      ).catch((e) => console.warn('[audit]', e?.message))

      return successResponse(newUser, 'User created successfully', 201)

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[POST /api/users]', error)
      return errorResponse(error.message || 'Failed to create user', 500)
    }
  })
}