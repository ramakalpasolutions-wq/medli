// src/lib/services/payment.service.js
// ─────────────────────────────────────────────────────────────────────────────
// Payment Service
// Handles: createOrder, processCallback, verifyTransaction, refund
// ─────────────────────────────────────────────────────────────────────────────

import prisma from '@/lib/prisma'
import {
  onePayEncrypt,
  onePayDecrypt,
  onePayPost,
  verifyTransaction as onePayVerify,
  buildOnePayPayload,
  generateTxnId,
  mapStatus,
  ONE_PAY_API_BASE,
  ONE_PAY_APP_URL,
  MERCHANT_ID,
} from '@/lib/utils/onepay'

// ─────────────────────────────────────────────────────────────────────────────
// CREATE ORDER
// ─────────────────────────────────────────────────────────────────────────────
export async function createOrder({ bookingId, userId }) {
  console.log('[PaymentService][createOrder]', { bookingId, userId })

  // ── 1. Fetch booking ──────────────────────────────────────────────────────
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  })

  if (!booking) throw new Error(`Booking not found: ${bookingId}`)

  if (booking.paymentStatus === 'paid') {
    throw new Error('Booking is already paid')
  }

  // ── 2. Get user details ───────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, email: true, name: true },
  })

  if (!user) throw new Error(`User not found: ${userId}`)

  const custMobile = user.phone || '9999999999'
  const custMail   = user.email || 'customer@medli.in'

  // ── 3. Generate fresh txnId (retry on duplicate 10052) ───────────────────
  const returnURL = `${ONE_PAY_APP_URL}/api/payments/onepay-callback`
  let txnId
  let attempt = 0

  while (attempt < 3) {
    txnId = generateTxnId(bookingId)
    console.log(`[PaymentService][createOrder] Attempt ${attempt + 1} txnId:`, txnId)
    attempt++
    break // We just generate fresh each time — 10052 handled below
  }

  // ── 4. Build payload ──────────────────────────────────────────────────────
  const payload = buildOnePayPayload({
    txnId,
    amount:    booking.totalAmount,
    custMobile,
    custMail,
    returnURL,
    udf1:      bookingId,  // Used in callback to find booking
    udf2:      userId,
  })

  console.log('[PaymentService][createOrder] Payload:', JSON.stringify(payload, null, 2))

  // ── 5. Encrypt payload ────────────────────────────────────────────────────
  const reqData = onePayEncrypt(payload)

  // ── 6. Save payment record BEFORE calling gateway ─────────────────────────
  // (so we can track even if gateway call fails)
  let payment
  try {
    payment = await prisma.payment.create({
      data: {
        bookingId,
        userId,
        onePayTxnId: txnId,
        amount:      booking.totalAmount,
        currency:    'INR',
        status:      'created',
      },
    })
    console.log('[PaymentService][createOrder] Payment record created:', payment.id)
  } catch (dbErr) {
    console.error('[PaymentService][createOrder] DB error:', dbErr.message)
    throw new Error('Failed to create payment record')
  }

  // ── 7. Update booking txnId + status ──────────────────────────────────────
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      onePayTxnId:   txnId,
      paymentStatus: 'pending',
      status:        'pending_payment',
    },
  })

  // ── 8. Return data for frontend form submission ───────────────────────────
  // Frontend will POST merchantId + reqData to paymentUrl via HTML form
  return {
    paymentId:  payment.id,
    txnId,
    merchantId: MERCHANT_ID,
    reqData,                                      // Encrypted payload
    paymentUrl: `${ONE_PAY_API_BASE}/api/v1/pay`, // Form action URL
    amount:     booking.totalAmount,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCESS CALLBACK
// Called when 1Pay POSTs encrypted respData to /api/payments/onepay-callback
// ─────────────────────────────────────────────────────────────────────────────
export async function processCallback(respData) {
  console.log('[PaymentService][processCallback] Processing...')

  // ── 1. Decrypt ────────────────────────────────────────────────────────────
  let cbData
  try {
    cbData = onePayDecrypt(respData)
    console.log('[PaymentService][processCallback] Decrypted:', JSON.stringify(cbData, null, 2))
  } catch (err) {
    console.error('[PaymentService][processCallback] Decrypt failed:', err.message)
    throw new Error('Failed to decrypt callback data')
  }

  // ── 2. Extract fields ──────────────────────────────────────────────────────
  const {
    txnId,
    pgRefId,
    status:      rawStatus,
    Amount,
    udf1:        bookingId,
    udf2:        userId,
    bankRefId,
    failureMsg,
    instrumentType,
  } = cbData

  if (!txnId) throw new Error('No txnId in callback data')

  console.log('[PaymentService][processCallback]', {
    txnId, pgRefId, rawStatus, bookingId, Amount,
  })

  // ── 3. Cross-verify with 1Pay ──────────────────────────────────────────────
  let verifiedStatus = rawStatus
  try {
    const verified = await onePayVerify(txnId)
    verifiedStatus = verified.status || rawStatus
    console.log('[PaymentService][processCallback] Verified status:', verifiedStatus)
  } catch (err) {
    console.warn('[PaymentService][processCallback] Verify failed, using callback status:', err.message)
  }

  const finalStatus = mapStatus(verifiedStatus)
  console.log('[PaymentService][processCallback] Final status:', finalStatus)

  // ── 4. Update Payment record ───────────────────────────────────────────────
  const payment = await prisma.payment.findFirst({
    where: { onePayTxnId: txnId },
  })

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status:               finalStatus === 'success' ? 'success' : finalStatus === 'failure' ? 'failure' : 'pending',
        onePayPgRefId:        pgRefId        || null,
        onePayBankRefId:      bankRefId      || null,
        onePayFailureMsg:     failureMsg     || null,
        onePayInstrumentType: instrumentType || null,
        callbackData:         cbData,
      },
    })
    console.log('[PaymentService][processCallback] Payment updated:', payment.id)
  } else {
    console.warn('[PaymentService][processCallback] Payment record not found for txnId:', txnId)
  }

  // ── 5. Find booking ────────────────────────────────────────────────────────
  // Try udf1 first (bookingId stored in udf1), then fall back to txnId
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [
        { id: bookingId },
        { onePayTxnId: txnId },
      ],
    },
  })

  if (!booking) {
    console.error('[PaymentService][processCallback] Booking not found:', { bookingId, txnId })
    throw new Error(`Booking not found for txnId: ${txnId}`)
  }

  // ── 6. Update Booking ──────────────────────────────────────────────────────
  const bookingUpdate = {
    onePayPgRefId: pgRefId || null,
  }

  if (finalStatus === 'success') {
    bookingUpdate.paymentStatus = 'paid'
    bookingUpdate.status        = 'confirmed'
  } else if (finalStatus === 'failure') {
    bookingUpdate.paymentStatus = 'failed'
    bookingUpdate.status        = 'cancelled'
    bookingUpdate.cancellationReason = failureMsg || 'Payment failed'
  } else {
    // pending / timeout
    bookingUpdate.paymentStatus = 'pending'
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data:  bookingUpdate,
  })

  console.log('[PaymentService][processCallback] Booking updated:', booking.id, '→', finalStatus)

  // ── 7. Create invoice on success ───────────────────────────────────────────
  if (finalStatus === 'success') {
    await createInvoice(booking, pgRefId)
  }

  return {
    success:   finalStatus === 'success',
    reason:    finalStatus,
    txnId,
    bookingId: booking.id,
    pgRefId:   pgRefId || null,
    status:    finalStatus,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY TRANSACTION — manual verification
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyTransaction(txnId) {
  console.log('[PaymentService][verifyTransaction]', txnId)

  // ── 1. Verify with 1Pay ────────────────────────────────────────────────────
  const verifiedData = await onePayVerify(txnId)
  const finalStatus  = mapStatus(verifiedData.status)

  // ── 2. Update payment record ───────────────────────────────────────────────
  const payment = await prisma.payment.findFirst({
    where: { onePayTxnId: txnId },
  })

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status:          finalStatus,
        onePayPgRefId:   verifiedData.pgRefId   || null,
        onePayBankRefId: verifiedData.bankRefId || null,
      },
    })
  }

  // ── 3. Confirm booking if success ──────────────────────────────────────────
  if (finalStatus === 'success') {
    const booking = await prisma.booking.findFirst({
      where: { onePayTxnId: txnId },
    })

    if (booking && booking.paymentStatus !== 'paid') {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: 'paid',
          status:        'confirmed',
          onePayPgRefId: verifiedData.pgRefId || null,
        },
      })
      console.log('[PaymentService][verifyTransaction] Booking confirmed:', booking.id)

      await createInvoice(booking, verifiedData.pgRefId)
    }
  }

  return {
    txnId,
    status:  finalStatus,
    rawData: verifiedData,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIATE REFUND
// ─────────────────────────────────────────────────────────────────────────────
export async function initiateRefund({ bookingId, amount, reason, initiatedBy }) {
  console.log('[PaymentService][initiateRefund]', { bookingId, amount })

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
  if (!booking)                          throw new Error('Booking not found')
  if (booking.paymentStatus !== 'paid')  throw new Error('Booking is not paid')

  const refundAmount = amount || booking.totalAmount

  // ── Create refund record ───────────────────────────────────────────────────
  const refundNumber = `REF-${Date.now()}-${Math.random()
    .toString(36).substring(2, 6).toUpperCase()}`

  const refund = await prisma.refund.create({
    data: {
      refundNumber,
      bookingId,
      userId:        booking.userId,
      bookingAmount: booking.totalAmount,
      refundAmount,
      reason:        reason || 'Customer requested',
      status:        'pending',
      initiatedBy:   initiatedBy || booking.userId,
    },
  })

  // ── Update booking ─────────────────────────────────────────────────────────
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      paymentStatus: 'refunded',
      status:        'refunded',
      refundAmount,
    },
  })

  console.log('[PaymentService][initiateRefund] Refund created:', refund.id)

  // TODO: Call 1Pay refund API endpoint when provided by 1Pay
  // const payload = onePayEncrypt({ merchantId, txnId: booking.onePayTxnId, refundAmount })
  // const result  = await onePayPost('/api/v1/refund', { merchantId, reqData: payload })

  return refund
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE INVOICE (internal helper)
// ─────────────────────────────────────────────────────────────────────────────
async function createInvoice(booking, pgRefId) {
  try {
    // Check if invoice already exists
    const existing = await prisma.invoice.findFirst({
      where: { bookingId: booking.id },
    })
    if (existing) {
      console.log('[PaymentService][createInvoice] Invoice already exists:', existing.id)
      return existing
    }

    const invoiceNumber = `INV-${Date.now()}-${Math.random()
      .toString(36).substring(2, 6).toUpperCase()}`

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        bookingId:          booking.id,
        userId:             booking.userId,
        baseFee:            booking.baseFee,
        couponCode:         booking.couponCode,
        couponDiscount:     booking.couponDiscount,
        couponType:         booking.couponType,
        discountedFee:      booking.discountedFee,
        platformFeePercent: booking.platformFeePercent,
        platformFee:        booking.platformFee,
        gstPercent:         booking.gstPercent,
        gst:                booking.gst,
        subtotal:           booking.subtotal,
        adminCouponDiscount:booking.adminCouponDiscount,
        totalAmount:        booking.totalAmount,
        onePayPgRefId:      pgRefId || null,
        type:               'invoice',
        items: [
          {
            description: `${booking.type} booking`,
            quantity:    1,
            rate:        booking.baseFee    || 0,
            amount:      booking.totalAmount || 0,
          },
        ],
      },
    })

    console.log('[PaymentService][createInvoice] Invoice created:', invoice.id)
    return invoice
  } catch (err) {
    // Non-critical — don't throw, just log
    console.error('[PaymentService][createInvoice] Failed:', err.message)
  }
}