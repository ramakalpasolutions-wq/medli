// src/app/api/users/[id]/family/[memberId]/route.js

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import prisma from '@/lib/prisma'

export async function OPTIONS() { return handleOptions() }

// PUT update family member
export async function PUT(request, { params }) {
  try {
    const user = await verifyAuth(request)

    if (user.id !== params.id && user.role !== 'super_admin') {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const body = await request.json()
    const { name, relation, age, gender, bloodGroup, phone, notes } = body

    if (!name?.trim()) {
      return errorResponse('Name is required', 'MISSING_NAME', 400)
    }

    const profile = await prisma.user.findUnique({
      where:  { id: params.id },
      select: { familyMembers: true },
    })

    const existing = profile?.familyMembers || []
    const memberIndex = existing.findIndex((m) => m.id === params.memberId)

    if (memberIndex === -1) {
      return errorResponse('Family member not found', 'NOT_FOUND', 404)
    }

    const updated = [...existing]
    updated[memberIndex] = {
      ...updated[memberIndex],
      name:       name.trim(),
      relation:   relation   || 'other',
      age:        age        ? Number(age) : null,
      gender:     gender     || 'male',
      bloodGroup: bloodGroup || null,
      phone:      phone      || null,
      notes:      notes      || null,
      updatedAt:  new Date().toISOString(),
    }

    await prisma.user.update({
      where: { id: params.id },
      data:  { familyMembers: updated },
    })

    return successResponse(updated[memberIndex], 'Family member updated')
  } catch (err) {
    return errorResponse(err.message, 'FAMILY_ERROR', 500)
  }
}

// DELETE remove family member
export async function DELETE(request, { params }) {
  try {
    const user = await verifyAuth(request)

    if (user.id !== params.id && user.role !== 'super_admin') {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const profile = await prisma.user.findUnique({
      where:  { id: params.id },
      select: { familyMembers: true },
    })

    const existing = profile?.familyMembers || []
    const filtered  = existing.filter((m) => m.id !== params.memberId)

    if (filtered.length === existing.length) {
      return errorResponse('Family member not found', 'NOT_FOUND', 404)
    }

    await prisma.user.update({
      where: { id: params.id },
      data:  { familyMembers: filtered },
    })

    return successResponse(null, 'Family member removed')
  } catch (err) {
    return errorResponse(err.message, 'FAMILY_ERROR', 500)
  }
}