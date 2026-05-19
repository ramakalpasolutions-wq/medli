// C:\Users\ASUS\medli2\src\app\api\auth\me\route.js
// ✅ FIXED: Even if the user has a valid token, if their linked entity
//           (hospital / lab / doctor) was disabled AFTER login, return 403.
//           This kills old sessions immediately on the next /me call.

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

      // ── ✅ Entity status check for already-logged-in sessions ────────────────
      // If a super_admin disables a hospital/lab/doctor AFTER the admin has
      // already logged in, their next /me call returns 403 and the frontend
      // should clear the session and redirect to login.

      if (user.role === 'hospital_admin') {
        const hospital = await prisma.hospital.findFirst({
          where:  { adminUserId: user.id },
          select: { isActive: true, isApproved: true, name: true },
        })
        if (!hospital || !hospital.isActive || !hospital.isApproved) {
          return NextResponse.json(
            {
              success: false,
              error:   hospital
                ? `Hospital "${hospital.name}" has been disabled or is no longer approved.`
                : 'Linked hospital not found.',
              code: 'ENTITY_DISABLED',
            },
            { status: 403 }
          )
        }
      }

      if (user.role === 'lab_admin') {
        const lab = await prisma.lab.findFirst({
          where:  { adminUserId: user.id },
          select: { isActive: true, isApproved: true, name: true },
        })
        if (!lab || !lab.isActive || !lab.isApproved) {
          return NextResponse.json(
            {
              success: false,
              error:   lab
                ? `Lab "${lab.name}" has been disabled or is no longer approved.`
                : 'Linked lab not found.',
              code: 'ENTITY_DISABLED',
            },
            { status: 403 }
          )
        }
      }

      if (user.role === 'doctor') {
        const doctor = await prisma.doctor.findFirst({
          where:  { userId: user.id },
          select: { isActive: true, isVerified: true, name: true },
        })
        if (!doctor || !doctor.isActive || !doctor.isVerified) {
          return NextResponse.json(
            {
              success: false,
              error:   doctor
                ? `Doctor profile for "${doctor.name}" has been disabled.`
                : 'Linked doctor profile not found.',
              code: 'ENTITY_DISABLED',
            },
            { status: 403 }
          )
        }
      }
      // ── End entity check ────────────────────────────────────────────────────

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