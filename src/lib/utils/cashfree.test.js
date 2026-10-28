import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getCashfreeBaseUrl,
  cashfreeEnvironmentsMatch,
  resolveCashfreeEnvironment,
} from './cashfree.js'

test('Cashfree environment accepts only explicit sandbox or production', () => {
  assert.equal(resolveCashfreeEnvironment('sandbox'), 'sandbox')
  assert.equal(resolveCashfreeEnvironment(' PRODUCTION '), 'production')
  assert.throws(() => resolveCashfreeEnvironment(undefined), /CASHFREE_ENV/)
  assert.throws(() => resolveCashfreeEnvironment('prod'), /CASHFREE_ENV/)
})

test('Cashfree endpoint follows the selected environment', () => {
  assert.equal(
    getCashfreeBaseUrl('sandbox'),
    'https://sandbox.cashfree.com/pg'
  )
  assert.equal(
    getCashfreeBaseUrl('production'),
    'https://api.cashfree.com/pg'
  )
})

test('a client/server environment mismatch is rejected', () => {
  assert.equal(cashfreeEnvironmentsMatch('sandbox', 'sandbox'), true)
  assert.equal(cashfreeEnvironmentsMatch('production', 'production'), true)
  assert.equal(cashfreeEnvironmentsMatch('sandbox', 'production'), false)
  assert.equal(cashfreeEnvironmentsMatch('invalid', 'sandbox'), false)
})
