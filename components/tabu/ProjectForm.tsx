'use client'

import { startTransition, useActionState, useEffect, useRef, useState } from 'react'
import { FloppyDiskIcon, WarningIcon } from '@phosphor-icons/react'
import { confirmLeave, isDirty, setDirty, UNSAVED_MESSAGE } from '@/lib/unsaved-changes'
import type { ActionResult } from './types'

interface ProjectFormProps {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  // false for years that are no longer active: every field is disabled
  editable: boolean
  children: React.ReactNode
}

// The "Il mio progetto" form: tracks unsaved changes and warns before leaving the page, whether
// by a link, the browser's Back button, a reload or closing the tab.
export default function ProjectForm({ action, editable, children }: ProjectFormProps) {
  const [changed, setChanged] = useState(false)
  const [result, formAction, pending] = useActionState(async (prev: ActionResult, formData: FormData) => {
    const res = await action(prev, formData)
    if (res?.ok) {
      setChanged(false)
      setDirty(false)
    }
    return res
  }, null)
  // A copy of the current history entry, pushed on the first change: Back then lands on it
  // (same page) and popstate can ask before really leaving
  const guardPushed = useRef(false)

  function markChanged() {
    if (!editable || changed) return
    setChanged(true)
    setDirty(true)
    if (!guardPushed.current) {
      history.pushState(history.state, '', location.href)
      guardPushed.current = true
    }
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
      <fieldset disabled={!editable} className="contents">
        {children}
      </fieldset>
      {editable && (
        <div className="sticky bottom-0 z-10 mt-4 -mx-4 px-4 py-3 bg-base-100/95 backdrop-blur border-t border-base-300 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? <span className="loading loading-spinner loading-xs" /> : <FloppyDiskIcon size={18} weight="bold" aria-hidden />}
            Salva progetto
          </button>
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
