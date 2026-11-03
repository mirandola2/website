'use client'

import { useEffect, useRef, useState } from 'react'
import { PlayIcon, StopIcon } from '@phosphor-icons/react'
import { DEFAULT_WPM, MAX_WPM, MIN_WPM, WPM_STEP, morseToPulses, morseToText, textToMorse, unitMs } from '@/lib/morse'
import { playMorse, type MorseOutputs, type MorsePlayback } from '@/lib/morse-output'

export default function Morse() {
  const [mexText, setMexText] = useState('')
  const [mexMorse, setMexMorse] = useState('')
  const [wpm, setWpm] = useState(DEFAULT_WPM)
  const [outputs, setOutputs] = useState<MorseOutputs>({ sound: true, torch: false })
  const [playing, setPlaying] = useState(false)
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const playback = useRef<MorsePlayback | null>(null)
  const collapse = useRef<HTMLDivElement>(null)

  const pulses = morseToPulses(mexMorse)
  const canPlay = pulses.length > 0 && (outputs.sound || outputs.torch)

  function text2morse(raw: string) {
    const { text, morse } = textToMorse(raw)
    setMexText(text)
    setMexMorse(morse)
  }

  function morse2text(raw: string) {
    const { text, morse } = morseToText(raw)
    setMexText(text)
    setMexMorse(morse)
  }

  function stop() {
    playback.current?.stop()
  }

  async function play() {
    if (playing || !canPlay) return
    setNotice('')
    setPlaying(true)
    try {
      const current = await playMorse(pulses, unitMs(wpm), outputs)
      playback.current = current
      if (current.warnings.length) setNotice(current.warnings.join(' '))
      await current.done
    } finally {
      playback.current = null
      setPlaying(false)
    }
  }

  // Leaving the page must not leave the torch or the camera on
  useEffect(() => () => playback.current?.stop(), [])

  // The panel closes on a click outside it, but not while playing: its Stop button must stay there
  useEffect(() => {
    if (!open || playing) return
    const onPointerDown = (e: PointerEvent) => {
      if (!collapse.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, playing])

  const toggle = (key: keyof MorseOutputs) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setOutputs(o => ({ ...o, [key]: e.target.checked }))

  return (
    <div className="card not-prose lg:float-right my-5 lg:m-5 w-full lg:w-96 bg-neutral">
      <div className="card-body">
        <h2 className="card-title">Traduttore Morse</h2>
        <p>
          Scrivi un messaggio qui sotto per tradurlo! Puoi anche tradurre direttamente dal codice morse,
          separando le lettere con <strong>/</strong> e le parole con <strong>{'//'}</strong>.
        </p>
        <textarea
          className="textarea w-full bg-base-200 h-24 font-mono"
          placeholder="Messaggio (SOS)"
          value={mexText}
          onChange={e => text2morse(e.target.value)}
        />
        <textarea
          className="textarea w-full bg-base-200 h-24 font-mono"
          placeholder="Codice Morse (... / --- / ...)"
          value={mexMorse}
          onChange={e => morse2text(e.target.value)}
        />

        <div ref={collapse} className="collapse collapse-arrow bg-base-200">
          <input type="checkbox" checked={open} onChange={e => setOpen(e.target.checked)} aria-label="Mostra le opzioni di riproduzione" />
          <div className="collapse-title font-bold">Riproduci (sperimentale)</div>
          <div className="collapse-content space-y-3">
            <p className="text-sm opacity-70">
              Trasmette il codice Morse con il suono e, su Android con Chrome, con la torcia del telefono.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <label className="label cursor-pointer gap-2 text-black">
                <input type="checkbox" className="checkbox checkbox-sm" checked={outputs.sound} onChange={toggle('sound')} disabled={playing} />
                Suono
              </label>
              <label className="label cursor-pointer gap-2 text-black">
                <input type="checkbox" className="checkbox checkbox-sm" checked={outputs.torch} onChange={toggle('torch')} disabled={playing} />
                Torcia
              </label>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <span className="shrink-0">Velocità</span>
              <input
                type="range"
                className="range range-xs range-primary"
                min={MIN_WPM}
                max={MAX_WPM}
                step={WPM_STEP}
                value={wpm}
                onChange={e => setWpm(Number(e.target.value))}
                disabled={playing}
              />
              <span className="w-16 shrink-0 text-end tabular-nums">{wpm} wpm</span>
            </label>
            <button
              type="button"
              className={`btn w-full ${playing ? 'btn-secondary' : 'btn-primary'}`}
              onClick={playing ? stop : play}
              disabled={!playing && !canPlay}
            >
              {playing ? <StopIcon size={20} weight="fill" aria-hidden /> : <PlayIcon size={20} weight="fill" aria-hidden />}
              {playing ? 'Ferma' : 'Riproduci'}
            </button>
            {notice && (
              <p className="text-sm text-error" role="status">
                {notice}
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
