import { test } from 'node:test'
import assert from 'node:assert/strict'
import { birthdayWindow, daysUntilBirthday, romeToday, upcomingBirthdays } from './birthdays'

test('same day and later in the year', () => {
  assert.equal(daysUntilBirthday('2000-06-21', '2026-06-21'), 0)
  assert.equal(daysUntilBirthday('2000-06-21', '2026-06-14'), 7)
})

test('Dec 31 → Jan 1 rollover', () => {
  assert.equal(daysUntilBirthday('2001-01-01', '2026-12-31'), 1)
  assert.equal(daysUntilBirthday('2001-01-03', '2026-12-30'), 4)
  // Already passed this year: next year
  assert.equal(daysUntilBirthday('2001-12-30', '2026-12-31'), 364)
})

test('Feb 29 in leap and non-leap years', () => {
  // Non-leap: celebrated on Feb 28
  assert.equal(daysUntilBirthday('2004-02-29', '2026-02-28'), 0)
  assert.equal(daysUntilBirthday('2004-02-29', '2026-02-27'), 1)
  assert.equal(daysUntilBirthday('2004-02-29', '2026-03-01'), 364)
  // Leap: Feb 29 itself
  assert.equal(daysUntilBirthday('2004-02-29', '2028-02-28'), 1)
  assert.equal(daysUntilBirthday('2004-02-29', '2028-02-29'), 0)
  // Mar 1 counts the leap day
  assert.equal(daysUntilBirthday('2004-03-01', '2028-02-28'), 2)
})

test('Rome date differs from UTC around midnight', () => {
  // 23:30 UTC on Jun 20 is already Jun 21 in Rome (CEST, UTC+2)
  assert.equal(romeToday(new Date('2026-06-20T23:30:00Z')), '2026-06-21')
  // 23:30 UTC on Dec 31 is Jan 1 in Rome (CET, UTC+1)
  assert.equal(romeToday(new Date('2026-12-31T23:30:00Z')), '2027-01-01')
})

test('upcoming list: window, order and exposed fields', () => {
  const members = [
    { fullName: 'Lorenzo Maria Mangiafico', birthday: '2006-10-30' },
    { fullName: 'Anna Cavicchioli', birthday: '2003-10-27' },
    { fullName: 'Bianca Zanini', birthday: '2013-11-04' },
    { fullName: 'Zeno Far', birthday: '2013-11-05' },
  ]
  assert.deepEqual(upcomingBirthdays(members, '2026-10-28'), [
    { name: 'Lorenzo', last_initial: 'M', t_minus: 2 },
    { name: 'Bianca', last_initial: 'Z', t_minus: 7 },
  ])
})

test('birthdayWindow covers the next days, one more for Feb 29', () => {
  assert.deepEqual(birthdayWindow('2026-06-14', 7), { from: '06-14', to: '06-22' })
  // Over New Year: from > to
  assert.deepEqual(birthdayWindow('2026-12-28', 7), { from: '12-28', to: '01-05' })
  // Non-leap year: Feb 29 (celebrated on Feb 28) is inside the range
  const w = birthdayWindow('2026-02-21', 7)
  assert.ok(w.from <= '02-29' && '02-29' <= w.to)
})

test('upcoming list keeps Don and Suor with the name', () => {
  const members = [{ fullName: 'DON MARIO ROSSI', birthday: '2000-10-28' }]
  assert.deepEqual(upcomingBirthdays(members, '2026-10-28'), [{ name: 'DON MARIO', last_initial: 'R', t_minus: 0 }])
})
