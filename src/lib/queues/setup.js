// src/lib/queues/setup.js

import { Queue } from 'bullmq'

let _connection = null
let _queues = null

function getConnection() {
  if (_connection) return _connection

  const Redis = require('ioredis')

  _connection = new Redis(
    process.env.REDIS_URL || 'redis://localhost:6379',
    {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    }
  )

  _connection.on('error', (err) => {
    console.error('[Queue Redis]', err.message)
  })

  return _connection
}

function createQueues() {
  if (_queues) return _queues

  const connection = getConnection()

  const defaultJobOptions = {
    attempts: 3,

    backoff: {
      type: 'exponential',
      delay: 2000,
    },

    removeOnComplete: {
      count: 100,
      age: 24 * 3600,
    },

    removeOnFail: {
      count: 500,
    },
  }

  const heavyJobOptions = {
    ...defaultJobOptions,
    attempts: 5,
  }

  _queues = {
    sms: new Queue('sms', {
      connection,
      defaultJobOptions,
    }),

    email: new Queue('email', {
      connection,
      defaultJobOptions,
    }),

    push: new Queue('push', {
      connection,
      defaultJobOptions,
    }),

    whatsapp: new Queue('whatsapp', {
      connection,
      defaultJobOptions,
    }),

    meet: new Queue('meet', {
      connection,
      defaultJobOptions,
    }),

    settlement: new Queue('settlement', {
      connection,
      defaultJobOptions: heavyJobOptions,
    }),

    refund: new Queue('refund', {
      connection,
      defaultJobOptions: heavyJobOptions,
    }),
  }

  return _queues
}

// ============================================================
// GETTERS
// ============================================================

export function getSmsQueue() {
  return createQueues().sms
}

export function getEmailQueue() {
  return createQueues().email
}

export function getPushQueue() {
  return createQueues().push
}

export function getWhatsappQueue() {
  return createQueues().whatsapp
}

export function getMeetQueue() {
  return createQueues().meet
}

export function getSettlementQueue() {
  return createQueues().settlement
}

export function getRefundQueue() {
  return createQueues().refund
}

// ============================================================
// NAMED QUEUE EXPORTS
// ============================================================

export const smsQueue = {
  add: (...args) =>
    getSmsQueue().add(...args),
}

export const emailQueue = {
  add: (...args) =>
    getEmailQueue().add(...args),
}

export const pushQueue = {
  add: (...args) =>
    getPushQueue().add(...args),
}

export const whatsappQueue = {
  add: (...args) =>
    getWhatsappQueue().add(...args),
}

export const meetQueue = {
  add: (...args) =>
    getMeetQueue().add(...args),
}

export const settlementQueue = {
  add: (...args) =>
    getSettlementQueue().add(...args),
}

export const refundQueue = {
  add: (...args) =>
    getRefundQueue().add(...args),
}

// ============================================================
// BACKWARD COMPATIBILITY
// ============================================================

export const queues = {
  sms: getSmsQueue,
  email: getEmailQueue,
  push: getPushQueue,
  whatsapp: getWhatsappQueue,
  meet: getMeetQueue,
  settlement: getSettlementQueue,
  refund: getRefundQueue,
}

export default queues