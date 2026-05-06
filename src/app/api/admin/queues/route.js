import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import {
  getSmsQueue,
  getEmailQueue,
  getPushQueue,
  getMeetQueue,
  getSettlementQueue,
  getRefundQueue,
} from '@/lib/queues/setup'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    // Use getter functions — not the proxy objects — to get real Queue instances
    const queueMap = [
      { name: 'sms',        instance: getSmsQueue()        },
      { name: 'email',      instance: getEmailQueue()      },
      { name: 'push',       instance: getPushQueue()       },
      { name: 'meet',       instance: getMeetQueue()       },
      { name: 'settlement', instance: getSettlementQueue() },
      { name: 'refund',     instance: getRefundQueue()     },
    ]

    const stats = await Promise.all(
      queueMap.map(async ({ name, instance }) => {
        try {
          const [waiting, active, completed, failed, delayed] = await Promise.all([
            instance.getWaitingCount(),
            instance.getActiveCount(),
            instance.getCompletedCount(),
            instance.getFailedCount(),
            instance.getDelayedCount(),
          ])
          return { name, waiting, active, completed, failed, delayed }
        } catch {
          return { name, waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }
        }
      })
    )

    return successResponse(stats)
  } catch (err) {
    console.error('[Queues]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token'))
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    return errorResponse('Failed to fetch queue stats', 'SERVER_ERROR', 500)
  }
}