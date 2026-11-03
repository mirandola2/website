// Plays Morse pulses (lib/morse.ts) as a tone or with the phone's torch.
// Browser only. Everything that needs a user gesture (the audio context, the camera permission for
// the torch) is created in `playMorse`, which must be called from a click handler.

import type { Pulse } from './morse'

export interface MorseOutputs {
  sound: boolean
  torch: boolean
}

export interface MorsePlayback {
  // Resolves when the message has been played or `stop` was called
  done: Promise<void>
  stop: () => void
  // What could not be used (e.g. no torch on this device), and why, to tell the user
  warnings: string[]
}

const TONE_HZ = 600
// Short ramps on the tone: an abrupt start and stop makes an audible click
const RAMP_S = 0.005

interface Torch {
  set: (on: boolean) => void
  release: () => void
}

// The torch is a camera constraint: it needs a video stream, so the camera permission is asked
// (Chrome on Android). iOS Safari and desktop browsers have no torch. On failure the reason is
// returned, because it is not always the device: the camera is only available on HTTPS pages or
// on localhost, so a phone opening the dev server by its LAN address (http://192.168.x.x) never gets it.
async function openTorch(): Promise<Torch | string> {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    return 'La torcia richiede una pagina HTTPS (o localhost): questa non è un contesto sicuro, quindi il browser non dà accesso alla fotocamera.'
  }
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
  } catch (error) {
    const name = error instanceof DOMException ? error.name : ''
    return name === 'NotAllowedError'
      ? 'Permesso della fotocamera negato: la torcia ne ha bisogno. Consentilo dalle impostazioni del sito.'
      : `Fotocamera non disponibile${name ? ` (${name})` : ''}.`
  }
  const track = stream.getVideoTracks()[0]
  const capabilities = (track?.getCapabilities?.() ?? {}) as { torch?: boolean }
  if (!capabilities.torch) {
    stream.getTracks().forEach(t => t.stop())
    return 'Questo browser o dispositivo non permette di accendere la torcia (serve Chrome su Android con un flash).'
  }
  return {
    set: on => {
      // Fire and forget: a failure on one pulse must not stop the message
      track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] }).catch(() => {})
    },
    release: () => {
      track.applyConstraints({ advanced: [{ torch: false } as MediaTrackConstraintSet] }).catch(() => {})
      stream.getTracks().forEach(t => t.stop())
    },
  }
}

export async function playMorse(
  pulses: Pulse[],
  unitMs: number,
  outputs: MorseOutputs,
): Promise<MorsePlayback> {
  const warnings: string[] = []

  // The audio context is created first, synchronously with the click: iOS only allows it there
  let audio: AudioContext | null = null
  let gain: GainNode | null = null
  if (outputs.sound) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Ctx) {
      audio = new Ctx()
      void audio.resume()
      gain = audio.createGain()
      gain.gain.value = 0
      const osc = audio.createOscillator()
      osc.frequency.value = TONE_HZ
      osc.connect(gain).connect(audio.destination)
      osc.start()
    } else {
      warnings.push('Il suono non è supportato da questo browser.')
    }
  }

  let torch: Torch | null = null
  if (outputs.torch) {
    const opened = await openTorch()
    if (typeof opened === 'string') warnings.push(opened)
    else torch = opened
  }

  let stopped = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let finish: () => void = () => {}
  const done = new Promise<void>(resolve => {
    finish = resolve
  })

  const setLight = (on: boolean) => torch?.set(on)

  function cleanup() {
    clearTimeout(timer)
    setLight(false)
    torch?.release()
    if (audio && gain) {
      const t = audio.currentTime
      gain.gain.cancelScheduledValues(t)
      gain.gain.setTargetAtTime(0, t, RAMP_S)
      // Let the release ramp finish before closing
      setTimeout(() => void audio?.close(), 100)
    }
    finish()
  }

  // The tone is scheduled on the audio clock (sample accurate, immune to timer jitter); the torch
  // follows with timers aimed at absolute times, so that the delays do not add up.
  const t0 = audio ? audio.currentTime + 0.05 : 0
  const startedAt = performance.now() + 50
  let elapsed = 0
  pulses.forEach(({ on, units }) => {
    const duration = units * unitMs
    if (on && audio && gain) {
      const start = t0 + elapsed / 1000
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(1, start + RAMP_S)
      gain.gain.setValueAtTime(1, start + duration / 1000 - RAMP_S)
      gain.gain.linearRampToValueAtTime(0, start + duration / 1000)
    }
    elapsed += duration
  })
  const total = elapsed

  let index = 0
  let at = 0
  const step = () => {
    if (stopped) return
    if (index >= pulses.length) {
      cleanup()
      return
    }
    const { on, units } = pulses[index++]
    setLight(on)
    at += units * unitMs
    timer = setTimeout(step, Math.max(0, startedAt + at - performance.now()))
  }
  if (torch) {
    timer = setTimeout(step, Math.max(0, startedAt - performance.now()))
  } else {
    // Sound only: the audio clock already has everything, just wait for the end
    timer = setTimeout(cleanup, total + 150)
  }

  return {
    done,
    warnings,
    stop: () => {
      if (stopped) return
      stopped = true
      cleanup()
    },
  }
}
