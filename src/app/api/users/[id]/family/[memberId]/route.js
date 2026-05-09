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

export async function PUT(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { id, memberId } = await params  // ✅ await

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

      const members = profile?.familyMembers || []
      const idx     = members.findIndex((m) => m.id === memberId)

      if (idx === -1) return errorResponse('Family member not found', 404)

      const updatedMembers    = [...members]
      updatedMembers[idx] = {
        ...updatedMembers[idx],
        name:       name.trim(),
        relation:   relation    || updatedMembers[idx].relation,
        age:        age !== undefined ? (age ? Number(age) : null) : updatedMembers[idx].age,
        gender:     gender      ?? updatedMembers[idx].gender,
        bloodGroup: bloodGroup  ?? updatedMembers[idx].bloodGroup,
        phone:      phone       ?? updatedMembers[idx].phone,
        notes:      notes       ?? updatedMembers[idx].notes,
        updatedAt:  new Date().toISOString(),
      }

      await prisma.user.update({
        where: { id },
        data:  { familyMembers: updatedMembers },
      })

      return successResponse(updatedMembers[idx], 'Family member updated')
    } catch (error) {
      console.error('[PUT /api/users/[id]/family/[memberId]]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}

export async function DELETE(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { id, memberId } = await params  // ✅ await

      // ✅ user.userId
      if (user.userId !== id && user.role !== 'super_admin') {
        return errorResponse('Access denied', 403)
      }

      const profile = await prisma.user.findUnique({
        where:  { id },
        select: { familyMembers: true },
      })

      const members  = profile?.familyMembers || []
      const filtered = members.filter((m) => m.id !== memberId)

      if (filtered.length === members.length) {
        return errorResponse('Family member not found', 404)
      }

      await prisma.user.update({
        where: { id },
        data:  { familyMembers: filtered },
      })

      return successResponse({ id: memberId }, 'Family member removed')
    } catch (error) {
      console.error('[DELETE /api/users/[id]/family/[memberId]]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}