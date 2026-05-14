import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { prisma } from '@/lib/prisma'

export async function OPTIONS() {
  return handleOptions()
}

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100

async function getPrimaryBankAccount(entityType, entityId, bankAccountId) {
  if (bankAccountId) {
    const byId = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
      select: {
        id: true,
        accountHolderName: true,
        accountNumber: true,
        ifscCode: true,
        bankName: true,
        branchName: true,
        accountType: true,
        upiId: true,
        gstin: true,
        panNumber: true,
        isVerified: true,
        verificationMethod: true,
        verifiedAt: true,
      },
    })
    if (byId) return byId
  }

  return prisma.bankAccount.findFirst({
    where: {
      entityType,
      entityId,
      isPrimary: true,
      isActive: true,
    },
    select: {
      id: true,
      accountHolderName: true,
      accountNumber: true,
      ifscCode: true,
      bankName: true,
      branchName: true,
      accountType: true,
      upiId: true,
      gstin: true,
      panNumber: true,
      isVerified: true,
      verificationMethod: true,
      verifiedAt: true,
    },
  })
}

function buildHospitalFinancials(bookings) {
  const grossAmount = round2(bookings.reduce((s, b) => s + (b.totalAmount || 0), 0))
  const platformFee = round2(bookings.reduce((s, b) => s + (b.platformFee || 0), 0))
  const gst = round2(bookings.reduce((s, b) => s + (b.gst || 0), 0))
  const couponAbsorbed = round2(bookings.reduce((s, b) => s + (b.adminCouponDiscount || 0), 0))
  const refundsDeducted = round2(bookings.reduce((s, b) => s + (b.refundAmount || 0), 0))
  const netSettlementAmount = round2(
    Math.max(0, grossAmount - platformFee - gst - couponAbsorbed - refundsDeducted)
  )

  return {
    totalBookings: bookings.length,
    grossAmount,
    platformFee,
    gst,
    couponAbsorbed,
    refundsDeducted,
    netSettlementAmount,
  }
}

function buildLabFinancials(bookings) {
  const grossAmount = round2(bookings.reduce((s, b) => s + (b.baseFee || 0), 0))
  const refundsDeducted = round2(bookings.reduce((s, b) => s + (b.refundAmount || 0), 0))
  const netSettlementAmount = round2(Math.max(0, grossAmount - refundsDeducted))

  return {
    totalBookings: bookings.length,
    grossAmount,
    platformFee: 0,
    gst: 0,
    couponAbsorbed: 0,
    refundsDeducted,
    netSettlementAmount,
  }
}

