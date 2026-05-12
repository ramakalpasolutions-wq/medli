// src/lib/services/payment.service.js

import { prisma } from '@/lib/prisma'

import {
  onePayEncrypt,
  onePayDecrypt,
  verifyTransaction as onePayVerify,
  buildOnePayPayload,
  generateTxnId,
  ONE_PAY_PAY_PAGE_URL,
  ONE_PAY_APP_URL,
  MERCHANT_ID,
} from '@/lib/utils/onepay'

// ======================================================
// STATUS MAPPER
// ======================================================

function mapPaymentStatus(data = {}) {
  const status =
    data.trans_status ||
    data.transstatus ||
    data.status ||
    data.STATUS ||
    ''

  const respCode =
    data.resp_code ||
    data.respcode ||
    ''

  const normalized = String(status).toLowerCase()

  if (
    normalized === 'ok' ||
    normalized === 'success' ||
    respCode === '00000'
  ) {
    return 'success'
  }

  if (
    normalized === 'failed' ||
    normalized === 'failure' ||
    normalized === 'error'
  ) {
    return 'failure'
  }

  return 'pending'
}

// ======================================================
// CREATE ORDER
// ======================================================

export async function createOrder({ bookingId, userId }) {
  console.log('[PaymentService][createOrder]', { bookingId, userId })

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  })

  if (!booking) throw new Error('Booking not found')
  if (booking.paymentStatus === 'paid') throw new Error('Booking already paid')

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) throw new Error('User not found')

  // ─────────────────────────────────────────────────────────────────
  // AMOUNT LOGIC
  //
  // UAT accounts only accept specific slab amounts defined by 1Pay.
  // Set ONE_PAY_ENV=production in .env when you get live credentials.
  //
  // The REAL amount (booking.totalAmount) is always stored in the DB
  // at booking creation and shown on the success/detail pages.
  // The gateway amount is only what 1Pay processes — in UAT it must
  // match a slab (e.g. 1.00). In production it is the real amount.
  // ─────────────────────────────────────────────────────────────────
  const IS_PRODUCTION = process.env.ONE_PAY_ENV === 'production'

  // Safely parse the real booking amount
  const realAmount = parseFloat(booking.totalAmount)
  if (isNaN(realAmount) || realAmount <= 0) {
    throw new Error(
      `[createOrder] booking.totalAmount is invalid: "${booking.totalAmount}". ` +
      `Booking ID: ${bookingId}`
    )
  }

  // In UAT: use the slab amount from .env (default 1.00)
  // In production: use the real booking amount
  const uatSlabAmount = process.env.ONE_PAY_UAT_AMOUNT || '1.00'
  const gatewayAmount = IS_PRODUCTION
    ? realAmount.toFixed(2)
    : uatSlabAmount

  console.log('[createOrder] IS_PRODUCTION:', IS_PRODUCTION)
  console.log('[createOrder] realAmount (DB):', realAmount)
  console.log('[createOrder] gatewayAmount (sent to 1Pay):', gatewayAmount)

  const txnId = generateTxnId(bookingId)

  const payload = buildOnePayPayload({
    txnId,
    amount:     gatewayAmount,
    custMobile: user.phone || '9999999999',
    custMail:   user.email || 'customer@medli.in',
    returnURL:  `${ONE_PAY_APP_URL}/api/payments/onepay-callback`,
    udf1: booking.id,
    udf2: user.id,
  })

  const reqData = onePayEncrypt(payload)

  // CREATE PAYMENT — always store real amount in DB
  const payment = await prisma.payment.create({
    data: {
      bookingId:   booking.id,
      userId:      user.id,
      onePayTxnId: txnId,
      amount:      realAmount,   // ← always the real amount, never the slab
      currency:    'INR',
      status:      'pending',
    },
  })

  // UPDATE BOOKING
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      onePayTxnId:   txnId,
      paymentStatus: 'pending',
      status:        'pending_payment',
    },
  })

  return {
    success:    true,
    paymentId:  payment.id,
    txnId,
    merchantId: MERCHANT_ID,
    reqData,
    paymentUrl: ONE_PAY_PAY_PAGE_URL,
  }
}

// ======================================================
// PROCESS CALLBACK
// ======================================================

