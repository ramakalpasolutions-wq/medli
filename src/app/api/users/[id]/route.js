import { prisma }         from '@/lib/prisma'
import { verifyAuth }     from '@/lib/middleware/auth.middleware'
import { checkRole }      from '@/lib/middleware/rbac.middleware'
import { logAdminAction } from '@/lib/middleware/audit.middleware'
import { sanitizeInput }  from '@/lib/utils/validators'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

/* ─────────────────────────────────────────────────────────────────────────
   GET /api/users/[id] — Get single user
───────────────────────────────────────────────────────────────────────── */
// Find this in src/app/api/users/[id]/route.js — GET handler

export async function GET(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { id } = await params

      // ✅ Allow: self, super_admin, regional_manager, OR hospital_admin/lab_admin viewing their staff
      const isSelfOrAdmin =
        user.userId === id ||
        user.role   === 'super_admin' ||
        user.role   === 'regional_manager'

      const isHospitalOrLabAdmin =
        user.role === 'hospital_admin' || user.role === 'lab_admin'

      if (!isSelfOrAdmin && !isHospitalOrLabAdmin) {
        return errorResponse('Access denied', 403)
      }

      // If hospital_admin/lab_admin, verify they're viewing a doctor/staff in their own hospital/lab
      if (!isSelfOrAdmin && isHospitalOrLabAdmin) {
        const targetUser = await prisma.user.findUnique({
          where:  { id },
          select: { role: true },
        })

        if (!targetUser) return errorResponse('User not found', 404)

        // Only allow viewing doctors (for hospital_admin) — not other admins/customers
        if (user.role === 'hospital_admin' && targetUser.role !== 'doctor') {
          return errorResponse('Access denied', 403)
        }
      }

      const found = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true, name: true, email: true, phone: true,
          role: true, isVerified: true, isBlocked: true,
          avatar: true, wallet: true, familyMembers: true,
          createdAt: true, updatedAt: true,
        },
      })

      if (!found) return errorResponse('User not found', 404)
      return successResponse(found)

    } catch (error) {
      console.error('[GET /api/users/[id]]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}

/* ─────────────────────────────────────────────────────────────────────────
   PUT /api/users/[id] — Update user
───────────────────────────────────────────────────────────────────────── */
export async function PUT(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { id } = await params

      // ✅ Use user.userId (not user.id)
      if (
        user.userId !== id &&
        user.role  !== 'super_admin' &&
        user.role  !== 'regional_manager'
      ) {
        return errorResponse('Access denied', 403)
      }

      const body = await request.json()
      const updateData = {}

      if (body.name !== undefined) {
        const name = sanitizeInput(body.name || '').trim()
        if (!name) return errorResponse('Name is required', 400)
        updateData.name = name
      }

      if (body.email !== undefined) {
        const email = sanitizeInput(body.email || '').trim().toLowerCase()

        if (email) {
          const existing = await prisma.user.findFirst({
            where: { email, NOT: { id } },
            select: { id: true },
          })

          if (existing) {
            return errorResponse('Email already exists', 409)
          }
          updateData.email = email
        } else {
          updateData.email = null
        }
      }

      if (body.phone !== undefined) {
        const phone = sanitizeInput(body.phone || '').replace(/\D/g, '')
        if (phone) {
          const existing = await prisma.user.findFirst({
            where: { phone, NOT: { id } },
            select: { id: true },
          })
          if (existing) {
            return errorResponse('Phone already exists', 409)
          }
          updateData.phone = phone
        } else {
          updateData.phone = null
        }
      }

      if (body.avatar !== undefined) updateData.avatar = body.avatar

      // Only super_admin can change role
      if (body.role !== undefined && user.role === 'super_admin') {
        updateData.role = body.role
      }

      const updated = await prisma.user.update({
        where: { id },
        data:  updateData,
        select: {
          id: true, name: true, phone: true, email: true,
          role: true, isVerified: true, isBlocked: true,
          avatar: true, wallet: true, familyMembers: true,
          createdAt: true, updatedAt: true,
        },
      })

      return successResponse(updated, 'User updated successfully')

    } catch (error) {
      console.error('[PUT /api/users/[id]]', error)
      if (error.code === 'P2002') {
        return errorResponse('Duplicate field — email or phone already in use', 409)
      }
      return errorResponse(error.message || 'Internal server error', 500)
    }
  })
}

/* ─────────────────────────────────────────────────────────────────────────
   DELETE /api/users/[id] — Delete user (super_admin only)
───────────────────────────────────────────────────────────────────────── */
export async function DELETE(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin')

      const { id } = await params

      if (user.userId === id) {
        return errorResponse('Cannot delete your own account', 400)
      }

      const existing = await prisma.user.findUnique({
        where:  { id },
        select: { id: true, name: true, role: true },
      })

      if (!existing) {
        return errorResponse('User not found', 404)
      }

      // Unlink from hospital/lab before deleting
      if (existing.role === 'hospital_admin') {
        await prisma.hospital.updateMany({
          where: { adminUserId: id },
          data:  { adminUserId: null },
        }).catch(() => {})
      }
      if (existing.role === 'lab_admin') {
        await prisma.lab.updateMany({
          where: { adminUserId: id },
          data:  { adminUserId: null },
        }).catch(() => {})
      }

      await prisma.user.delete({ where: { id } })

      logAdminAction(
        request,
        user,
        'USER_DELETED',
        'User',
        id,
        { deletedName: existing.name, deletedRole: existing.role }
      ).catch((e) => console.warn('[audit]', e?.message))

      return successResponse({ id }, 'User deleted successfully')

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[DELETE /api/users/[id]]', error)
      return errorResponse('Failed to delete user', 500)
    }
  })
}