export async function GET(request) {
  try {
    const user = await verifyAuth(request)
    const { searchParams } = new URL(request.url)
    const regionId = searchParams.get('regionId')

    const allowedRoles = ['super_admin', 'regional_manager', 'hospital_admin', 'lab_admin']
    if (!allowedRoles.includes(user.role)) {
      return errorResponse('Access denied', 'ACCESS_DENIED', 403)
    }

    if (user.role === 'lab_admin') {
      const lab = await prisma.lab.findFirst({
        where: { adminUserId: user.id },
        select: {
          id: true,
          name: true,
          regionId: true,
          bankAccountId: true,
        },
      })

      if (!lab) {
        return successResponse({
          total: 0,
          totalAmount: 0,
          hospitals: [],
          labs: [],
        })
      }

      const unsettledBookings = await prisma.booking.findMany({
        where: {
          labId: lab.id,
          paymentStatus: 'paid',
          isSettled: false,
          status: { in: ['confirmed', 'completed'] },
        },
        select: {
          id: true,
          bookingId: true,
          baseFee: true,
          refundAmount: true,
          totalAmount: true,
          createdAt: true,
        },
      })

      const fin = buildLabFinancials(unsettledBookings)
      const bankAccount = await getPrimaryBankAccount('lab', lab.id, lab.bankAccountId)

      return successResponse({
        total: fin.netSettlementAmount > 0 ? 1 : 0,
        totalAmount: fin.netSettlementAmount > 0 ? fin.netSettlementAmount : 0,
        hospitals: [],
        labs:
          fin.netSettlementAmount > 0
            ? [
                {
                  id: lab.id,
                  entityId: lab.id,
                  entityType: 'lab',
                  name: lab.name,
                  regionId: lab.regionId,
                  bankAccountId: lab.bankAccountId,
                  bankAccount,
                  ...fin,
                },
              ]
            : [],
      })
    }

    if (user.role === 'hospital_admin') {
      const hospital = await prisma.hospital.findFirst({
        where: { adminUserId: user.id },
        select: {
          id: true,
          name: true,
          regionId: true,
          bankAccountId: true,
        },
      })

      if (!hospital) {
        return successResponse({
          total: 0,
          totalAmount: 0,
          hospitals: [],
          labs: [],
        })
      }

      const unsettledBookings = await prisma.booking.findMany({
        where: {
          hospitalId: hospital.id,
          paymentStatus: 'paid',
          isSettled: false,
          status: { in: ['confirmed', 'completed'] },
        },
        select: {
          id: true,
          bookingId: true,
          totalAmount: true,
          platformFee: true,
          gst: true,
          adminCouponDiscount: true,
          refundAmount: true,
          createdAt: true,
        },
      })

      const fin = buildHospitalFinancials(unsettledBookings)
      const bankAccount = await getPrimaryBankAccount('hospital', hospital.id, hospital.bankAccountId)

      return successResponse({
        total: fin.netSettlementAmount > 0 ? 1 : 0,
        totalAmount: fin.netSettlementAmount > 0 ? fin.netSettlementAmount : 0,
        hospitals:
          fin.netSettlementAmount > 0
            ? [
                {
                  id: hospital.id,
                  entityId: hospital.id,
                  entityType: 'hospital',
                  name: hospital.name,
                  regionId: hospital.regionId,
                  bankAccountId: hospital.bankAccountId,
                  bankAccount,
                  ...fin,
                },
              ]
            : [],
        labs: [],
      })
    }

    const unsettledBookings = await prisma.booking.findMany({
      where: {
        isSettled: false,
        paymentStatus: 'paid',
        status: { in: ['confirmed', 'completed'] },
      },
      select: {
        id: true,
        bookingId: true,
        hospitalId: true,
        labId: true,
        baseFee: true,
        totalAmount: true,
        platformFee: true,
        gst: true,
        adminCouponDiscount: true,
        refundAmount: true,
        createdAt: true,
      },
    })

    const hospitalMap = {}
    const labMap = {}

    for (const b of unsettledBookings) {
      if (b.hospitalId) {
        if (!hospitalMap[b.hospitalId]) hospitalMap[b.hospitalId] = []
        hospitalMap[b.hospitalId].push(b)
      }
      if (b.labId) {
        if (!labMap[b.labId]) labMap[b.labId] = []
        labMap[b.labId].push(b)
      }
    }

    const hospitals = []
    for (const [hospitalId, bookings] of Object.entries(hospitalMap)) {
      const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
        select: {
          id: true,
          name: true,
          regionId: true,
          bankAccountId: true,
        },
      })

      if (!hospital) continue
      if (user.role === 'regional_manager' && regionId && hospital.regionId !== regionId) continue

      const fin = buildHospitalFinancials(bookings)
      if (fin.netSettlementAmount <= 0) continue

      const bankAccount = await getPrimaryBankAccount('hospital', hospital.id, hospital.bankAccountId)

      hospitals.push({
        id: hospital.id,
        entityId: hospital.id,
        entityType: 'hospital',
        name: hospital.name,
        regionId: hospital.regionId,
        bankAccountId: hospital.bankAccountId,
        bankAccount,
        ...fin,
      })
    }

    const labs = []
    for (const [labId, bookings] of Object.entries(labMap)) {
      const lab = await prisma.lab.findUnique({
        where: { id: labId },
        select: {
          id: true,
          name: true,
          regionId: true,
          bankAccountId: true,
        },
      })

      if (!lab) continue
      if (user.role === 'regional_manager' && regionId && lab.regionId !== regionId) continue

      const fin = buildLabFinancials(bookings)
      if (fin.netSettlementAmount <= 0) continue

      const bankAccount = await getPrimaryBankAccount('lab', lab.id, lab.bankAccountId)

      labs.push({
        id: lab.id,
        entityId: lab.id,
        entityType: 'lab',
        name: lab.name,
        regionId: lab.regionId,
        bankAccountId: lab.bankAccountId,
        bankAccount,
        ...fin,
      })
    }

    const allEntities = [...hospitals, ...labs]
    const totalAmount = round2(allEntities.reduce((s, e) => s + e.netSettlementAmount, 0))

    return successResponse({
      total: allEntities.length,
      totalAmount,
      hospitals,
      labs,
    })
  } catch (err) {
    console.error('Settlements pending error:', err)
    return errorResponse(err.message || 'Failed to fetch pending settlements', 'SETTLEMENTS_ERROR', 500)
  }
}