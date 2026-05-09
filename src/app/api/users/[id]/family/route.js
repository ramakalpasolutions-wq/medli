export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { id } = await params  // ✅ await

      // ✅ user.userId
      if (user.userId !== id && user.role !== 'super_admin') {
        return errorResponse('Access denied', 403)
      }

      const profile = await prisma.user.findUnique({
        where:  { id },
        select: { familyMembers: true },
      })

      return successResponse(profile?.familyMembers || [])
    } catch (error) {
      console.error('[GET /api/users/[id]/family]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}

export async function POST(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { id } = await params  // ✅ await

      // ✅ user.userId
      if (user.userId !== id && user.role !== 'super_admin') {
        return errorResponse('Access denied', 403)
      }

      const body = await request.json()
      const { name, relation, age, gender, bloodGroup, phone, notes } = body

      if (!name?.trim()) return errorResponse('Name is required', 400)

      const profile = await prisma.user.findUnique({
        where:  { id },
        select: { familyMembers: true },
      })

      const existing = profile?.familyMembers || []

      if (existing.length >= 10) {
        return errorResponse('Maximum 10 family members allowed', 400)
      }

      const newMember = {
        id:         `fm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name:       name.trim(),
        relation:   relation    || 'other',
        age:        age         ? Number(age) : null,
        gender:     gender      || null,
        bloodGroup: bloodGroup  || null,
        phone:      phone       || null,
        notes:      notes       || null,
        createdAt:  new Date().toISOString(),
        updatedAt:  new Date().toISOString(),
      }

      await prisma.user.update({
        where: { id },
        data:  { familyMembers: [...existing, newMember] },
      })

      return successResponse(newMember, 'Family member added', 201)
    } catch (error) {
      console.error('[POST /api/users/[id]/family]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}