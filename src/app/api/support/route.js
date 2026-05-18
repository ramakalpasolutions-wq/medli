import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth.middleware'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  return withAuth(request, async (req, decoded) => {
    try {
      const me = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
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

      const body = await req.json()
      const subject = body?.subject?.trim()
      const category = body?.category || 'other'
      const message = body?.message?.trim()

      if (!subject) {
        return NextResponse.json(
          { success: false, error: 'Subject is required' },
          { status: 400 }
        )
      }

      if (!message) {
        return NextResponse.json(
          { success: false, error: 'Message is required' },
          { status: 400 }
        )
      }

      const allowedRoles = ['user', 'doctor', 'hospital_admin', 'lab_admin']
      if (!allowedRoles.includes(me.role)) {
        return NextResponse.json(
          { success: false, error: 'This role cannot submit support tickets' },
          { status: 403 }
        )
      }

      const ticket = await prisma.supportTicket.create({
        data: {
          userId: me.id,
          name: me.name || 'Unknown',
          email: me.email || '',
          phone: me.phone || '',
          role: me.role,
          subject,
          category,
          message,
          status: 'new',
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Support request submitted successfully',
        data: ticket,
      })
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error?.message || 'Failed to submit support request' },
        { status: 500 }
      )
    }
  })
}

export async function GET(request) {
  return withAuth(request, async (req, decoded) => {
    try {
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

      const { searchParams } = new URL(req.url)
      const status = searchParams.get('status')
      const role = searchParams.get('role')
      const search = searchParams.get('search')

      const where = {}

      if (status && status !== 'all') where.status = status
      if (role && role !== 'all') where.role = role

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { subject: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
        ]
      }

      const tickets = await prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        success: true,
        data: tickets,
      })
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error?.message || 'Failed to fetch tickets' },
        { status: 500 }
      )
    }
  })
}