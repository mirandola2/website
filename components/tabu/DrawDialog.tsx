'use client'

import { startTransition, useActionState, useEffect, useRef, useState } from 'react'
import { PlusIcon, XIcon } from '@phosphor-icons/react'
import StaffAvatar from './StaffAvatar'
import type { ActionResult } from './types'

export interface DrawCandidate {
  memberCode: string
  nome: string
  img: string | null
  // Without an email the leader can't log in, so can't see their draw: listed but not selectable
  canLogin: boolean
}

interface DrawDialogProps {
  candidates: DrawCandidate[]
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
}

// "Nuovo sorteggio": the title and the participants, all the leaders who can log in ticked at first.
// The admin only ever sees how many take part, never the result.
export default function DrawDialog({ candidates, action }: DrawDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const selectable = candidates.filter(c => c.canLogin).map(c => c.memberCode)
  const [checked, setChecked] = useState(() => new Set(selectable))
  const [result, formAction, pending] = useActionState(action, null)
  // A new form every time the dialog opens (title emptied, everyone ticked again)
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    if (result?.ok) dialogRef.current?.close()
  }, [result])

  function open() {
    setChecked(new Set(selectable))
    setFormKey(k => k + 1)
    dialogRef.current?.showModal()
  }

  function toggle(code: string, on: boolean) {
    setChecked(prev => {
      const next = new Set(prev)
      if (on) next.add(code)
      else next.delete(code)
      return next
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={open} aria-haspopup="dialog">
          <PlusIcon size={18} weight="bold" aria-hidden />
          Nuovo sorteggio
        </button>
        {result && !pending && (
          <span role="status" className={`text-sm ${result.ok ? 'text-success' : 'text-error'}`}>
            {result.message}
          </span>
        )}
      </div>

      {/* pt-26: the box is centred below the sticky navbar (two rows on small screens), never under it */}
      <dialog ref={dialogRef} className="modal pt-26" aria-label="Nuovo sorteggio">
        <div className="modal-box w-11/12 max-w-2xl max-h-[calc(100dvh-8rem)]">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Chiudi">
              <XIcon size={18} weight="bold" aria-hidden />
            </button>
          </form>
          <h2 className="font-bold text-xl mb-2">Nuovo sorteggio</h2>
          <form
            key={formKey}
            onSubmit={e => {
              e.preventDefault()
              if (checked.size < 2) return
              if (!window.confirm(`Fare il sorteggio tra ${checked.size} capi? Il risultato non si potrà vedere né cambiare: per rifarlo serve un sorteggio nuovo.`)) return
              const data = new FormData(e.currentTarget)
              startTransition(() => formAction(data))
            }}
          >
            <label className="fieldset">
              <span className="fieldset-legend">Titolo</span>
              <input name="title" required maxLength={100} className="input w-full" placeholder="Es. Uscita di Co.Ca. di maggio" />
              <span className="label whitespace-normal">I capi lo vedono insieme alla data</span>
            </label>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">
                Partecipanti: {checked.size}
                <span className="font-normal opacity-70">togli la spunta a chi non partecipa</span>
              </legend>
              <ul className="grid gap-1 sm:grid-cols-2">
                {candidates.map(c => (
                  <li key={c.memberCode}>
                    <label className={`flex items-center gap-2 rounded-field p-1 ${c.canLogin ? 'cursor-pointer hover:bg-base-200' : 'opacity-50'}`}>
                      <input
                        type="checkbox"
                        name="participants"
                        value={c.memberCode}
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={checked.has(c.memberCode)}
                        disabled={!c.canLogin}
                        onChange={e => toggle(c.memberCode, e.target.checked)}
                      />
                      <StaffAvatar img={c.img} name={c.nome} size={28} />
                      <span className="leading-tight">
                        {c.nome}
                        {!c.canLogin && <span className="block text-xs">senza accesso, non può vedere il risultato</span>}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button type="submit" className="btn btn-primary" disabled={pending || checked.size < 2}>
                {pending && <span className="loading loading-spinner loading-xs" />}
                Fai il sorteggio
              </button>
              {checked.size < 2 && <span className="text-sm opacity-70">Servono almeno 2 partecipanti.</span>}
              {result && !result.ok && !pending && (
                <span role="status" className="text-sm text-error">
                  {result.message}
                </span>
              )}
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label="Chiudi">chiudi</button>
        </form>
      </dialog>
    </>
  )
}
