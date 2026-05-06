// src/app/api/settlements/route.js

import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { getPaginationParams } from '@/lib/utils/helpers'
import prisma from '@/lib/prisma'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request) {
  try {
    const user = await verifyAuth(request)

    // ✅ Allow: super_admin, regional_manager, hospital_admin, lab_admin
    checkRole(
      user,
      'super_admin',
      'regional_manager',
      'hospital_admin',
      'lab_admin'
    )

    const { searchParams } = new URL(request.url)
    const { skip, take, page, limit } = getPaginationParams(
      searchParams.get('page'),
      searchParams.get('limit')
    )

    const status     = searchParams.get('status')
    const entityType = searchParams.get('entityType')
    const entityId   = searchParams.get('entityId')

    const where = {}
    if (status)     where.status     = status
    if (entityType) where.entityType = entityType
    if (entityId)   where.entityId   = entityId

    // ── Scope by role ─────────────────────────────────────────────────────

    if (user.role === 'hospital_admin') {
      // Only their hospital's settlements
      const hospital = await prisma.hospital.findFirst({
        where:  { adminUserId: user.id },
        select: { id: true },
      })
      if (hospital) {
        where.entityId   = hospital.id
        where.entityType = 'hospital'
      } else {
        // No hospital found — return empty
        return successResponse({
          settlements: [],
          pagination:  { page, limit, total: 0, pages: 0 },
        })
      }
    } else if (user.role === 'lab_admin') {
      // Only their lab's settlements
      const lab = await prisma.lab.findFirst({
        where:  { adminUserId: user.id },
        select: { id: true },
      })
      if (lab) {
        where.entityId   = lab.id
        where.entityType = 'lab'
      } else {
        return successResponse({
          settlements: [],
          pagination:  { page, limit, total: 0, pages: 0 },
        })
      }
    } else if (user.role === 'regional_manager') {
      // Get their region's hospitals and labs
      const region = await prisma.region.findFirst({
        where:  { managerId: user.id },
        select: { id: true },
      })

      if (region) {
        // Find all hospitals + labs in this region
        const [hospitals, labs] = await Promise.all([
          prisma.hospital.findMany({
            where:  { regionId: region.id },
            select: { id: true },
          }),
          prisma.lab.findMany({
            where:  { regionId: region.id },
            select: { id: true },
          }),
        ])

        const entityIds = [
          ...hospitals.map(h => h.id),
          ...labs.map(l => l.id),
        ]

        if (entityIds.length > 0) {
          where.entityId = { in: entityIds }
        } else {
          return successResponse({
            settlements: [],
            pagination:  { page, limit, total: 0, pages: 0 },
          })
        }
      }
      // If no region found, super_admin-like — show all (filtered by query params)
    }

    // ── Query ─────────────────────────────────────────────────────────────
    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.settlement.count({ where }),
    ])

    return successResponse({
      settlements,
      pagination: {
        page,
        limit,
        total,
        pages:      Math.ceil(total / limit),
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('Settlements list error:', err)
    return errorResponse(err.message, 'SETTLEMENTS_ERROR', 500)
  }
}