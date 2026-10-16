// src/workers/whatsapp.worker.js

import { Worker } from 'bullmq'

import { prisma } from '@/lib/prisma'

import {
  sendWhatsappTemplate,
  formatBookingDate,
  formatBookingTime,
} from '@/lib/services/whatsapp.service'

// ============================================================
// REDIS
// ============================================================

let connection = null

function getConnection() {
  if (connection) {
    return connection
  }

  const Redis =
    require('ioredis')

  connection =
    new Redis(
      process.env.REDIS_URL ||
        'redis://localhost:6379',
      {
        maxRetriesPerRequest:
          null,

        enableReadyCheck:
          false,
      }
    )

  connection.on(
    'error',
    (error) => {
      console.error(
        '[WhatsApp Worker Redis]',
        error.message
      )
    }
  )

  return connection
}

// ============================================================
// HELPERS
// ============================================================

function firstValue(
  ...values
) {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      String(value).trim()
    ) {
      return value
    }
  }

  return null
}

function getName(
  entity
) {
  if (!entity) return ''

  return firstValue(
    entity.name,
    entity.fullName,
    entity.displayName
  ) || ''
}

function getPhone(
  entity
) {
  if (!entity) return null

  return firstValue(
    entity.mobile,
    entity.phone,
    entity.phoneNumber,
    entity.contactNumber,
    entity.whatsappNumber
  )
}

async function safeFindUser(
  userId
) {
  if (!userId) {
    return null
  }

  try {
    return await prisma.user.findUnique({
      where: {
        id:
          userId,
      },
    })
  } catch (error) {
    console.warn(
      '[WhatsApp Worker] User lookup failed:',
      error.message
    )

    return null
  }
}

async function safeFindDoctor(
  doctorId
) {
  if (!doctorId) {
    return null
  }

  try {
    return await prisma.doctor.findUnique({
      where: {
        id:
          doctorId,
      },
    })
  } catch (error) {
    console.warn(
      '[WhatsApp Worker] Doctor lookup failed:',
      error.message
    )

    return null
  }
}

async function safeFindHospital(
  hospitalId
) {
  if (!hospitalId) {
    return null
  }

  try {
    return await prisma.hospital.findUnique({
      where: {
        id:
          hospitalId,
      },
    })
  } catch (error) {
    console.warn(
      '[WhatsApp Worker] Hospital lookup failed:',
      error.message
    )

    return null
  }
}

async function safeFindLab(
  labId
) {
  if (!labId) {
    return null
  }

  try {
    return await prisma.lab.findUnique({
      where: {
        id:
          labId,
      },
    })
  } catch (error) {
    console.warn(
      '[WhatsApp Worker] Lab lookup failed:',
      error.message
    )

    return null
  }
}

async function findAdminUser(
  adminUserId
) {
  if (!adminUserId) {
    return null
  }

  return safeFindUser(
    adminUserId
  )
}

async function loadLabTests(
  booking
) {
  const ids =
    Array.isArray(
      booking?.labTestIds
    )
      ? booking.labTestIds
      : []

  if (!ids.length) {
    return []
  }

  try {
    return await prisma.labTest.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    })
  } catch (error) {
    console.warn(
      '[WhatsApp Worker] Lab tests lookup failed:',
      error.message
    )

    return []
  }
}

function getTestNames(
  tests
) {
  if (
    !Array.isArray(tests) ||
    tests.length === 0
  ) {
    return ''
  }

  return tests
    .map(
      (test) =>
        test?.name ||
        test?.testName
    )
    .filter(Boolean)
    .join(', ')
}

// ============================================================
// PATIENT
// ============================================================

async function notifyPatient({
  booking,
  patient,
  doctor,
  hospital,
  lab,
  tests,
}) {
  const phone =
    getPhone(patient)

  if (!phone) {
    console.warn(
      '[WhatsApp Worker] Patient phone missing:',
      booking.bookingId
    )

    return
  }

  const templateId =
    process.env
      .MSG91_WA_PATIENT_BOOKING_TEMPLATE

  if (!templateId) {
    console.warn(
      '[WhatsApp Worker] Patient template not configured'
    )

    return
  }

  await sendWhatsappTemplate({
    mobile:
      phone,

    templateId,

    variables: {
      booking_id:
        booking.bookingId,

      patient_name:
        getName(patient) ||
        'Patient',

      booking_type:
        booking.type,

      date:
        formatBookingDate(
          booking.startTime
        ),

      time:
        formatBookingTime(
          booking.startTime
        ),

      doctor_name:
        getName(doctor),

      hospital_name:
        getName(hospital),

      lab_name:
        getName(lab),

      tests:
        getTestNames(
          tests
        ),

      amount:
        String(
          booking.totalAmount ??
            ''
        ),

      payment_status:
        booking.paymentStatus,
    },
  })
}

