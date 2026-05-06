import { Queue } from 'bullmq'

let _connection = null
let _queues     = null

function getConnection() {
  if (_connection) return _connection
  const Redis = require('ioredis')
  _connection = new Redis(
    process.env.REDIS_URL || 'redis://localhost:6379',
    {
      maxRetriesPerRequest: null,
      enableReadyCheck:     false,
      lazyConnect:          true,
    }
  )
  _connection.on('error', (err) =>
    console.error('[Queue Redis]', err.message)
  )
  return _connection
}

function createQueues() {
  if (_queues) return _queues

  const connection = getConnection()

  const defaultJobOptions = {
    attempts: 3,
    backoff:  { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100, age: 24 * 3600 },
    removeOnFail:     { count: 500 },
  }

  const heavyJobOptions = {
    ...defaultJobOptions,
    attempts: 5,
  }

  _queues = {
    sms:        new Queue('sms',        { connection, defaultJobOptions }),
    email:      new Queue('email',      { connection, defaultJobOptions }),
    push:       new Queue('push',       { connection, defaultJobOptions }),
    meet:       new Queue('meet',       { connection, defaultJobOptions }),
    settlement: new Queue('settlement', { connection, defaultJobOptions: heavyJobOptions }),
    refund:     new Queue('refund',     { connection, defaultJobOptions: heavyJobOptions }),
  }

  return _queues
}

// ─── Getters — return real Queue instances with all methods ───────────────────
export function getSmsQueue()        { return createQueues().sms        }
export function getEmailQueue()      { return createQueues().email      }
export function getPushQueue()       { return createQueues().push       }
export function getMeetQueue()       { return createQueues().meet       }
export function getSettlementQueue() { return createQueues().settlement }
export function getRefundQueue()     { return createQueues().refund     }

// ─── Named exports used by services (these are real Queue instances) ──────────
export const smsQueue        = { add: (...a) => getSmsQueue().add(...a)        }
export const emailQueue      = { add: (...a) => getEmailQueue().add(...a)      }
export const pushQueue       = { add: (...a) => getPushQueue().add(...a)       }
export const meetQueue       = { add: (...a) => getMeetQueue().add(...a)       }
export const settlementQueue = { add: (...a) => getSettlementQueue().add(...a) }
export const refundQueue     = { add: (...a) => getRefundQueue().add(...a)     }

// ─── Named exports map for backward compatibility ─────────────────────────────
export const queues = {
  sms:        getSmsQueue,
  email:      getEmailQueue,
  push:       getPushQueue,
  meet:       getMeetQueue,
  settlement: getSettlementQueue,
  refund:     getRefundQueue,
}

export default queues