import { test } from 'node:test'
import assert from 'node:assert/strict'
import { greeting } from './format'

test('greeting follows the time in Rome', () => {
  // CET (UTC+1) in winter
  assert.equal(greeting(new Date('2026-12-01T05:00:00Z')), 'Buon giorno') // 06:00
  assert.equal(greeting(new Date('2026-12-01T16:59:00Z')), 'Buon giorno') // 17:59
  assert.equal(greeting(new Date('2026-12-01T17:00:00Z')), 'Buona sera') // 18:00
  assert.equal(greeting(new Date('2026-12-01T21:00:00Z')), 'Buona notte') // 22:00
  assert.equal(greeting(new Date('2026-12-01T04:59:00Z')), 'Buona notte') // 05:59
  // CEST (UTC+2) in summer
  assert.equal(greeting(new Date('2026-07-01T16:30:00Z')), 'Buona sera') // 18:30
})