// ============================================================
// DOCTOR
// ============================================================

async function notifyDoctor({
  booking,
  patient,
  doctor,
  hospital,
}) {
  if (!doctor) {
    return
  }

  let doctorUser =
    null

  if (doctor.userId) {
    doctorUser =
      await safeFindUser(
        doctor.userId
      )
  }

  const phone =
    firstValue(
      getPhone(doctor),
      getPhone(doctorUser)
    )

  if (!phone) {
    console.warn(
      '[WhatsApp Worker] Doctor phone missing:',
      booking.doctorId
    )

    return
  }

  const templateId =
    process.env
      .MSG91_WA_DOCTOR_BOOKING_TEMPLATE

  if (!templateId) {
    console.warn(
      '[WhatsApp Worker] Doctor template not configured'
    )

    return
  }

  await sendWhatsappTemplate({
    mobile:
      phone,

    templateId,

    variables: {
      booking_id:
        booking.bookingId,

      patient_name:
        getName(patient) ||
        'Patient',

      doctor_name:
        getName(doctor),

      hospital_name:
        getName(hospital),

      booking_type:
        booking.type,

      date:
        formatBookingDate(
          booking.startTime
        ),

      time:
        formatBookingTime(
          booking.startTime
        ),

      amount:
        String(
          booking.totalAmount ??
            ''
        ),
    },
  })
}

// ============================================================
// HOSPITAL
// ============================================================

async function notifyHospital({
  booking,
  patient,
  doctor,
  hospital,
}) {
  if (!hospital) {
    return
  }

  const hospitalAdmin =
    await findAdminUser(
      hospital.adminUserId
    )

  const phone =
    firstValue(
      getPhone(hospital),
      getPhone(hospitalAdmin)
    )

  if (!phone) {
    console.warn(
      '[WhatsApp Worker] Hospital phone missing:',
      booking.hospitalId
    )

    return
  }

  const templateId =
    process.env
      .MSG91_WA_HOSPITAL_BOOKING_TEMPLATE

  if (!templateId) {
    console.warn(
      '[WhatsApp Worker] Hospital template not configured'
    )

    return
  }

  await sendWhatsappTemplate({
    mobile:
      phone,

    templateId,

    variables: {
      booking_id:
        booking.bookingId,

      patient_name:
        getName(patient) ||
        'Patient',

      doctor_name:
        getName(doctor),

      hospital_name:
        getName(hospital),

      booking_type:
        booking.type,

      date:
        formatBookingDate(
          booking.startTime
        ),

      time:
        formatBookingTime(
          booking.startTime
        ),

      amount:
        String(
          booking.totalAmount ??
            ''
        ),
    },
  })
}

// ============================================================
// LAB
// ============================================================

async function notifyLab({
  booking,
  patient,
  lab,
  tests,
}) {
  if (!lab) {
    return
  }

  const labAdmin =
    await findAdminUser(
      lab.adminUserId
    )

  const phone =
    firstValue(
      getPhone(lab),
      getPhone(labAdmin)
    )

  if (!phone) {
    console.warn(
      '[WhatsApp Worker] Lab phone missing:',
      booking.labId
    )

    return
  }

  const templateId =
    process.env
      .MSG91_WA_LAB_BOOKING_TEMPLATE

  if (!templateId) {
    console.warn(
      '[WhatsApp Worker] Lab template not configured'
    )

    return
  }

  await sendWhatsappTemplate({
    mobile:
      phone,

    templateId,

    variables: {
      booking_id:
        booking.bookingId,

      patient_name:
        getName(patient) ||
        'Patient',

      lab_name:
        getName(lab),

      tests:
        getTestNames(
          tests
        ),

      date:
        formatBookingDate(
          booking.startTime
        ),

      time:
        formatBookingTime(
          booking.startTime
        ),

      collection_type:
        firstValue(
          booking.collectionType,
          booking.serviceType,
          booking.visitType,
          ''
        ),

      amount:
        String(
          booking.totalAmount ??
            ''
        ),
    },
  })
}

