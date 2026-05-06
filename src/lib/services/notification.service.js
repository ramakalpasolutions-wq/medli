// Import lazily to avoid bundling BullMQ in client chunks
import { smsQueue, emailQueue, pushQueue } from '@/lib/queues/setup'

export async function notifyBookingConfirmed({ userId, bookingId, type }) {
  await smsQueue.add('booking_confirmed',  { userId, bookingId, type })
  await emailQueue.add('booking_confirmed', { userId, bookingId, type })
  await pushQueue.add('booking_confirmed',  { userId, bookingId, type })
}

export async function notifyBookingCancelled({ userId, bookingId, refundAmount, refundPercent }) {
  await smsQueue.add('booking_cancelled',  { userId, bookingId, refundAmount, refundPercent })
  await emailQueue.add('booking_cancelled', { userId, bookingId, refundAmount, refundPercent })
  await pushQueue.add('booking_cancelled',  { userId, bookingId, refundAmount, refundPercent })
}

export async function notifyRefundProcessed({ userId, refundNumber, refundAmount, bookingId }) {
  await emailQueue.add('refund_processed', { userId, refundNumber, refundAmount, bookingId })
  await smsQueue.add('refund_processed',   { userId, refundNumber, refundAmount, bookingId })
  await pushQueue.add('refund_processed',  { userId, refundNumber, refundAmount })
}

export async function notifySettlementDone({ entityType, entityId, entityName, settlementNumber, amount }) {
  await emailQueue.add('settlement_done', { entityType, entityId, entityName, settlementNumber, amount })
}

export async function notifyLabReportReady({ userId, bookingId, labName }) {
  await smsQueue.add('lab_report_ready',  { userId, bookingId, labName })
  await emailQueue.add('lab_report_ready', { userId, bookingId, labName })
  await pushQueue.add('lab_report_ready',  { userId, bookingId, labName })
}

export async function notifyHospitalApproved({ hospitalId, contactEmail, hospitalName }) {
  await emailQueue.add('hospital_approved', {
    to: contactEmail,
    hospitalName,
    hospitalId,
  })
}