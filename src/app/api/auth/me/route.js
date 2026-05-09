import { NextResponse } from 'next/server'
import { withAuth }     from '@/lib/middleware/auth.middleware'
import { prisma }       from '@/lib/prisma'

export async function GET(request) {
  return withAuth(request, async (req, decoded) => {
    try {
      const user = await prisma.user.findUnique({
        where:  { id: decoded.userId },
        select: {
          id:            true,
          name:          true,
          phone:         true,
          email:         true,
          role:          true,
          isVerified:    true,
          isBlocked:     true,
          avatar:        true,
          bankAccount:   true,
          wallet:        true,
          familyMembers: true,
          createdAt:     true,
          updatedAt:     true,
          // devices contains FCM tokens — return count only for security
        },
      })

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }

      if (user.isBlocked) {
        return NextResponse.json(
          { success: false, error: 'Account is blocked' },
          { status: 403 }
        )
      }

      return NextResponse.json({ success: true, data: user })

    } catch (error) {
      console.error('[GET /api/auth/me]', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}