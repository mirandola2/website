import test from 'node:test'
import assert from 'node:assert/strict'
import { morseToPulses, morseToText, textToMorse, unitMs } from './morse'

const total = (morse: string) => morseToPulses(morse).reduce((sum, p) => sum + p.units, 0)

test('textToMorse separates letters and words', () => {
  assert.deepEqual(textToMorse('sos'), { text: 'SOS', morse: '... / --- / ...' })
  assert.equal(textToMorse('ab cd').morse, '.- / -... // -.-. / -..')
  assert.equal(textToMorse('a!!   b').text, 'A B')
})

test('morseToText is the inverse, and unknown letters are "?"', () => {
  assert.equal(morseToText('... / --- / ...').text, 'SOS')
  assert.equal(morseToText('.- / -... // -.-. / -..').text, 'AB CD')
  assert.equal(morseToText('.- / ......... / -').text, 'A?T')
})

test('pulses: dot 1, dash 3, gaps 1 / 3 / 7', () => {
  assert.deepEqual(morseToPulses('.-'), [
    { on: true, units: 1 },
    { on: false, units: 1 },
    { on: true, units: 3 },
  ])
  assert.deepEqual(morseToPulses('. / .'), [
    { on: true, units: 1 },
    { on: false, units: 3 },
    { on: true, units: 1 },
  ])
  assert.deepEqual(morseToPulses('. // .'), [
    { on: true, units: 1 },
    { on: false, units: 7 },
    { on: true, units: 1 },
  ])
})

test('pulses: PARIS lasts 50 units (with the word gap that follows it)', () => {
  const paris = textToMorse('paris').morse
  assert.equal(total(paris) + 7, 50)
})

test('pulses: nothing to play, no leading or trailing silence', () => {
  assert.deepEqual(morseToPulses(''), [])
  assert.deepEqual(morseToPulses('? / ?'), [])
  const pulses = morseToPulses('// . / / . //')
  assert.equal(pulses[0].on, true)
  assert.equal(pulses.at(-1)?.on, true)
  assert.equal(pulses.length, 3)
})

test('unitMs follows the PARIS standard', () => {
  assert.equal(unitMs(10), 120)
  assert.equal(unitMs(20), 60)
})
