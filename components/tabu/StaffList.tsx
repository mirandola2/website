'use client'

import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import { ArrowCounterClockwiseIcon, DotsSixVerticalIcon, FloppyDiskIcon } from '@phosphor-icons/react'
import type { ActionResult } from './types'

export interface StaffListRow {
  // Member code
  id: string
  // The collapsed line (avatar, name, badges) and what opening the row shows (form, photo, delete):
  // both rendered on the server
  summary: ReactNode
  content: ReactNode
}

type Mode = 'main' | 'coca'

interface StaffListProps {
  // Every row, in the main order
  rows: StaffListRow[]
  // The leaders, in the Co.Ca. page order
  cocaIds: string[]
  // The Co.Ca. page has an order of its own
  cocaCustom: boolean
  saveOrder: (kind: Mode, ids: string[]) => Promise<ActionResult>
  resetCocaOrder: () => Promise<ActionResult>
}

function move<T>(list: T[], from: number, to: number) {
  const next = [...list]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

// The staff rows of /tabu/admin/staff. "Ordina" turns the same rows into a drag and drop list
// (the whole row with the mouse, the handle on touch screens, arrow keys on the focused handle)
// for the main order or the Co.Ca. page one, saved all at once.
export default function StaffList({ rows, cocaIds, cocaCustom, saveOrder, resetCocaOrder }: StaffListProps) {
  const [mode, setMode] = useState<Mode | null>(null)
  const [ids, setIds] = useState<string[]>([])
  const [dragging, setDragging] = useState<string | null>(null)
  const [result, setResult] = useState<ActionResult>(null)
  const [pending, startTransition] = useTransition()
  const rowRefs = useRef(new Map<string, HTMLLIElement>())
  const byId = new Map(rows.map(r => [r.id, r]))
  const savedIds = mode === 'coca' ? cocaIds : rows.map(r => r.id)
  const changed = ids.some((id, i) => id !== savedIds[i])

  function start(next: Mode) {
    setMode(next)
    setIds(next === 'coca' ? cocaIds : rows.map(r => r.id))
    setResult(null)
  }

  // While dragging: the row swaps with a neighbour once the pointer passes its middle. Listening on
  // the window keeps the drag alive while the rows move under the pointer.
  useEffect(() => {
    if (dragging === null) return
    const onMove = (e: PointerEvent) =>
      setIds(current => {
        const from = current.indexOf(dragging)
        const rect = (i: number) => (current[i] === undefined ? null : rowRefs.current.get(current[i])?.getBoundingClientRect())
        const above = rect(from - 1)
        const below = rect(from + 1)
        if (above && e.clientY < above.top + above.height / 2) return move(current, from, from - 1)
        if (below && e.clientY > below.top + below.height / 2) return move(current, from, from + 1)
        return current
      })
    const onUp = () => setDragging(null)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragging])

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const to = e.key === 'ArrowUp' ? index - 1 : e.key === 'ArrowDown' ? index + 1 : null
    if (to === null || to < 0 || to >= ids.length) return
    e.preventDefault()
    setIds(move(ids, index, to))
    // Keep the focus on the moved row's handle
    requestAnimationFrame(() => rowRefs.current.get(ids[index])?.querySelector('button')?.focus())
  }

  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      const res = await action()
      setResult(res)
      if (res?.ok) setMode(null)
    })
  }

  const status = result && !pending && (
    <span role="status" className={`text-sm ${result.ok ? 'text-success' : 'text-error'}`}>
      {result.message}
    </span>
  )

  if (!mode) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm opacity-70">Ordina:</span>
          <div className="join">
            <button type="button" className="btn btn-sm btn-outline join-item" onClick={() => start('main')}>
              Generale
            </button>
            <button type="button" className="btn btn-sm btn-outline join-item" onClick={() => start('coca')}>
              Co.Ca.
            </button>
          </div>
          {cocaCustom && <span className="badge badge-ghost badge-sm">la pagina Co.Ca. ha un ordine suo</span>}
          {status}
        </div>
        <ul className="space-y-2">
          {rows.map(row => (
            <li key={row.id}>
              <details className="collapse collapse-arrow bg-base-200">
                <summary className="collapse-title flex items-center gap-3">{row.summary}</summary>
                <div className="collapse-content space-y-6">{row.content}</div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="sticky top-16 z-10 flex flex-wrap items-center gap-2 rounded-box bg-base-100 py-2">
        <span className="font-bold">{mode === 'main' ? 'Ordine generale' : 'Ordine della pagina Co.Ca.'}</span>
        <span className="text-sm opacity-70">
          {mode === 'main'
            ? 'Vale per tutte le pagine dello staff e per Tutti i progetti.'
            : 'Solo i capi, solo nella pagina Co.Ca.: chi viene aggiunto dopo compare in fondo.'}{' '}
          Trascina le righe, o usa le frecce sulla maniglia.
        </span>
        <div className="flex flex-wrap gap-2 w-full">
          <button type="button" className="btn btn-primary btn-sm" disabled={!changed || pending} onClick={() => run(() => saveOrder(mode, ids))}>
            {pending ? <span className="loading loading-spinner loading-xs" /> : <FloppyDiskIcon size={16} weight="bold" aria-hidden />}
            Salva ordine
          </button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => setMode(null)}>
            Annulla
          </button>
          {mode === 'coca' && cocaCustom && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={pending}
              onClick={() => window.confirm('La pagina Co.Ca. tornerà a usare l’ordine generale. Continuare?') && run(resetCocaOrder)}
            >
              <ArrowCounterClockwiseIcon size={16} weight="bold" aria-hidden />
              Torna all’ordine generale
            </button>
          )}
          {status}
        </div>
      </div>
      <ol className="space-y-2">
        {ids.map((id, index) => (
          <li
            key={id}
            ref={el => {
              if (el) rowRefs.current.set(id, el)
              else rowRefs.current.delete(id)
            }}
            className={`flex items-center gap-3 rounded-box bg-base-200 px-2 py-3 select-none cursor-grab active:cursor-grabbing ${dragging === id ? 'shadow-lg ring-2 ring-primary' : ''}`}
            onPointerDown={e => {
              // On touch screens only the handle drags, so the page can still scroll
              if (e.pointerType !== 'mouse') return
              e.preventDefault()
              setDragging(id)
            }}
          >
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square touch-none"
              aria-label="Sposta (frecce su e giù)"
              onPointerDown={e => {
                e.preventDefault()
                e.stopPropagation()
                setDragging(id)
              }}
              onKeyDown={e => onKeyDown(e, index)}
            >
              <DotsSixVerticalIcon size={20} weight="bold" aria-hidden />
            </button>
            <span className="w-6 text-right text-sm opacity-50">{index + 1}</span>
            <span className="flex flex-wrap items-center gap-3">{byId.get(id)?.summary}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
