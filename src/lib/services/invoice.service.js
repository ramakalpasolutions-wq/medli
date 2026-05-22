// src/lib/services/invoice.service.js

import { prisma } from '@/lib/prisma'

/**
 * Generates a unique invoice number
 * Format: INV-YYYYMMDD-XXXXX  or  CN-YYYYMMDD-XXXXX
 */
async function generateInvoiceNumber(type = 'invoice') {
  const prefix = type === 'credit_note' ? 'CN' : 'INV'
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(10000 + Math.random() * 90000)
  const candidate = `${prefix}-${date}-${random}`

  const existing = await prisma.invoice.findUnique({
    where: { invoiceNumber: candidate },
    select: { id: true },
  })

  if (existing) {
    return generateInvoiceNumber(type)
  }

  return candidate
}

/**
 * Creates an invoice after successful payment
 */
export async function createBookingInvoice(booking, paymentId = null) {
  try {
    const invoiceNumber = await generateInvoiceNumber('invoice')

    const items = []

    // ── 1. Main service line (Lab Test / Consultation) ─────────────────
    if (booking.baseFee > 0) {
      const label =
        booking.type === 'lab'
          ? 'Lab Test Fee'
          : booking.type === 'online'
          ? 'Online Consultation Fee'
          : 'Hospital Consultation Fee'

      items.push({
        description: label,
        quantity: 1,
        rate: booking.baseFee,
        amount: booking.baseFee,
      })
    }

    // ── 2. Combined Service Charges (Platform Fee + GST) ───────────────
    const serviceCharges =
      (booking.platformFee || 0) + (booking.gst || 0)

    if (serviceCharges > 0) {
      items.push({
        description: 'Service Charges (incl. GST)',
        quantity: 1,
        rate: serviceCharges,
        amount: serviceCharges,
      })
    }

    // ── 3. Coupon discount (if applied) ────────────────────────────────
    if ((booking.couponDiscount || 0) > 0) {
      items.push({
        description: `Coupon Discount (${booking.couponCode || ''})`,
        quantity: 1,
        rate: -booking.couponDiscount,
        amount: -booking.couponDiscount,
      })
    }

    // ── 4. Platform/admin coupon discount (if applied) ─────────────────
    if ((booking.adminCouponDiscount || 0) > 0) {
      items.push({
        description: 'Platform Discount',
        quantity: 1,
        rate: -booking.adminCouponDiscount,
        amount: -booking.adminCouponDiscount,
      })
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        bookingId:           booking.id,
        userId:              booking.userId,
        entityType:          booking.type === 'lab' ? 'lab' : 'hospital',
        entityId:            booking.labId || booking.hospitalId || null,
        items,
        baseFee:             booking.baseFee             || 0,
        couponCode:          booking.couponCode          || null,
        couponDiscount:      booking.couponDiscount      || 0,
        couponType:          booking.couponType          || null,
        discountedFee:       booking.discountedFee       || 0,
        platformFeePercent:  booking.platformFeePercent  || 0,
        platformFee:         booking.platformFee         || 0,
        gstPercent:          booking.gstPercent          || 18,
        gst:                 booking.gst                 || 0,
        subtotal:            booking.subtotal            || 0,
        adminCouponDiscount: booking.adminCouponDiscount || 0,
        totalAmount:         booking.totalAmount         || 0,
        paymentMode:         'Online',
        razorpayPaymentId:   paymentId || booking.razorpayPaymentId || null,
        type:                'invoice',
      },
    })

    console.log('[Invoice] ✅ Created invoice:', invoice.invoiceNumber, 'for booking:', booking.bookingId)
    return invoice
  } catch (err) {
    console.error('[Invoice] ❌ Failed to create invoice:', err.message)
    return null
  }
}

/**
 * Creates a credit note after booking cancellation + refund
 */
export async function createCreditNote(booking, refundAmount, refundPercent) {
  try {
    const invoiceNumber = await generateInvoiceNumber('credit_note')

    const items = [
      {
        description: `Refund for Booking ${booking.bookingId} (${refundPercent}% of ₹${booking.totalAmount})`,
        quantity: 1,
        rate: -refundAmount,
        amount: -refundAmount,
      },
    ]

    const creditNote = await prisma.invoice.create({
      data: {
        invoiceNumber,
        bookingId:   booking.id,
        userId:      booking.userId,
        entityType:  booking.type === 'lab' ? 'lab' : 'hospital',
        entityId:    booking.labId || booking.hospitalId || null,
        items,
        totalAmount: -refundAmount,
        type:        'credit_note',
      },
    })

    console.log('[Invoice] ✅ Created credit note:', creditNote.invoiceNumber, 'for booking:', booking.bookingId)
    return creditNote
  } catch (err) {
    console.error('[Invoice] ❌ Failed to create credit note:', err.message)
    return null
  }
}