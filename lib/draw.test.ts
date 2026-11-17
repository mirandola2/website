import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'crypto'
import { decryptReceiver, derange, drawAssignments, encryptReceiver, parseSecret } from './draw-core'

const isDerangement = (items: string[], map: Map<string, string>) => {
  assert.equal(map.size, items.length)
  assert.deepEqual([...map.values()].sort(), [...items].sort())
  for (const [giver, receiver] of map) assert.notEqual(giver, receiver)
}

test('derange: a permutation with no fixed points', () => {
  const items = Array.from({ length: 30 }, (_, i) => `capo-${i}`)
  for (let run = 0; run < 200; run++) isDerangement(items, derange(items))
})

test('derange: with 2 participants they draw each other', () => {
  const map = derange(['a', 'b'])
  assert.equal(map.get('a'), 'b')
  assert.equal(map.get('b'), 'a')
})

test('derange: with 3 participants both derangements come out', () => {
  const seen = new Set<string>()
  for (let run = 0; run < 200; run++) {
    const map = derange(['a', 'b', 'c'])
    isDerangement(['a', 'b', 'c'], map)
    seen.add([...map.values()].join(''))
  }
  assert.deepEqual([...seen].sort(), ['bca', 'cab'])
})

test('derange: refuses fewer than 2 or duplicate participants', () => {
  assert.throws(() => derange(['a']))
  assert.throws(() => derange(['a', 'a', 'b']))
})

test('drawAssignments: each code keeps its own slug, everyone drawn once, nobody by themselves', () => {
  // Codes and slugs that don't sort the same way, so a mix-up between the two shows
  const people = Array.from({ length: 25 }, (_, i) => ({ code: `AG${1000 - i}`, slug: `capo-${i}` }))
  const slugOf = new Map(people.map(p => [p.code, p.slug]))
  for (let run = 0; run < 200; run++) {
    const rows = drawAssignments(people)
    assert.deepEqual(rows.map(r => r.giver), people.map(p => p.code))
    for (const r of rows) assert.equal(r.giverSlug, slugOf.get(r.giver))
    isDerangement(people.map(p => p.slug), new Map(rows.map(r => [r.giverSlug, r.receiverSlug])))
  }
  assert.throws(() => drawAssignments([{ code: 'a', slug: 'x' }, { code: 'b', slug: '' }]))
})

const secret = randomBytes(32)

test('encryptReceiver: round trip, fixed length, different every time', () => {
  const a = encryptReceiver(secret, 'p1', 'mario', 'anna')
  const b = encryptReceiver(secret, 'p1', 'mario', 'anna-maria-della-rocca-con-un-nome-lungo')
  assert.equal(decryptReceiver(secret, 'p1', 'mario', a), 'anna')
  assert.equal(a.length, b.length)
  assert.notEqual(a, encryptReceiver(secret, 'p1', 'mario', 'anna'))
})

test('decryptReceiver: fails on another row, draw or key', () => {
  const payload = encryptReceiver(secret, 'p1', 'mario', 'anna')
  assert.throws(() => decryptReceiver(secret, 'p1', 'luca', payload))
  assert.throws(() => decryptReceiver(secret, 'p2', 'mario', payload))
  assert.throws(() => decryptReceiver(randomBytes(32), 'p1', 'mario', payload))
})

test('decryptReceiver: fails on a tampered payload', () => {
  const bytes = Buffer.from(encryptReceiver(secret, 'p1', 'mario', 'anna'), 'base64')
  bytes[20] ^= 1
  assert.throws(() => decryptReceiver(secret, 'p1', 'mario', bytes.toString('base64')))
  assert.throws(() => decryptReceiver(secret, 'p1', 'mario', 'AAAA'))
})

test('parseSecret: only 32 bytes of base64', () => {
  assert.throws(() => parseSecret(undefined))
  assert.throws(() => parseSecret(''))
  assert.throws(() => parseSecret(randomBytes(16).toString('base64')))
  assert.equal(parseSecret(secret.toString('base64')).length, 32)
})
