import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth.middleware'
import { prisma } from '@/lib/prisma'

export async function PATCH(request, { params }) {
  return withAuth(request, async (req, decoded) => {
    try {
      const { id } = await params

      const me = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          role: true,
          isBlocked: true,
        },
      })

      if (!me) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }

      if (me.isBlocked) {
        return NextResponse.json(
          { success: false, error: 'Account is blocked' },
          { status: 403 }
        )
      }

      if (me.role !== 'super_admin') {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }

      const body = await req.json()
      const status = body?.status
      const adminNotes = body?.adminNotes

      const allowedStatuses = ['new', 'in_progress', 'resolved']
      if (status && !allowedStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        )
      }

      const ticket = await prisma.supportTicket.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(typeof adminNotes === 'string' ? { adminNotes } : {}),
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Support ticket updated',
        data: ticket,
      })
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error?.message || 'Failed to update ticket' },
        { status: 500 }
      )
    }
  })
}