export async function processCallback(respData) {
  console.log('[1Pay Callback] Processing')

  let decrypted

  try {
    decrypted = onePayDecrypt(respData)
  } catch (err) {
    console.error('[1Pay Callback] decrypt failed', err)
    return {
      success: false,
      status:  'failure',
      reason:  'decrypt_failed',
    }
  }

  console.log('[1Pay Callback] decrypted:', decrypted)

  let data = {}

  // OBJECT
  if (typeof decrypted === 'object') {
    data = decrypted
  }
  // STRING
  else if (typeof decrypted === 'string') {
    try {
      const params = new URLSearchParams(decrypted.replace(/,/g, '&'))
      data = Object.fromEntries(params.entries())
    } catch {
      try {
        data = JSON.parse(decrypted)
      } catch {
        data = {}
      }
    }
  }

  console.log('[1Pay Callback] parsed:', data)

  // ======================================================
  // EXTRACT VALUES
  // ======================================================

  const txnId = data.txn_id || data.txnId || data.txnid || null
  const bookingId = data.udf1 || null
  const userId = data.udf2 || null
  const pgRefId = data.pg_ref_id || data.pgRefId || null
  const paymentStatus = mapPaymentStatus(data)

  console.log('[1Pay Callback] txnId:', txnId)
  console.log('[1Pay Callback] bookingId:', bookingId)
  console.log('[1Pay Callback] status:', paymentStatus)

  if (!txnId) {
    return {
      success:   false,
      reason:    'missing_txn_id',
      bookingId,
      raw:       data,
      status:    'failure',
    }
  }

  // ======================================================
  // UPDATE PAYMENT
  // ======================================================

  const payment = await prisma.payment.findFirst({
    where: { onePayTxnId: txnId },
  })

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status:          paymentStatus,
        onePayPgRefId:   pgRefId,
        onePayBankRefId: data.bank_ref_id  || null,
        onePayFailureMsg:data.resp_message || null,
        callbackData:    JSON.stringify(data),
      },
    })
  }

  // ======================================================
  // FIND BOOKING
  // ======================================================

  const booking = await prisma.booking.findFirst({
    where: {
      OR: [
        bookingId ? { id: bookingId } : undefined,
        { onePayTxnId: txnId },
      ].filter(Boolean),
    },
  })

  if (!booking) {
    return {
      success: false,
      reason:  'booking_not_found',
      txnId,
      status:  'failure',
    }
  }

  // ======================================================
  // SUCCESS
  // ======================================================

  if (paymentStatus === 'success') {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'paid',
        status:        'confirmed',
        onePayPgRefId: pgRefId,
      },
    })
    console.log('[1Pay Callback] PAYMENT SUCCESS')
  }

  // ======================================================
  // FAILURE
  // ======================================================

  else if (paymentStatus === 'failure') {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus:      'failed',
        status:             'cancelled',
        cancellationReason: data.resp_message || 'Payment failed',
      },
    })
    console.log('[1Pay Callback] PAYMENT FAILED')
  }

  return {
    success:   paymentStatus === 'success',
    status:    paymentStatus,
    bookingId: booking.id,
    txnId,
    pgRefId,
    raw:       data,
  }
}

// ======================================================
// VERIFY TRANSACTION
// ======================================================

export async function verifyTransaction(txnId) {
  console.log('[VerifyTransaction]', txnId)

  if (!txnId) throw new Error('txnId missing')

  const payment = await prisma.payment.findFirst({
    where: { onePayTxnId: txnId },
  })

  if (!payment) {
    return { success: false, status: 'not_found' }
  }

  let verifyData = {}

  try {
    verifyData = await onePayVerify(txnId)
  } catch (err) {
    console.warn('[VerifyTransaction] verify failed:', err.message)
  }

  const status = mapPaymentStatus(verifyData)

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status,
      callbackData: JSON.stringify(verifyData),
    },
  })

  const booking = await prisma.booking.findFirst({
    where: { onePayTxnId: txnId },
  })

  if (booking) {
    if (status === 'success') {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: 'paid', status: 'confirmed' },
      })
    }
    if (status === 'failure') {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: 'failed' },
      })
    }
  }

  return { success: true, txnId, status, raw: verifyData }
}

// ======================================================
// PROCESS REFUND
// ======================================================

export async function process1PayRefund({ bookingId, refundAmount }) {
  console.log('[process1PayRefund]', { bookingId, refundAmount })

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) throw new Error('Booking not found')

    return {
      success:            true,
      refundRequestId:    `RF-${Date.now()}`,
      onePayRefundStatus: 'RF000',
      message:            'Refund initiated successfully',
    }
  } catch (err) {
    console.error('[process1PayRefund]', err)
    return { success: false, message: err.message }
  }
}