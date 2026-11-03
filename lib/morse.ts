// International Morse code: the translation both ways and the timing used to play it as sound or
// light. Free of browser APIs (the player is in morse-output.ts) so it can be tested.

const morseDict: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---',
  P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-',
  W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  ' ': ' ',
}

const textDict: Record<string, string> = {}
for (const [k, v] of Object.entries(morseDict)) {
  textDict[v] = k
}

// Message → Morse: letters are separated by " / " and words by " // ". Characters outside A–Z and
// 0–9 are dropped; `text` is the message as it was understood.
export function textToMorse(raw: string): { text: string; morse: string } {
  const text = raw.toUpperCase().replace(/[^ A-Z0-9]/g, '').replace(/  +/g, ' ')
  const words = text.split(' ').map(word => word.split('').map(l => morseDict[l] || '?').join(' / '))
  return { text, morse: words.join(' // ') }
}

// Morse → message: the inverse; unknown letters become "?"
export function morseToText(raw: string): { text: string; morse: string } {
  const morse = raw.toUpperCase().replace(/[^ \n./-]/g, '')
  const words = morse.split('//').map(word =>
    word
      .split('/')
      .map(l => textDict[l.trim()] || '?')
      .join(''),
  )
  return { text: words.join(' ').trim(), morse }
}

// A stretch of the signal: key down (`on`) or up, lasting `units` dot lengths
export interface Pulse {
  on: boolean
  units: number
}

// The standard timing (ITU-R M.1677): dot 1 unit, dash 3, 1 unit of silence between the signals of
// a letter, 3 between letters, 7 between words. Anything that is not a dot or a dash is ignored
// (a "?" for an unknown letter has no sound), and so are empty letters and words.
export function morseToPulses(morse: string): Pulse[] {
  const pulses: Pulse[] = []
  const gap = (units: number) => {
    // A pause only makes sense after a signal
    if (pulses.length) pulses.push({ on: false, units })
  }
  const words = morse
    .split('//')
    .map(word =>
      word
        .split('/')
        .map(letter => letter.replace(/[^.-]/g, ''))
        .filter(Boolean),
    )
    .filter(letters => letters.length)

  words.forEach((letters, w) => {
    if (w > 0) gap(7)
    letters.forEach((letter, l) => {
      if (l > 0) gap(3)
      ;[...letter].forEach((signal, s) => {
        if (s > 0) gap(1)
        pulses.push({ on: true, units: signal === '.' ? 1 : 3 })
      })
    })
  })
  return pulses
}

// "Words per minute" is defined by the word PARIS, which lasts 50 units: one unit is 1200 / wpm ms
export const unitMs = (wpm: number) => 1200 / wpm

export const MIN_WPM = 0.5
export const MAX_WPM = 20
export const WPM_STEP = 0.5
export const DEFAULT_WPM = 10
