// src/lib/services/invoice.service.js

import { prisma } from '@/lib/prisma'

/**
 * Generates a unique invoice number
 *
 * Invoice:
 * INV-YYYYMMDD-XXXXX
 *
 * Credit Note:
 * CN-YYYYMMDD-XXXXX
 */
async function generateInvoiceNumber(type = 'invoice') {
  const prefix =
    type === 'credit_note'
      ? 'CN'
      : 'INV'

  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '')

  const random =
    Math.floor(
      10000 + Math.random() * 90000
    )

  const candidate =
    `${prefix}-${date}-${random}`

  const existing =
    await prisma.invoice.findUnique({
      where: {
        invoiceNumber: candidate,
      },

      select: {
        id: true,
      },
    })

  if (existing) {
    return generateInvoiceNumber(type)
  }

  return candidate
}

/**
 * Creates an invoice after successful payment.
 *
 * IMPORTANT:
 * This function is idempotent.
 *
 * Cashfree payment success may be processed from:
 *
 * 1. /api/payments/verify
 * 2. Cashfree webhook
 *
 * Therefore we check whether an invoice already exists
 * before creating another one.
 */
export async function createBookingInvoice(
  booking,
  paymentId = null
) {
  try {
    if (!booking?.id) {
      throw new Error(
        'Booking is required for invoice creation'
      )
    }

    // --------------------------------------------------
    // CHECK EXISTING INVOICE
    // --------------------------------------------------

    const existingInvoice =
      await prisma.invoice.findFirst({
        where: {
          bookingId: booking.id,
          type: 'invoice',
        },
      })

    if (existingInvoice) {
      console.log(
        '[Invoice] Existing invoice found:',
        existingInvoice.invoiceNumber,
        'for booking:',
        booking.bookingId
      )

      return existingInvoice
    }

    // --------------------------------------------------
    // GENERATE NUMBER
    // --------------------------------------------------

    const invoiceNumber =
      await generateInvoiceNumber(
        'invoice'
      )

    const items = []

    // --------------------------------------------------
    // 1. MAIN SERVICE
    // --------------------------------------------------

    if ((booking.baseFee || 0) > 0) {
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

    // --------------------------------------------------
    // 2. SERVICE CHARGES
    // Platform fee + GST
    // --------------------------------------------------

    const serviceCharges =
      (booking.platformFee || 0) +
      (booking.gst || 0)

    if (serviceCharges > 0) {
      items.push({
        description:
          'Service Charges (incl. GST)',

        quantity: 1,

        rate:
          serviceCharges,

        amount:
          serviceCharges,
      })
    }

    // --------------------------------------------------
    // 3. COUPON DISCOUNT
    // --------------------------------------------------

    if (
      (booking.couponDiscount || 0) > 0
    ) {
      items.push({
        description:
          `Coupon Discount (${booking.couponCode || ''})`,

        quantity: 1,

        rate:
          -booking.couponDiscount,

        amount:
          -booking.couponDiscount,
      })
    }

    // --------------------------------------------------
    // 4. ADMIN / PLATFORM DISCOUNT
    // --------------------------------------------------

    if (
      (booking.adminCouponDiscount || 0) >
      0
    ) {
      items.push({
        description:
          'Platform Discount',

        quantity: 1,

        rate:
          -booking.adminCouponDiscount,

        amount:
          -booking.adminCouponDiscount,
      })
    }

    // --------------------------------------------------
    // PAYMENT INFORMATION
    // --------------------------------------------------

    const cashfreePaymentId =
      paymentId ||
      booking.cashfreePaymentId ||
      null

    // --------------------------------------------------
    // CREATE INVOICE
    // --------------------------------------------------

    const invoice =
      await prisma.invoice.create({
        data: {
          invoiceNumber,

          bookingId:
            booking.id,

          userId:
            booking.userId,

          entityType:
            booking.type === 'lab'
              ? 'lab'
              : 'hospital',

          entityId:
            booking.labId ||
            booking.hospitalId ||
            null,

          items,

          baseFee:
            booking.baseFee || 0,

          couponCode:
            booking.couponCode || null,

          couponDiscount:
            booking.couponDiscount || 0,

          couponType:
            booking.couponType || null,

          discountedFee:
            booking.discountedFee || 0,

          platformFeePercent:
            booking.platformFeePercent || 0,

          platformFee:
            booking.platformFee || 0,

          gstPercent:
            booking.gstPercent || 18,

          gst:
            booking.gst || 0,

          subtotal:
            booking.subtotal || 0,

          adminCouponDiscount:
            booking.adminCouponDiscount || 0,

          totalAmount:
            booking.totalAmount || 0,

          // --------------------------------------------
          // CASHFREE PAYMENT
          // --------------------------------------------

          paymentMode:
            'Online',

          paymentMethod:
            'Cashfree',

          cashfreePaymentId,

          cashfreeOrderId:
            booking.cashfreeOrderId ||
            null,

          type:
            'invoice',
        },
      })

    console.log(
      '[Invoice] ✅ Created:',
      invoice.invoiceNumber,
      '| Booking:',
      booking.bookingId,
      '| Cashfree Payment:',
      cashfreePaymentId
    )

    return invoice
  } catch (error) {
    console.error(
      '[Invoice] ❌ Creation failed:',
      error.message
    )

    return null
  }
}

/**
 * Creates a credit note after booking
 * cancellation / refund.
 *
 * Also protected against accidental duplicate
 * credit notes for the same booking.
 */
export async function createCreditNote(
  booking,
  refundAmount,
  refundPercent
) {
  try {
    if (!booking?.id) {
      throw new Error(
        'Booking is required for credit note'
      )
    }

    if (
      !refundAmount ||
      Number(refundAmount) <= 0
    ) {
      throw new Error(
        'Invalid refund amount'
      )
    }

    // --------------------------------------------------
    // CHECK EXISTING CREDIT NOTE
    // --------------------------------------------------

    const existingCreditNote =
      await prisma.invoice.findFirst({
        where: {
          bookingId:
            booking.id,

          type:
            'credit_note',
        },
      })

    if (existingCreditNote) {
      console.log(
        '[Credit Note] Existing:',
        existingCreditNote.invoiceNumber
      )

      return existingCreditNote
    }

    // --------------------------------------------------
    // GENERATE CREDIT NOTE NUMBER
    // --------------------------------------------------

    const invoiceNumber =
      await generateInvoiceNumber(
        'credit_note'
      )

    const amount =
      Number(refundAmount)

    const percent =
      Number(refundPercent || 0)

    // --------------------------------------------------
    // ITEMS
    // --------------------------------------------------

    const items = [
      {
        description:
          `Refund for Booking ${booking.bookingId}` +
          ` (${percent}% of ₹${booking.totalAmount})`,

        quantity:
          1,

        rate:
          -amount,

        amount:
          -amount,
      },
    ]

    // --------------------------------------------------
    // CREATE CREDIT NOTE
    // --------------------------------------------------

    const creditNote =
      await prisma.invoice.create({
        data: {
          invoiceNumber,

          bookingId:
            booking.id,

          userId:
            booking.userId,

          entityType:
            booking.type === 'lab'
              ? 'lab'
              : 'hospital',

          entityId:
            booking.labId ||
            booking.hospitalId ||
            null,

          items,

          totalAmount:
            -amount,

          paymentMode:
            'Online',

          paymentMethod:
            'Cashfree',

          cashfreePaymentId:
            booking.cashfreePaymentId ||
            null,

          cashfreeOrderId:
            booking.cashfreeOrderId ||
            null,

          type:
            'credit_note',
        },
      })

    console.log(
      '[Credit Note] ✅ Created:',
      creditNote.invoiceNumber,
      '| Booking:',
      booking.bookingId
    )

    return creditNote
  } catch (error) {
    console.error(
      '[Credit Note] ❌ Creation failed:',
      error.message
    )

    return null
  }
} 