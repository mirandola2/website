import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DAY_GREETINGS, firstName, greeting, NIGHT_GREETINGS, normalizeName, shortNames, slugify, titleCase } from './format'

test('greeting follows the time in Rome', () => {
  const first = () => 0
  // CET (UTC+1) in winter
  assert.equal(greeting(new Date('2026-12-01T05:00:00Z'), first), DAY_GREETINGS[0]) // 06:00
  assert.equal(greeting(new Date('2026-12-01T20:59:00Z'), first), DAY_GREETINGS[0]) // 21:59
  assert.equal(greeting(new Date('2026-12-01T21:00:00Z'), first), NIGHT_GREETINGS[0]) // 22:00
  assert.equal(greeting(new Date('2026-12-01T04:59:00Z'), first), NIGHT_GREETINGS[0]) // 05:59
  // CEST (UTC+2) in summer
  assert.equal(greeting(new Date('2026-07-01T20:30:00Z'), first), NIGHT_GREETINGS[0]) // 22:30
})

test('greeting picks within the list, last one included', () => {
  const last = () => 0.9999
  assert.equal(greeting(new Date('2026-12-01T10:00:00Z'), last), DAY_GREETINGS.at(-1))
  assert.equal(greeting(new Date('2026-12-01T23:00:00Z'), last), NIGHT_GREETINGS.at(-1))
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

test('firstName keeps Don and Suor with the name', () => {
  assert.equal(firstName('Mario Rossi'), 'Mario')
  assert.equal(firstName('Don Mario Rossi'), 'Don Mario')
  assert.equal(firstName('SUOR Anna Bianchi'), 'SUOR Anna')
  assert.equal(firstName('Don'), 'Don')
  assert.equal(firstName('Donato Rossi'), 'Donato')
})

test('shortNames keeps the prefix', () => {
  assert.deepEqual(shortNames(['Don Mario Rossi', 'Mario Verdi']), ['Don Mario', 'Mario'])
  assert.deepEqual(shortNames(['Suor Anna Rossi', 'Suor Anna Bianchi']), ['Suor Anna R.', 'Suor Anna B.'])
})
