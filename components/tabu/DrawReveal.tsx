'use client'

import { useRef, useState, useTransition } from 'react'
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react'
import { revealAssignment, type RevealResult } from '@/app/tabu/(riservato)/sorteggio/actions'
import StaffAvatar from './StaffAvatar'

const CONFETTI_COLORS = ['#FFBE0A', '#559928', '#D24D41', '#9B66A5', '#462678']

// The leader's draw, asked to the server only on click: it is never in the page's HTML, and it
// is gone again on "Nascondi" or a reload (nobody reads it over their shoulder).
export default function DrawReveal({ drawId }: { drawId: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [result, setResult] = useState<RevealResult | null>(null)
  const [pending, startTransition] = useTransition()

  function reveal() {
    startTransition(async () => {
      const next = await revealAssignment(drawId)
      setResult(next)
      if (!next.ok || !ref.current) return
      const { default: confetti } = await import('canvas-confetti')
      const r = ref.current.getBoundingClientRect()
      confetti({
        particleCount: 90,
        spread: 75,
        startVelocity: 32,
        origin: { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + 20) / window.innerHeight },
        colors: CONFETTI_COLORS,
        zIndex: 60,
        disableForReducedMotion: true,
      })
    })
  }

  return (
    <div ref={ref} className="space-y-3">
      {result?.ok ? (
        <>
          <div className="flex items-center gap-3" aria-live="polite">
            <StaffAvatar img={result.img} name={result.nome} size={64} />
            <div>
              <p className="text-sm opacity-70">Ti è toccato</p>
              <p className="text-2xl font-bold">{result.nome}</p>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setResult(null)}>
            <EyeSlashIcon size={16} weight="bold" aria-hidden />
            Nascondi
          </button>
        </>
      ) : (
        <>
          <button type="button" className="btn btn-primary" onClick={reveal} disabled={pending}>
            {pending ? <span className="loading loading-spinner loading-xs" /> : <EyeIcon size={18} weight="bold" aria-hidden />}
            Scopri chi ti è toccato
          </button>
          {result && !result.ok && (
            <p role="status" className="text-sm text-error">
              {result.message}
            </p>
          )}
        </>
      )}
    </div>
  )
}
