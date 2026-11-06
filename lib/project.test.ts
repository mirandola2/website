import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canReadProjects } from './project'

const current = '2026-27'
const year = (id: string, visible: boolean, active: boolean) => ({ id, visible, active })
const none = new Set<string>()

test('canReadProjects: never a hidden year', () => {
  assert.equal(canReadProjects(year(current, false, true), new Set([current]), current), false)
})

test('canReadProjects: the current year or an active one, for everyone', () => {
  assert.equal(canReadProjects(year(current, true, false), none, current), true)
  assert.equal(canReadProjects(year('2025-26', true, true), none, current), true)
})

test('canReadProjects: a closed past year only with an own project', () => {
  assert.equal(canReadProjects(year('2025-26', true, false), none, current), false)
  assert.equal(canReadProjects(year('2025-26', true, false), new Set(['2025-26']), current), true)
  // A project of another year doesn't count
  assert.equal(canReadProjects(year('2025-26', true, false), new Set(['2024-25']), current), false)
})
