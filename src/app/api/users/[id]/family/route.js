// src/app/api/users/[id]/family/route.js

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import prisma from '@/lib/prisma'

export async function OPTIONS() { return handleOptions() }

// GET all family members
export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request)

    // Only own profile or super_admin
    if (user.id !== params.id && user.role !== 'super_admin') {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const profile = await prisma.user.findUnique({
      where:  { id: params.id },
      select: { familyMembers: true },
    })

    return successResponse(profile?.familyMembers || [])
  } catch (err) {
    return errorResponse(err.message, 'FAMILY_ERROR', 500)
  }
}

// POST add family member
export async function POST(request, { params }) {
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

    // Generate a simple ID for the family member
    const memberId = `fm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    const newMember = {
      id:          memberId,
      name:        name.trim(),
      relation:    relation    || 'other',
      age:         age         ? Number(age) : null,
      gender:      gender      || 'male',
      bloodGroup:  bloodGroup  || null,
      phone:       phone       || null,
      notes:       notes       || null,
      createdAt:   new Date().toISOString(),
    }

    // Get current family members
    const profile = await prisma.user.findUnique({
      where:  { id: params.id },
      select: { familyMembers: true },
    })

    const existing = profile?.familyMembers || []

    // Max 10 family members
    if (existing.length >= 10) {
      return errorResponse(
        'Maximum 10 family members allowed',
        'MAX_LIMIT',
        400
      )
    }

    await prisma.user.update({
      where: { id: params.id },
      data:  { familyMembers: [...existing, newMember] },
    })

    return successResponse(newMember, 'Family member added', 201)
  } catch (err) {
    return errorResponse(err.message, 'FAMILY_ERROR', 500)
  }
}