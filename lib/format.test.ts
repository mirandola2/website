import { test } from 'node:test'
import assert from 'node:assert/strict'
import { greeting, normalizeName, shortNames, slugify, titleCase } from './format'

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

test('slugify drops accents and symbols', () => {
  assert.equal(slugify('Città & Paese'), 'citta-paese')
  assert.equal(slugify('  Obiettivi 2024-25!  '), 'obiettivi-2024-25')
})

test('normalizeName collapses spaces', () => {
  assert.equal(normalizeName('  MARIO   ROSSI '), 'MARIO ROSSI')
})

test('titleCase normalizes case after spaces, hyphens and apostrophes', () => {
  assert.equal(titleCase('MARIO R.'), 'Mario R.')
  assert.equal(titleCase('anna-maria d\'ANGELO'), 'Anna-Maria D\'Angelo')
  assert.equal(titleCase('NICOLÒ è'), 'Nicolò È')
})

test('shortNames tells apart leaders with the same first name', () => {
  assert.deepEqual(shortNames(['Luca Meschieri', 'Luca Toselli', 'Giacomo Salici']), ['Luca M.', 'Luca T.', 'Giacomo'])
  // Same initial: the full name
  assert.deepEqual(shortNames(['Matteo Ba', 'Matteo Be', 'Anna']), ['Matteo Ba', 'Matteo Be', 'Anna'])
  // Full homonyms stay the same (the avatar tells them apart)
  assert.deepEqual(shortNames(['Anna Rossi', 'Anna Rossi']), ['Anna Rossi', 'Anna Rossi'])
})
