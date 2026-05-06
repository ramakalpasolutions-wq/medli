// src/lib/services/settlement.service.js

import prisma from '../prisma.js'
import { decrypt } from '../utils/encryption.js'
import { generateSettlementNumber } from '../utils/helpers.js'
import { emailQueue } from '../queues/setup.js'

// ─── Calculate settlement preview ────────────────────────────────────────────

export async function calculateSettlement({
  entityType,
  entityId,
  periodFrom,
  periodTo
}) {
  const where = {
    isSettled:     false,
    paymentStatus: 'paid',
    status:        { in: ['confirmed', 'completed'] }
  }

  if (entityType === 'hospital') where.hospitalId = entityId
  else where.labId = entityId

  if (periodFrom || periodTo) {
    where.startTime = {}
    if (periodFrom) where.startTime.gte = new Date(periodFrom)
    if (periodTo)   where.startTime.lte = new Date(periodTo)
  }

  const bookings = await prisma.booking.findMany({ where })

  const grossAmount = bookings.reduce((s, b) => s + (b.totalAmount || 0), 0)
  const platformFee = bookings.reduce((s, b) => s + (b.platformFee || 0), 0)
  const gst         = bookings.reduce((s, b) => s + (b.gst || 0), 0)
  const couponAbsorbed = bookings.reduce(
    (s, b) => s + (b.adminCouponDiscount || 0),
    0
  )
  const refundsDeducted = bookings
    .filter(b => b.paymentStatus === 'refunded')
    .reduce((s, b) => s + (b.refundAmount || 0), 0)

  const netSettlementAmount =
    Math.round(
      (grossAmount - platformFee - gst - couponAbsorbed - refundsDeducted) *
        100
    ) / 100

  return {
    totalBookings:      bookings.length,
    grossAmount:        Math.round(grossAmount * 100) / 100,
    platformFee:        Math.round(platformFee * 100) / 100,
    gst:                Math.round(gst * 100) / 100,
    couponAbsorbed:     Math.round(couponAbsorbed * 100) / 100,
    refundsDeducted:    Math.round(refundsDeducted * 100) / 100,
    netSettlementAmount,
    bookingIds:         bookings.map(b => b.id)
  }
}

// ─── Step 1: Initiate settlement (creates record + shows bank details) ────────

export async function initiateSettlement({
  entityType,
  entityId,
  periodFrom,
  periodTo,
  initiatedBy,
  notes
}) {
  const calc = await calculateSettlement({
    entityType,
    entityId,
    periodFrom,
    periodTo
  })

  if (calc.totalBookings === 0) {
    throw new Error('No unsettled paid bookings found for this entity')
  }

  // Get entity details
  let entityName  = ''
  let bankAccount = null

  if (entityType === 'hospital') {
    const hospital = await prisma.hospital.findUnique({
      where: { id: entityId }
    })
    entityName = hospital?.name || ''

    if (hospital?.bankAccountId) {
      bankAccount = await prisma.bankAccount.findUnique({
        where: { id: hospital.bankAccountId }
      })
    }
  } else {
    const lab = await prisma.lab.findUnique({ where: { id: entityId } })
    entityName = lab?.name || ''

    if (lab?.bankAccountId) {
      bankAccount = await prisma.bankAccount.findUnique({
        where: { id: lab.bankAccountId }
      })
    }
  }

  if (!bankAccount) {
    throw new Error('No bank account found for this entity')
  }

  if (!bankAccount.isVerified) {
    throw new Error(
      'Bank account must be verified before initiating settlement'
    )
  }

  const settlementNumber = generateSettlementNumber()

  const settlement = await prisma.settlement.create({
    data: {
      settlementNumber,
      entityType,
      entityId,
      entityName,
      periodFrom:         periodFrom ? new Date(periodFrom) : null,
      periodTo:           periodTo ? new Date(periodTo) : null,
      totalBookings:      calc.totalBookings,
      grossAmount:        calc.grossAmount,
      platformFee:        calc.platformFee,
      gst:                calc.gst,
      couponAbsorbed:     calc.couponAbsorbed,
      refundsDeducted:    calc.refundsDeducted,
      netSettlementAmount:calc.netSettlementAmount,
      bankAccountId:      bankAccount.id,
      beneficiaryName:    bankAccount.accountHolderName,
      beneficiaryAccount: bankAccount.accountNumber,
      beneficiaryIFSC:    bankAccount.ifscCode,
      bankName:           bankAccount.bankName,
      // Status = processing means "awaiting admin manual transfer"
      status:             'processing',
      initiatedBy,
      notes,
      bookingIds:         calc.bookingIds
    }
  })

  // Safely decrypt account number for admin display
  let decryptedAccount = bankAccount.accountNumber || ''
  try {
    decryptedAccount = decrypt(bankAccount.accountNumber)
  } catch {
    // If decrypt fails, show as-is (may already be plain)
    decryptedAccount = bankAccount.accountNumber || ''
  }

  return {
    settlement,
    transferInstructions: {
      amount:          calc.netSettlementAmount,
      beneficiaryName: bankAccount.accountHolderName,
      accountNumber:   decryptedAccount,
      ifscCode:        bankAccount.ifscCode,
      bankName:        bankAccount.bankName,
      accountType:     bankAccount.accountType,
      upiId:           bankAccount.upiId,
      referenceNote:   settlementNumber,
      note: `Transfer ₹${calc.netSettlementAmount} to ${entityName}. Use reference: ${settlementNumber}`
    }
  }
}

// ─── Step 2: Admin confirms with UTR after manual bank transfer ───────────────

export async function confirmSettlement({
  settlementId,
  utrNumber,
  transferMode,
  confirmedBy
}) {
  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId }
  })

  if (!settlement) throw new Error('Settlement not found')

  if (settlement.status !== 'processing') {
    throw new Error(
      `Cannot confirm settlement with status: ${settlement.status}. Only "processing" settlements can be confirmed.`
    )
  }

  if (!utrNumber || !utrNumber.trim()) {
    throw new Error('UTR number is required to confirm settlement')
  }

  const updated = await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      status:        'completed',
      utrNumber:     utrNumber.trim(),
      transferMode:  transferMode || 'NEFT',
      transferredAt: new Date(),
      confirmedBy
    }
  })

  // Mark all bookings as settled
  if (settlement.bookingIds && settlement.bookingIds.length > 0) {
    await prisma.booking.updateMany({
      where: { id: { in: settlement.bookingIds } },
      data:  { isSettled: true, settlementId }
    })
  }

  // Email entity admin
  await emailQueue.add('settlement_done', {
    entityName:  settlement.entityName,
    amount:      settlement.netSettlementAmount,
    utrNumber:   utrNumber.trim(),
    entityId:    settlement.entityId,
    entityType:  settlement.entityType,
    transferMode:transferMode || 'NEFT'
  })

  return updated
}

// ─── Cancel a processing settlement ──────────────────────────────────────────

export async function cancelSettlement({ settlementId, reason, cancelledBy }) {
  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId }
  })

  if (!settlement) throw new Error('Settlement not found')

  if (settlement.status !== 'processing') {
    throw new Error('Only processing settlements can be cancelled')
  }

  return await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      status:        'failed',
      failureReason: reason || `Cancelled by admin`
    }
  })
}