import { NextResponse }                  from 'next/server'
import { withAuth }                      from '@/lib/middleware/auth.middleware'
import { prisma }                        from '@/lib/prisma'
import { comparePassword, hashPassword } from '@/lib/utils/encryption'

export async function POST(request) {
  return withAuth(request, async (req, decoded) => {
    try {
      const { currentPassword, newPassword } = await request.json()

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { success: false, error: 'Both passwords are required' },
          { status: 400 }
        )
      }
      if (newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 8 characters' },
          { status: 400 }
        )
      }

      const dbUser = await prisma.user.findUnique({
        where:  { id: decoded.userId },
        select: { id: true, passwordHash: true },  // ✅ correct field
      })

      if (!dbUser?.passwordHash) {
        return NextResponse.json(
          { success: false, error: 'No password set. Use OTP login.' },
          { status: 400 }
        )
      }

      const valid = await comparePassword(currentPassword, dbUser.passwordHash)
      if (!valid) {
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect' },
          { status: 401 }
        )
      }

      const newHash = await hashPassword(newPassword)

      // ✅ Only update passwordHash — no refreshToken field on User
      await prisma.user.update({
        where: { id: decoded.userId },
        data:  { passwordHash: newHash },
      })

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully. Please log in again.',
      })

    } catch (error) {
      console.error('[POST /api/auth/change-password]', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}