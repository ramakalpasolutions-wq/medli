// src/lib/services/payment.service.js

import prisma from '@/lib/prisma'
import {
  onePayEncrypt,
  onePayDecrypt,
  onePayPost,
  onePayGet,
  ONE_PAY_API_BASE,
  TXN_STATUS,
  REFUND_CODES,
} from '@/lib/utils/onepay'
import { meetQueue, emailQueue, smsQueue } from '@/lib/queues/setup'
import { generateInvoiceNumber } from '@/lib/utils/helpers'

// ── Clean app URL once ────────────────────────────────────────────────────────
function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '')
}

// ── Slot cache invalidation ───────────────────────────────────────────────────
export async function invalidateSlotCache(doctorId, startTime) {
  if (!doctorId || !startTime) return
  try {
    const { cache } = await import('@/lib/cache')
    const date = new Date(startTime).toISOString().split('T')[0]
    await cache.del(`slots:${doctorId}:${date}`)
  } catch (err) {
    console.error('[Cache] Invalidation error:', err.message)
  }
}

// ── STEP 1: Create Payment Order ──────────────────────────────────────────────
export async function createOrder({ bookingId, userId }) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  })

  if (!booking)                  throw new Error('Booking not found')
  if (booking.userId !== userId) throw new Error('Unauthorised booking access')

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { name: true, email: true, phone: true },
  })

  if (!user) throw new Error('User not found')

  // txnId: alphanumeric only, max 32 chars
  const shortId = booking.bookingId.replace(/\D/g, '').slice(-12)
  const txnId   = `MEDLI${shortId}`

  // dateTime: no IST shift
  const dateTime = new Date()
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ')

  // Phone: exactly 10 digits
  const rawPhone   = (user.phone || '').replace(/\D/g, '')
  const custMobile = rawPhone.length >= 10 ? rawPhone.slice(-10) : '9999999999'

  // Email
  const custMail = (user.email && user.email.includes('@'))
    ? user.email.trim().toLowerCase()
    : 'customer@medli.in'

  // Amount: 2 decimal places
  const Amount = Number(booking.totalAmount).toFixed(2)

  // ── Return URL — NO double slash ──────────────────────────────────────────
  const appUrl    = getAppUrl()
  const returnURL = `${appUrl}/api/payments/onepay-callback`

  // ── Request payload ───────────────────────────────────────────────────────
  const requestPayload = {
    merchantId:        process.env.ONE_PAY_MERCHANT_ID,
    apiKey:            process.env.ONE_PAY_API_KEY,
    txnId,
    Amount,
    dateTime,
    custMobile,
    custMail,
    channelId:         0,
    txnType:           'DIRECT',
    returnURL,
    productId:         'DEFAULT',
    isMultiSettlement: 0,
    udf1:              'NA',
    udf2:              'NA',
  }

  console.log('[1Pay] === CREATE ORDER ===')
  console.log('[1Pay] txnId:', txnId)
  console.log('[1Pay] Amount:', Amount)
  console.log('[1Pay] returnURL:', returnURL)
  console.log('[1Pay] Payload:', JSON.stringify(requestPayload, null, 2))

  // Encrypt with AES-256-CBC (HEX key + HEX IV — confirmed)
  const reqData = onePayEncrypt(requestPayload)

  console.log('[1Pay] reqData length:', reqData.length)
  console.log('[1Pay] paymentUrl:', `${ONE_PAY_API_BASE}/payment/payprocessorV2`)

  // Save payment record
  await prisma.payment.create({
    data: {
      bookingId,
      userId,
      onePayTxnId: txnId,
      amount:      booking.totalAmount,
      status:      'created',
    },
  })

  // Update booking
  await prisma.booking.update({
    where: { id: bookingId },
    data:  { status: 'pending_payment', onePayTxnId: txnId },
  })

  return {
    txnId,
    merchantId: process.env.ONE_PAY_MERCHANT_ID,
    reqData,
    paymentUrl: `${ONE_PAY_API_BASE}/payment/payprocessorV2`,
  }
}

// ── STEP 2: Verify Transaction ────────────────────────────────────────────────
export async function verifyTransaction(txnId) {
  console.log('[1Pay] === VERIFY TRANSACTION ===')
  console.log('[1Pay] txnId:', txnId)

  try {
    const response = await onePayGet('/payment/getTxnDetails', {
      merchantId: process.env.ONE_PAY_MERCHANT_ID,
      txnId,
    })

    console.log('[1Pay Verify] Raw response:', JSON.stringify(response))

    if (response.respData) {
      return onePayDecrypt(response.respData)
    }

    if (response.trans_status || response.txn_id) {
      return response
    }

    throw new Error('Unexpected verify response format')
  } catch (err) {
    console.error('[1Pay Verify] Error:', err.message)
    throw err
  }
}

