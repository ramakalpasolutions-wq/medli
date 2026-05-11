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

  // SUCCESS
  if (
    normalized === 'ok' ||
    normalized === 'success' ||
    respCode === '00000'
  ) {
    return 'success'
  }

  // FAILURE
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
  console.log('[PaymentService][createOrder]', {
    bookingId,
    userId,
  })

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  })

  if (!booking) {
    throw new Error('Booking not found')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const txnId = generateTxnId(bookingId)

  const payload = buildOnePayPayload({
    txnId,
    amount: Number(booking.totalAmount).toFixed(2),
    custMobile: user.phone || '9999999999',
    custMail: user.email || 'customer@medli.in',
    returnURL: `${ONE_PAY_APP_URL}/api/payments/onepay-callback`,

    udf1: booking.id,
    udf2: user.id,
  })

  const reqData = onePayEncrypt(payload)

  // CREATE PAYMENT RECORD
  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      userId: user.id,
      onePayTxnId: txnId,
      amount: booking.totalAmount,
      currency: 'INR',
      status: 'pending',
    },
  })

  // UPDATE BOOKING
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      onePayTxnId: txnId,
      paymentStatus: 'pending',
      status: 'pending_payment',
    },
  })

  return {
    success: true,
    paymentId: payment.id,
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
  console.log('[1Pay Callback] Processing callback')

  // ======================================================
  // DECRYPT
  // ======================================================

  let decrypted

  try {
    decrypted = onePayDecrypt(respData)
  } catch (err) {
    console.error('[1Pay Callback] decrypt failed', err)

    return {
      success: false,
      status: 'failure',
      reason: 'decrypt_failed',
    }
  }

  console.log('[1Pay Callback] decrypted raw:', decrypted)

  // ======================================================
  // PARSE RESPONSE
  // ======================================================

  let data = {}

  // CASE 1 → already object
  if (typeof decrypted === 'object') {
    data = decrypted
  }

  // CASE 2 → querystring
  else if (typeof decrypted === 'string') {
    try {
      const params = new URLSearchParams(
        decrypted.replace(/,/g, '&')
      )

      data = Object.fromEntries(params.entries())
    } catch {
      try {
        data = JSON.parse(decrypted)
      } catch {
        data = {}
      }
    }
  }

  console.log('[1Pay Callback] parsed data:', data)

  // ======================================================
  // EXTRACT VALUES
  // ======================================================

  const txnId =
    data.txn_id ||
    data.txnId ||
    data.txnid ||
    null

  const bookingId =
    data.udf1 ||
    null

  const userId =
    data.udf2 ||
    null

  const pgRefId =
    data.pg_ref_id ||
    data.pgRefId ||
    null

  const paymentStatus = mapPaymentStatus(data)

  console.log('[1Pay Callback] txnId:', txnId)
  console.log('[1Pay Callback] bookingId:', bookingId)
  console.log('[1Pay Callback] status:', paymentStatus)

  // ======================================================
  // TXN REQUIRED
  // ======================================================

  if (!txnId) {
    return {
      success: false,
      reason: 'missing_txn_id',
      bookingId,
      raw: data,
      status: 'failure',
    }
  }

  // ======================================================
  // FIND PAYMENT
  // ======================================================

  const payment = await prisma.payment.findFirst({
    where: {
      onePayTxnId: txnId,
    },
  })

  // ======================================================
  // UPDATE PAYMENT
  // ======================================================

  if (payment) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: paymentStatus,
        onePayPgRefId: pgRefId,
        onePayBankRefId:
          data.bank_ref_id || null,

        onePayFailureMsg:
          data.resp_message || null,

        callbackData: JSON.stringify(data),
      },
    })
  }

  // ======================================================
  // FIND BOOKING
  // ======================================================

  const booking = await prisma.booking.findFirst({
    where: {
      OR: [
        bookingId
          ? { id: bookingId }
          : undefined,

        { onePayTxnId: txnId },
      ].filter(Boolean),
    },
  })

  if (!booking) {
    console.error('[1Pay Callback] booking not found')

    return {
      success: false,
      status: 'failure',
      reason: 'booking_not_found',
      txnId,
    }
  }

  // ======================================================
  // SUCCESS
  // ======================================================

  if (paymentStatus === 'success') {
    await prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        paymentStatus: 'paid',
        status: 'confirmed',
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
      where: {
        id: booking.id,
      },
      data: {
        paymentStatus: 'failed',
        status: 'cancelled',
        cancellationReason:
          data.resp_message || 'Payment failed',
      },
    })

    console.log('[1Pay Callback] PAYMENT FAILED')
  }

  // ======================================================
  // RETURN
  // ======================================================

  return {
    success: paymentStatus === 'success',
    status: paymentStatus,
    bookingId: booking.id,
    txnId,
    pgRefId,
    raw: data,
  }
}

// ======================================================
// VERIFY TRANSACTION
// ======================================================

export async function verifyTransaction(txnId) {
  console.log('[VerifyTransaction]', txnId)

  if (!txnId) {
    throw new Error('txnId missing')
  }

  // FIND LOCAL PAYMENT
  const payment = await prisma.payment.findFirst({
    where: {
      onePayTxnId: txnId,
    },
  })

  if (!payment) {
    return {
      success: false,
      status: 'not_found',
    }
  }

  // CALL 1PAY VERIFY
  let verifyData = {}

  try {
    verifyData = await onePayVerify(txnId)
  } catch (err) {
    console.warn('[VerifyTransaction] verify API failed')
  }

  const status = mapPaymentStatus(verifyData)

  // UPDATE PAYMENT
  await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      status,
      callbackData: JSON.stringify(verifyData),
    },
  })

  // UPDATE BOOKING
  const booking = await prisma.booking.findFirst({
    where: {
      onePayTxnId: txnId,
    },
  })

  if (booking) {
    if (status === 'success') {
      await prisma.booking.update({
        where: {
          id: booking.id,
        },
        data: {
          paymentStatus: 'paid',
          status: 'confirmed',
        },
      })
    }

    if (status === 'failure') {
      await prisma.booking.update({
        where: {
          id: booking.id,
        },
        data: {
          paymentStatus: 'failed',
        },
      })
    }
  }

  return {
    success: true,
    txnId,
    status,
    raw: verifyData,
  }
}