// ============================================================
// PROCESS BOOKING
// ============================================================

async function processBookingConfirmed(
  job
) {
  const bookingId =
    job?.data?.bookingId

  if (!bookingId) {
    throw new Error(
      'bookingId is required'
    )
  }

  console.log(
    '[WhatsApp Worker] Processing:',
    {
      jobId:
        job.id,

      bookingId,
    }
  )

  const booking =
    await prisma.booking.findUnique({
      where: {
        id:
          bookingId,
      },
    })

  if (!booking) {
    throw new Error(
      `Booking ${bookingId} not found`
    )
  }

  /*
   * Never send "booking confirmed" for an
   * unpaid/unconfirmed booking.
   */
  if (
    booking.paymentStatus !==
      'paid' ||
    booking.status !==
      'confirmed'
  ) {
    console.warn(
      '[WhatsApp Worker] Booking is not confirmed:',
      {
        bookingId:
          booking.id,

        status:
          booking.status,

        paymentStatus:
          booking.paymentStatus,
      }
    )

    return {
      skipped: true,
      reason:
        'booking_not_confirmed',
    }
  }

  const [
    patient,
    doctor,
    hospital,
    lab,
    tests,
  ] =
    await Promise.all([
      safeFindUser(
        booking.userId
      ),

      safeFindDoctor(
        booking.doctorId
      ),

      safeFindHospital(
        booking.hospitalId
      ),

      safeFindLab(
        booking.labId
      ),

      loadLabTests(
        booking
      ),
    ])

  const results = {
    patient:
      false,

    doctor:
      false,

    hospital:
      false,

    lab:
      false,
  }

  // ========================================================
  // PATIENT
  // ========================================================

  try {
    await notifyPatient({
      booking,
      patient,
      doctor,
      hospital,
      lab,
      tests,
    })

    results.patient =
      true
  } catch (error) {
    console.error(
      '[WhatsApp Worker] Patient notification failed:',
      error.message
    )
  }

  // ========================================================
  // HOSPITAL / ONLINE
  // ========================================================

  if (
    booking.type ===
      'hospital' ||
    booking.type ===
      'online'
  ) {
    try {
      await notifyDoctor({
        booking,
        patient,
        doctor,
        hospital,
      })

      results.doctor =
        true
    } catch (error) {
      console.error(
        '[WhatsApp Worker] Doctor notification failed:',
        error.message
      )
    }

    try {
      await notifyHospital({
        booking,
        patient,
        doctor,
        hospital,
      })

      results.hospital =
        true
    } catch (error) {
      console.error(
        '[WhatsApp Worker] Hospital notification failed:',
        error.message
      )
    }
  }

  // ========================================================
  // LAB
  // ========================================================

  if (
    booking.type ===
    'lab'
  ) {
    try {
      await notifyLab({
        booking,
        patient,
        lab,
        tests,
      })

      results.lab =
        true
    } catch (error) {
      console.error(
        '[WhatsApp Worker] Lab notification failed:',
        error.message
      )
    }
  }

  console.log(
    '[WhatsApp Worker] Completed:',
    {
      bookingId:
        booking.id,

      bookingRef:
        booking.bookingId,

      type:
        booking.type,

      results,
    }
  )

  return {
    success: true,
    bookingId:
      booking.id,
    results,
  }
}

// ============================================================
// WORKER
// ============================================================

export const whatsappWorker =
  new Worker(
    'whatsapp',

    async (job) => {
      switch (job.name) {
        case 'booking_confirmed':
          return processBookingConfirmed(
            job
          )

        default:
          throw new Error(
            `Unknown WhatsApp job: ${job.name}`
          )
      }
    },

    {
      connection:
        getConnection(),

      concurrency: 5,
    }
  )

// ============================================================
// EVENTS
// ============================================================

whatsappWorker.on(
  'completed',
  (job) => {
    console.log(
      '[WhatsApp Worker] Job completed:',
      job.id
    )
  }
)

whatsappWorker.on(
  'failed',
  (job, error) => {
    console.error(
      '[WhatsApp Worker] Job failed:',
      {
        jobId:
          job?.id,

        name:
          job?.name,

        message:
          error?.message,
      }
    )
  }
)

whatsappWorker.on(
  'error',
  (error) => {
    console.error(
      '[WhatsApp Worker] Worker error:',
      error.message
    )
  }
)

export default whatsappWorker