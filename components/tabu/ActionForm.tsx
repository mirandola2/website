'use client'

import { startTransition, useActionState } from 'react'
import type { ActionResult } from './types'

interface ActionFormProps {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  children: React.ReactNode
  submitLabel?: string
  // Shown in a confirm() dialog before submitting (deletions)
  confirm?: string
  className?: string
  buttonClassName?: string
  // More buttons on the same row, after the submit one (Annulla, <DeleteButton>)
  extraActions?: React.ReactNode
}

// A form bound to a server action, with a pending state and the action's message
export default function ActionForm({
  action,
  children,
  submitLabel = 'Salva',
  confirm,
  className = '',
  buttonClassName = 'btn btn-primary',
  extraActions,
}: ActionFormProps) {
  const [result, formAction, pending] = useActionState(action, null)

  return (
    <form
      action={formAction}
      className={className}
      // Submit through a transition instead of the native action: React resets a form after its
      // action runs, which would wipe what was typed when the save fails
      onSubmit={e => {
        e.preventDefault()
        if (confirm && !window.confirm(confirm)) return
        const data = new FormData(e.currentTarget)
        startTransition(() => formAction(data))
      }}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <button type="submit" className={buttonClassName} disabled={pending}>
          {pending && <span className="loading loading-spinner loading-xs" />}
          {submitLabel}
        </button>
        {extraActions}
        {result && !pending && (
          <span role="status" className={`text-sm ${result.ok ? 'text-success' : 'text-error'}`}>
            {result.message}
          </span>
        )}
      </div>
    </form>
  )
}
