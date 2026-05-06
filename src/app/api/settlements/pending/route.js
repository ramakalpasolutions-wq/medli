// src/app/api/settlements/pending/route.js

import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import prisma from '@/lib/prisma'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request) {
  try {
    const user = await verifyAuth(request)
    // ✅ Allow both super_admin AND regional_manager
    checkRole(user, 'super_admin', 'regional_manager')

    const { searchParams } = new URL(request.url)
    const regionId = searchParams.get('regionId')

    // ── Step 1: Fetch all unsettled paid bookings ─────────────────────────
    // Do NOT use groupBy() — Prisma MongoDB does not support it
    // with multiple nullable fields — causes engine panic
    const unsettledBookings = await prisma.booking.findMany({
      where: {
        isSettled:     false,
        paymentStatus: 'paid',
        status:        { in: ['confirmed', 'completed'] },
      },
      select: {
        id:                  true,
        hospitalId:          true,
        labId:               true,
        totalAmount:         true,
        platformFee:         true,
        gst:                 true,
        adminCouponDiscount: true,
        refundAmount:        true,
        paymentStatus:       true,
      },
    })

    // ── Step 2: Group by entity in JS ─────────────────────────────────────
    const hospitalMap = {}
    const labMap      = {}

    for (const b of unsettledBookings) {
      if (b.hospitalId) {
        if (!hospitalMap[b.hospitalId]) {
          hospitalMap[b.hospitalId] = { bookings: [], grossAmount: 0 }
        }
        hospitalMap[b.hospitalId].bookings.push(b)
        hospitalMap[b.hospitalId].grossAmount += b.totalAmount || 0
      }
      if (b.labId) {
        if (!labMap[b.labId]) {
          labMap[b.labId] = { bookings: [], grossAmount: 0 }
        }
        labMap[b.labId].bookings.push(b)
        labMap[b.labId].grossAmount += b.totalAmount || 0
      }
    }

    // ── Helper: calculate financials ──────────────────────────────────────
    function calcFinancials(data) {
      const grossAmount = Math.round(data.grossAmount * 100) / 100
      const platformFee = Math.round(
        data.bookings.reduce((s, b) => s + (b.platformFee || 0), 0) * 100
      ) / 100
      const gst = Math.round(
        data.bookings.reduce((s, b) => s + (b.gst || 0), 0) * 100
      ) / 100
      const couponAbsorbed = Math.round(
        data.bookings.reduce((s, b) => s + (b.adminCouponDiscount || 0), 0) * 100
      ) / 100
      const refundsDeducted = Math.round(
        data.bookings
          .filter(b => b.paymentStatus === 'refunded')
          .reduce((s, b) => s + (b.refundAmount || 0), 0) * 100
      ) / 100
      const netSettlementAmount = Math.round(
        (grossAmount - platformFee - gst - couponAbsorbed - refundsDeducted) * 100
      ) / 100
      return {
        grossAmount,
        platformFee,
        gst,
        couponAbsorbed,
        refundsDeducted,
        netSettlementAmount,
        totalBookings: data.bookings.length,
      }
    }

    // ── Step 3: Build hospital results ────────────────────────────────────
    const hospitals = []

    for (const [hospitalId, data] of Object.entries(hospitalMap)) {
      try {
        const hospital = await prisma.hospital.findUnique({
          where:  { id: hospitalId },
          select: {
            id:                 true,
            name:               true,
            platformFeePercent: true,
            bankAccountId:      true,
            regionId:           true,
          },
        })

        if (!hospital) continue

        // Regional manager: only show hospitals in their region
        if (
          user.role === 'regional_manager' &&
          regionId &&
          hospital.regionId !== regionId
        ) continue

        const fin = calcFinancials(data)
        if (fin.netSettlementAmount <= 0) continue

        let bankAccount = null
        if (hospital.bankAccountId) {
          bankAccount = await prisma.bankAccount.findUnique({
            where:  { id: hospital.bankAccountId },
            select: {
              accountHolderName: true,
              bankName:          true,
              ifscCode:          true,
              accountType:       true,
              isVerified:        true,
              upiId:             true,
            },
          })
        }

        hospitals.push({
          id:         hospital.id,
          entityId:   hospital.id,
          entityType: 'hospital',
          name:       hospital.name,
          regionId:   hospital.regionId,
          bankAccount,
          ...fin,
        })
      } catch (err) {
        console.error(`Error processing hospital ${hospitalId}:`, err.message)
      }
    }

    // ── Step 4: Build lab results ─────────────────────────────────────────
    const labs = []

    for (const [labId, data] of Object.entries(labMap)) {
      try {
        const lab = await prisma.lab.findUnique({
          where:  { id: labId },
          select: {
            id:                 true,
            name:               true,
            platformFeePercent: true,
            bankAccountId:      true,
            regionId:           true,
          },
        })

        if (!lab) continue

        // Regional manager: only show labs in their region
        if (
          user.role === 'regional_manager' &&
          regionId &&
          lab.regionId !== regionId
        ) continue

        const fin = calcFinancials(data)
        if (fin.netSettlementAmount <= 0) continue

        let bankAccount = null
        if (lab.bankAccountId) {
          bankAccount = await prisma.bankAccount.findUnique({
            where:  { id: lab.bankAccountId },
            select: {
              accountHolderName: true,
              bankName:          true,
              ifscCode:          true,
              accountType:       true,
              isVerified:        true,
              upiId:             true,
            },
          })
        }

        labs.push({
          id:         lab.id,
          entityId:   lab.id,
          entityType: 'lab',
          name:       lab.name,
          regionId:   lab.regionId,
          bankAccount,
          ...fin,
        })
      } catch (err) {
        console.error(`Error processing lab ${labId}:`, err.message)
      }
    }

    // ── Step 5: Summary ───────────────────────────────────────────────────
    const allEntities = [...hospitals, ...labs]
    const totalAmount = Math.round(
      allEntities.reduce((s, e) => s + e.netSettlementAmount, 0) * 100
    ) / 100

    return successResponse({
      total:       allEntities.length,
      totalAmount,
      hospitals,
      labs,
    })
  } catch (err) {
    console.error('Settlements pending error:', err)
    return errorResponse(err.message, 'SETTLEMENTS_ERROR', 500)
  }
}