// ── STEP 3: Process Callback ──────────────────────────────────────────────────
export async function processCallback(respData) {
  console.log('[1Pay] === PROCESS CALLBACK ===')

  let callbackResponse
  try {
    callbackResponse = onePayDecrypt(respData)
    console.log('[1Pay] Callback decrypted:', JSON.stringify(callbackResponse))
  } catch (err) {
    throw new Error(`Failed to decrypt 1Pay callback: ${err.message}`)
  }

  const txnId = callbackResponse.txn_id || callbackResponse.txnId
  if (!txnId) throw new Error('Missing txn_id in callback')

  const payment = await prisma.payment.findFirst({
    where: { onePayTxnId: txnId },
  })

  if (!payment) throw new Error(`Payment not found for txnId: ${txnId}`)

  // Idempotency
  if (payment.status === 'success') {
    return { success: true, bookingId: payment.bookingId }
  }

  // MANDATORY verify
  let verified = callbackResponse
  try {
    verified = await verifyTransaction(txnId)
    console.log('[1Pay] Verified status:', verified.trans_status)
  } catch (err) {
    console.error('[1Pay] Verify failed:', err.message)
  }

  const transStatus = verified.trans_status || verified.transStatus

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (transStatus === TXN_STATUS.SUCCESS) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status:               'success',
        onePayPgRefId:        verified.pg_ref_id   || null,
        onePayInstrumentType: verified.payment_mode || null,
        onePayBankRefId:      verified.bank_ref_id  || null,
        callbackData:         verified,
      },
    })

    const booking = await prisma.booking.update({
      where: { onePayTxnId: txnId },
      data: {
        status:        'confirmed',
        paymentStatus: 'paid',
        onePayPgRefId: verified.pg_ref_id || null,
      },
    })

    const invoiceNumber = generateInvoiceNumber()
    await prisma.invoice.create({
      data: {
        invoiceNumber,
        bookingId:           booking.id,
        userId:              booking.userId,
        entityType:          booking.type === 'lab' ? 'lab' : 'hospital',
        entityId:            booking.labId || booking.hospitalId,
        baseFee:             booking.baseFee,
        couponCode:          booking.couponCode,
        couponDiscount:      booking.couponDiscount,
        couponType:          booking.couponType,
        discountedFee:       booking.discountedFee,
        platformFeePercent:  booking.platformFeePercent,
        platformFee:         booking.platformFee,
        gstPercent:          booking.gstPercent,
        gst:                 booking.gst,
        subtotal:            booking.subtotal,
        adminCouponDiscount: booking.adminCouponDiscount,
        totalAmount:         booking.totalAmount,
        gstDetails: {
          medliGstin: process.env.MEDLI_GSTIN || '',
          hsnCode:    '9993',
          gstRate:    18,
        },
        paymentMethod: '1Pay Payment Gateway',
        paymentMode:   verified.payment_mode || '',
        onePayPgRefId: verified.pg_ref_id    || null,
        type:          'invoice',
      },
    })

    await invalidateSlotCache(booking.doctorId, booking.startTime)

    if (booking.type === 'online') {
      await meetQueue.add('create_meet', { bookingId: booking.id })
    }
    await emailQueue.add('booking_confirmed', { bookingId: booking.id })
    await smsQueue.add('booking_confirmed',   { bookingId: booking.id })

    return { success: true, bookingId: booking.id }
  }

  // ── TIMEOUT ───────────────────────────────────────────────────────────────
  if (transStatus === TXN_STATUS.TIMEOUT) {
    await prisma.payment.update({
      where: { id: payment.id },
      data:  { status: 'timeout', callbackData: verified },
    })
    return { success: false, bookingId: payment.bookingId, reason: 'timeout' }
  }

  // ── PENDING ───────────────────────────────────────────────────────────────
  if (transStatus === TXN_STATUS.PENDING) {
    await prisma.payment.update({
      where: { id: payment.id },
      data:  { status: 'pending', callbackData: verified },
    })
    return { success: false, bookingId: payment.bookingId, reason: 'pending' }
  }

  // ── FAILED ────────────────────────────────────────────────────────────────
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status:           'failure',
      onePayFailureMsg: verified.resp_message || '',
      callbackData:     verified,
    },
  })

  await prisma.booking.updateMany({
    where: { onePayTxnId: txnId },
    data:  { status: 'created', paymentStatus: 'failed' },
  })

  return { success: false, bookingId: payment.bookingId, reason: 'failed' }
}

// ── Refund ────────────────────────────────────────────────────────────────────
export async function process1PayRefund({ bookingId, refundAmount }) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  })

  if (!booking)              throw new Error('Booking not found')
  if (!booking.onePayTxnId) throw new Error('No 1Pay transaction for this booking')

  const refundRequestId = `REF${Date.now()}`

  const reqData  = onePayEncrypt({
    txnId:           booking.onePayTxnId,
    refundAmount:    Number(refundAmount).toFixed(2),
    refundRequestId,
    addedBy:         'merchant',
  })

  const response = await onePayPost('/payment/refundRequest', {
    merchantId: process.env.ONE_PAY_MERCHANT_ID,
    reqData,
  })

  if (!response.respData) throw new Error('Invalid refund response')

  const result       = onePayDecrypt(response.respData)
  const refundStatus = result.refund_status || result.refundStatus

  return {
    success:            refundStatus === 'RF000',
    refundRequestId,
    onePayRefundStatus: refundStatus,
    message:            REFUND_CODES[refundStatus] || `Unknown: ${refundStatus}`,
    refundType:         result.refund_type || null,
  }
}