'use client'

import { startTransition, useActionState, useEffect, useRef, useState } from 'react'
import { FloppyDiskIcon, PencilSimpleIcon, WarningIcon } from '@phosphor-icons/react'
import { confirmLeave, isDirty, setDirty, UNSAVED_MESSAGE } from '@/lib/unsaved-changes'
import type { ActionResult } from './types'

interface ProjectFormProps {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  // false for years that are no longer active: only the read-only view
  editable: boolean
  // A saved project opens read-only: "Modifica" shows the fields, saving goes back to the view
  saved: boolean
  // The saved "Bozza" flag: the toggle's starting value
  draft: boolean
  // The read-only project (<ProjectView>), shown whenever the fields aren't
  view: React.ReactNode
  // The fields
  children: React.ReactNode
}

// The "Il mio progetto" form: tracks unsaved changes and warns before leaving the page, whether
// by a link, the browser's Back button, a reload or closing the tab.
export default function ProjectForm({ action, editable, saved, draft, view, children }: ProjectFormProps) {
  const [changed, setChanged] = useState(false)
  const [unlocked, setUnlocked] = useState(!saved)
  const editing = editable && unlocked
  const [result, formAction, pending] = useActionState(async (prev: ActionResult, formData: FormData) => {
    const res = await action(prev, formData)
    if (res?.ok) {
      setChanged(false)
      setDirty(false)
      setUnlocked(false)
    }
    return res
  }, null)
  // A copy of the current history entry, pushed on the first change: Back then lands on it
  // (same page) and popstate can ask before really leaving
  const guardPushed = useRef(false)

  function markChanged() {
    if (!editing || changed) return
    setChanged(true)
    setDirty(true)
    if (!guardPushed.current) {
      history.pushState(history.state, '', location.href)
      guardPushed.current = true
    }
  }

  function cancel() {
    if (!confirmLeave()) return
    // Unmounting the fields drops what was typed: they come back with the saved values
    setChanged(false)
    setUnlocked(false)
  }

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty()) e.preventDefault()
    }
    // Capture phase on the document: runs before Next's <Link> handler and can stop it
    function onClick(e: MouseEvent) {
      const link = (e.target as Element | null)?.closest?.('a[href]')
      if (!link || link.getAttribute('target') === '_blank' || e.defaultPrevented) return
      if (!confirmLeave()) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    function onPopState() {
      if (!guardPushed.current) return
      if (!isDirty()) {
        guardPushed.current = false
        history.back()
        return
      }
      if (window.confirm(UNSAVED_MESSAGE)) {
        setDirty(false)
        guardPushed.current = false
        history.back()
      } else {
        history.pushState(history.state, '', location.href)
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPopState)
      setDirty(false)
    }
  }, [])

  return (
    <form
      action={formAction}
      onInput={markChanged}
      onSubmit={e => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        startTransition(() => formAction(data))
      }}
    >
      {editing ? children : view}
      {editable && !unlocked && (
        <div className="sticky bottom-0 z-10 mt-4 -mx-4 px-4 py-3 bg-base-100/95 backdrop-blur border-t border-base-300 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary" onClick={() => setUnlocked(true)}>
            <PencilSimpleIcon size={18} weight="bold" aria-hidden />
            Modifica
          </button>
          {result?.ok ? (
            <span role="status" className="text-sm text-success">
              {result.message}
            </span>
          ) : (
            <span className="text-sm opacity-70">Premi Modifica per cambiare il progetto.</span>
          )}
        </div>
      )}
      {editing && (
        <div className="sticky bottom-0 z-10 mt-4 -mx-4 px-4 py-3 bg-base-100/95 backdrop-blur border-t border-base-300 flex flex-wrap items-center gap-3">
          {/* Read by saveYearProject; a change counts as unsaved like the fields (onInput) */}
          <label className="flex w-full cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" name="draft" defaultChecked={draft} className="toggle toggle-sm toggle-warning" />
            Bozza
            <span className="opacity-60">(gli altri capi lo vedono tra chi deve ancora finire)</span>
          </label>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? <span className="loading loading-spinner loading-xs" /> : <FloppyDiskIcon size={18} weight="bold" aria-hidden />}
            Salva progetto
          </button>
          {saved && (
            <button type="button" className="btn btn-ghost" onClick={cancel} disabled={pending}>
              Annulla
            </button>
          )}
          {changed && !pending ? (
            <span role="status" className="flex items-center gap-1 text-sm text-warning-content bg-warning/30 rounded-field px-2 py-1">
              <WarningIcon size={16} weight="bold" aria-hidden />
              Attenzione: modifiche non salvate
            </span>
          ) : (
            result &&
            !pending && (
              <span role="status" className={`text-sm ${result.ok ? 'text-success' : 'text-error'}`}>
                {result.message}
              </span>
            )
          )}
        </div>
      )}
    </form>
  )
}
