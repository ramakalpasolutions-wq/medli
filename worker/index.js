const { Worker } = require('bullmq')
const http = require('http')
const Redis = require('ioredis')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

async function loadModules() {
  const { sendSMS } = await import('../src/lib/utils/msg91.js')
  const { sendEmail } = await import('../src/lib/utils/nodemailer.js')
  const {
    welcome,
    otp,
    bookingConfirmed,
    bookingCancelled,
    bookingRescheduled,
    refundProcessed,
    settlementDone,
    labReportReady,
  } = await import('../src/lib/utils/emailTemplates.js')
  const { sendPushToTokens, sendPushToTopic } = await import('../src/lib/utils/firebase.js')
  const { createConsultationEvent } = await import('../src/lib/services/meet.service.js')
  const { processRefund } = await import('../src/lib/services/refund.service.js')
  const { processSettlement } = await import('../src/lib/services/settlement.service.js')
  const prismaModule = await import('../src/lib/prisma.js')

  const prisma = prismaModule.prisma || prismaModule.default

  return {
    sendSMS,
    sendEmail,
    templates: {
      welcome,
      otp,
      bookingConfirmed,
      bookingCancelled,
      bookingRescheduled,
      refundProcessed,
      settlementDone,
      labReportReady,
    },
    sendPushToTokens,
    sendPushToTopic,
    createConsultationEvent,
    processRefund,
    processSettlement,
    prisma,
  }
}

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

connection.on('connect', () => console.log('[Worker] Redis connected'))
connection.on('error', (err) => console.error('[Worker] Redis error:', err.message))

async function logNotification(
  prisma,
  { userId, channel, template, variables, status, providerResponse }
) {
  try {
    await prisma.notificationLog.create({
      data: {
        userId: userId || null,
        channel,
        template: template || null,
        variables: variables || null,
        status,
        providerResponse: providerResponse || null,
      },
    })
  } catch (err) {
    console.error('[Worker] NotificationLog failed:', err.message)
  }
}

