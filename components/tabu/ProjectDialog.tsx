'use client'

import { useRef } from 'react'
import { XIcon } from '@phosphor-icons/react'

// A card that opens the full project in a modal (daisyUI modal on a native <dialog>)
export default function ProjectDialog({ trigger, title, children }: { trigger: React.ReactNode; title: string; children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        type="button"
        className="card bg-base-200 w-full text-left transition-shadow hover:shadow-md cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup="dialog"
      >
        {trigger}
      </button>
      <dialog ref={dialogRef} className="modal" aria-label={title}>
        <div className="modal-box w-11/12 max-w-4xl">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Chiudi">
              <XIcon size={18} weight="bold" aria-hidden />
            </button>
          </form>
          {children}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label="Chiudi">chiudi</button>
        </form>
      </dialog>
    </>
  )
}
