'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ActionResult } from './types'

interface DeleteButtonProps {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  id: number
  // Shown in a confirm() dialog before deleting
  confirm: string
  // Where to go once deleted (the edit URL points to a row that no longer exists)
  redirectTo: string
}

// A delete button that can sit in another form's button row: it calls the action itself instead
// of submitting a nested form (not valid HTML)
export default function DeleteButton({ action, id, confirm, redirectTo }: DeleteButtonProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <>
      <button
        type="button"
        className="btn btn-error btn-outline"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(confirm)) return
          const data = new FormData()
          data.set('id', String(id))
          startTransition(async () => {
            const result = await action(null, data)
            if (result?.ok) router.replace(redirectTo)
            else setError(result?.message ?? 'Errore.')
          })
        }}
      >
        {pending && <span className="loading loading-spinner loading-xs" />}
        Elimina
      </button>
      {error && !pending && (
        <span role="status" className="text-sm text-error">
          {error}
        </span>
      )}
    </>
  )
}