async function startWorkers() {
  const modules = await loadModules()

  const {
    sendSMS,
    sendEmail,
    templates,
    sendPushToTokens,
    sendPushToTopic,
    createConsultationEvent,
    processRefund,
    processSettlement,
    prisma,
  } = modules

  const smsWorker = new Worker(
    'sms',
    async (job) => {
      const {
        userId,
        phone,
        bookingId,
        otp: otpCode,
        templateId,
        variables,
      } = job.data

      let userPhone = phone
      if (userId && !phone) {
        const u = await prisma.user.findUnique({
          where: { id: userId },
          select: { phone: true },
        })
        userPhone = u?.phone
      }

      if (!userPhone) {
        console.warn('[SMS] No phone for job', job.name)
        return
      }

      let tplId = templateId || process.env.MSG91_TEMPLATE_ID_OTP
      let vars = variables || {}

      if (job.name === 'booking_confirmed') {
        tplId = process.env.MSG91_TEMPLATE_ID_BOOKING
        vars = { bookingId }
      } else if (job.name === 'send_otp') {
        vars = { otp: otpCode }
      }

      try {
        const result = await sendSMS({
          phone: userPhone,
          templateId: tplId,
          variables: vars,
        })

        await logNotification(prisma, {
          userId,
          channel: 'sms',
          template: job.name,
          variables: vars,
          status: 'sent',
          providerResponse: result,
        })
      } catch (err) {
        await logNotification(prisma, {
          userId,
          channel: 'sms',
          template: job.name,
          variables: vars,
          status: 'failed',
          providerResponse: { error: err.message },
        })
        throw err
      }
    },
    { connection, concurrency: 5 }
  )

  const emailWorker = new Worker(
    'email',
    async (job) => {
      const {
        userId,
        to: directTo,
        subject: directSubject,
        html: directHtml,
        bookingId,
        refundAmount,
        refundNumber,
        settlementNumber,
        amount,
        entityName,
        utrNumber,
        labName,
      } = job.data

      let emailTo = directTo
      let emailData = { subject: directSubject, html: directHtml }

      if (userId && !directTo) {
        const u = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        })

        if (!u?.email) return
        emailTo = u.email

        if (job.name === 'booking_confirmed') {
          const booking = await prisma.booking.findFirst({
            where: { bookingId },
            select: { type: true, startTime: true, totalAmount: true },
          })
          emailData = templates.bookingConfirmed({
            name: u.name,
            bookingId,
            type: booking?.type,
            startTime: booking?.startTime,
            totalAmount: booking?.totalAmount,
          })
        } else if (job.name === 'booking_cancelled') {
          emailData = templates.bookingCancelled({
            name: u.name,
            bookingId,
            refundAmount,
            refundPercent: job.data.refundPercent,
          })
        } else if (job.name === 'refund_processed') {
          emailData = templates.refundProcessed({
            name: u.name,
            refundNumber,
            refundAmount,
            bookingId,
          })
        } else if (job.name === 'lab_report_ready') {
          emailData = templates.labReportReady({
            name: u.name,
            bookingId,
            labName,
          })
        }
      }

      if (job.name === 'settlement_done') {
        emailData = templates.settlementDone({
          entityName,
          settlementNumber,
          amount,
          utrNumber,
        })
      }

      if (!emailTo) return

      try {
        const result = await sendEmail({
          to: emailTo,
          subject: emailData.subject,
          html: emailData.html,
        })

        await logNotification(prisma, {
          userId,
          channel: 'email',
          template: job.name,
          status: 'sent',
          providerResponse: { messageId: result?.messageId },
        })
      } catch (err) {
        await logNotification(prisma, {
          userId,
          channel: 'email',
          template: job.name,
          status: 'failed',
          providerResponse: { error: err.message },
        })
        throw err
      }
    },
    { connection, concurrency: 10 }
  )

  const pushWorker = new Worker(
    'push',
    async (job) => {
      const { userId, tokens: directTokens, topic, title, body, data } = job.data

      if (topic) {
        await sendPushToTopic({ topic, title, body, data })
        return
      }

      let deviceTokens = directTokens
      if (userId && !directTokens) {
        const u = await prisma.user.findUnique({
          where: { id: userId },
          select: { devices: true },
        })
        deviceTokens = (u?.devices || []).map((d) => d.token)
      }

      if (!deviceTokens || deviceTokens.length === 0) return

      try {
        await sendPushToTokens({ tokens: deviceTokens, title, body, data })

        await logNotification(prisma, {
          userId,
          channel: 'push',
          template: job.name,
          status: 'sent',
        })
      } catch (err) {
        await logNotification(prisma, {
          userId,
          channel: 'push',
          template: job.name,
          status: 'failed',
          providerResponse: { error: err.message },
        })
        throw err
      }
    },
    { connection, concurrency: 20 }
  )

  const meetWorker = new Worker(
    'meet',
    async (job) => {
      const { bookingId, doctorId, userId, startTime, endTime, timezone } = job.data

      const [doctor, user] = await Promise.all([
        prisma.doctor.findUnique({
          where: { id: doctorId },
          select: { name: true, userId: true },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        }),
      ])

      let doctorEmail = null
      if (doctor?.userId) {
        const doctorUser = await prisma.user.findUnique({
          where: { id: doctor.userId },
          select: { email: true },
        })
        doctorEmail = doctorUser?.email
      }

      if (!doctorEmail || !user?.email) {
        console.warn('[Meet Worker] Missing emails for booking:', bookingId)
        return
      }

      const { meetLink, calendarEventId } = await createConsultationEvent({
        bookingId,
        doctorEmail,
        patientEmail: user.email,
        patientName: user.name,
        doctorName: doctor.name,
        startTime,
        endTime,
        timezone,
      })

      await prisma.booking.update({
        where: { id: bookingId },
        data: { meetLink, calendarEventId },
      })

      console.log(`[Meet Worker] Meet link created for booking ${bookingId}: ${meetLink}`)
    },
    { connection, concurrency: 5 }
  )

  const settlementWorker = new Worker(
    'settlement',
    async (job) => {
      const { entityType, entityId, initiatedBy, periodFrom, periodTo } = job.data

      const settlement = await processSettlement({
        entityType,
        entityId,
        periodFrom,
        periodTo,
        initiatedBy,
        notes: 'Processed via bulk settlement queue',
      })

      console.log(
        `[Settlement Worker] Settlement ${settlement.settlementNumber} status: ${settlement.status}`
      )
      return { settlementId: settlement.id, status: settlement.status }
    },
    { connection, concurrency: 2 }
  )

  const refundWorker = new Worker(
    'refund',
    async (job) => {
      const { bookingId, initiatedBy, reason } = job.data

      console.log(
        `[Refund Worker] Processing refund job ${job.id} for booking ${bookingId}`
      )

      const refund = await processRefund({
        bookingId,
        initiatedBy,
        reason,
      })

      console.log(
        `[Refund Worker] Refund ${refund.refundNumber} status: ${refund.status}`
      )

      return {
        refundId: refund.id,
        refundNumber: refund.refundNumber,
        status: refund.status,
      }
    },
    { connection, concurrency: 2 }
  )

  const workers = [
    { worker: smsWorker, name: 'SMS' },
    { worker: emailWorker, name: 'Email' },
    { worker: pushWorker, name: 'Push' },
    { worker: meetWorker, name: 'Meet' },
    { worker: settlementWorker, name: 'Settlement' },
    { worker: refundWorker, name: 'Refund' },
  ]

  workers.forEach(({ worker, name }) => {
    worker.on('completed', (job) => {
      console.log(`[${name}] Job ${job.id} (${job.name}) completed`)
    })

    worker.on('failed', (job, err) => {
      console.error(
        `[${name}] Job ${job?.id} (${job?.name}) failed [attempt ${job?.attemptsMade}]:`,
        err.message
      )
    })

    worker.on('error', (err) => {
      console.error(`[${name}] Worker error:`, err.message)
    })
  })

  const server = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      const status = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        workers: workers.map(({ name, worker }) => ({
          name,
          isRunning: !worker.closing,
        })),
        redis: connection.status,
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(status))
      return
    }

    res.writeHead(404)
    res.end()
  })

  const PORT = process.env.WORKER_PORT || 3001
  server.listen(PORT, () => {
    console.log(`[Worker] Health: http://localhost:${PORT}/health`)
  })

  async function gracefulShutdown(signal) {
    console.log(`\n[Worker] ${signal} received. Shutting down...`)
    server.close()

    await Promise.all(
      workers.map(({ worker, name }) =>
        worker.close().then(() => console.log(`[${name}] Closed`))
      )
    )

    await connection.quit()
    await prisma.$disconnect()
    process.exit(0)
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  console.log('[Worker] All 6 workers started with real processing')
}

startWorkers().catch((err) => {
  console.error('[Worker] Fatal startup error:', err.message)
  process.exit(1)
})