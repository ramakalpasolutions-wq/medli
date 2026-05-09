import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { smsQueue, emailQueue, pushQueue } from '@/lib/queues/setup'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    const body = await request.json()
    const { title, message, channels, targetRole, topic } = body

    if (!title || !message) {
      return errorResponse('title and message required', 'VALIDATION_ERROR', 400)
    }

    const jobs = []

    if (channels?.includes('push')) {
      if (topic) {
        await pushQueue.add('broadcast_topic', { topic, title, body: message })
        jobs.push({ channel: 'push', type: 'topic', topic })
      } else {
        // Get all user device tokens
        const users = await prisma.user.findMany({
          where: targetRole ? { role: targetRole } : {},
          select: { id: true, devices: true },
        })
        const tokens = users.flatMap((u) => (u.devices || []).map((d) => d.token))
        if (tokens.length > 0) {
          await pushQueue.add('broadcast_tokens', { tokens, title, body: message })
          jobs.push({ channel: 'push', type: 'tokens', count: tokens.length })
        }
      }
    }

    if (channels?.includes('email')) {
      const users = await prisma.user.findMany({
        where: {
          email: { not: null },
          ...(targetRole ? { role: targetRole } : {}),
        },
        select: { email: true },
        take: 1000,
      })

      for (const u of users) {
        await emailQueue.add('broadcast', {
          to: u.email,
          subject: title,
          html: `<p>${message}</p>`,
        })
      }
      jobs.push({ channel: 'email', count: users.length })
    }

    return successResponse({ jobs }, 'Broadcast queued')
  } catch (err) {
    console.error('[Broadcast]', err.message)
    return errorResponse('Failed to broadcast', 'SERVER_ERROR', 500)
  }
}