// src/lib/services/booking-notification.service.js

import { whatsappQueue } from '@/lib/queues/setup'

export async function queueBookingConfirmedWhatsapp(
  bookingId
) {
  if (!bookingId) {
    console.warn(
      '[WhatsApp Queue] Missing bookingId'
    )

    return null
  }

  const normalizedBookingId =
    String(bookingId).trim()

  /*
   * Same booking may be confirmed by:
   *
   * 1. Cashfree webhook
   * 2. /api/payments/verify
   *
   * Same jobId prevents duplicate jobs.
   */
  const jobId =
    `booking-confirmed-${normalizedBookingId}`

  try {
    const job =
      await whatsappQueue.add(
        'booking_confirmed',
        {
          bookingId:
            normalizedBookingId,
        },
        {
          jobId,

          attempts: 5,

          backoff: {
            type: 'exponential',
            delay: 3000,
          },

          /*
           * Keep completed jobs for a while.
           *
           * This is important because BullMQ can use
           * the existing job ID to prevent duplicates.
           */
          removeOnComplete: {
            age: 7 * 24 * 60 * 60,
            count: 5000,
          },

          removeOnFail: {
            age: 30 * 24 * 60 * 60,
            count: 5000,
          },
        }
      )

    console.log(
      '[WhatsApp Queue] Booking confirmation queued:',
      {
        bookingId:
          normalizedBookingId,

        jobId:
          job.id,
      }
    )

    return job
  } catch (error) {
    /*
     * WhatsApp failure must never make a successful
     * Cashfree payment fail.
     */

    console.error(
      '[WhatsApp Queue] Failed:',
      {
        bookingId:
          normalizedBookingId,

        message:
          error?.message,
      }
    )

    return null
  }
}