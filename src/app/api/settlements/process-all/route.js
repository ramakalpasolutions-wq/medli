import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { settlementQueue } from '@/lib/queues/setup'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    const body = await request.json()

    const hospitals = await prisma.hospital.findMany({
      where: { isActive: true, isApproved: true },
      select: { id: true, name: true },
    })
    const labs = await prisma.lab.findMany({
      where: { isActive: true, isApproved: true },
      select: { id: true, name: true },
    })

    const jobs = []

    for (const h of hospitals) {
      const count = await prisma.booking.count({
        where: { hospitalId: h.id, paymentStatus: 'paid', isSettled: false, status: { in: ['confirmed', 'completed'] } },
      })
      if (count > 0) {
        await settlementQueue.add('process_settlement', {
          entityType: 'hospital',
          entityId: h.id,
          entityName: h.name,
          initiatedBy: user.id,
          periodFrom: body.periodFrom,
          periodTo: body.periodTo,
        })
        jobs.push({ entityType: 'hospital', entityId: h.id, entityName: h.name, unsettledCount: count })
      }
    }

    for (const l of labs) {
      const count = await prisma.booking.count({
        where: { labId: l.id, paymentStatus: 'paid', isSettled: false, status: { in: ['confirmed', 'completed'] } },
      })
      if (count > 0) {
        await settlementQueue.add('process_settlement', {
          entityType: 'lab',
          entityId: l.id,
          entityName: l.name,
          initiatedBy: user.id,
          periodFrom: body.periodFrom,
          periodTo: body.periodTo,
        })
        jobs.push({ entityType: 'lab', entityId: l.id, entityName: l.name, unsettledCount: count })
      }
    }

    return successResponse({
      queued: jobs.length,
      jobs,
    }, `${jobs.length} settlement jobs queued`)
  } catch (err) {
    console.error('[Settlement Process All]', err.message)
    return errorResponse(err.message, 'SETTLEMENT_ERROR', 400)
  }
}