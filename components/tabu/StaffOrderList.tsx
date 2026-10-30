'use client'

import { useRef, useState, useTransition } from 'react'
import { DotsSixVerticalIcon, FloppyDiskIcon } from '@phosphor-icons/react'
import StaffAvatar from './StaffAvatar'
import type { ActionResult } from './types'

export interface OrderItem {
  id: number
  nome: string
  img: string | null
  staff: string
}

interface StaffOrderListProps {
  items: OrderItem[]
  // Receives the ids in the new order
  save: (ids: number[]) => Promise<ActionResult>
}

function move<T>(list: T[], from: number, to: number) {
  const next = [...list]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

// Drag and drop list (mouse and touch, through pointer events on the handle; arrow keys on the
// focused handle), saved all at once with "Salva ordine"
export default function StaffOrderList({ items: initial, save }: StaffOrderListProps) {
  const [items, setItems] = useState(initial)
  // Rows changed on the server (saved order, edited or added person): start over from them
  const initialKey = JSON.stringify(initial)
  const [seenKey, setSeenKey] = useState(initialKey)
  if (seenKey !== initialKey) {
    setSeenKey(initialKey)
    setItems(initial)
  }
  const [dragging, setDragging] = useState<number | null>(null)
  const [result, setResult] = useState<ActionResult>(null)
  const [pending, startTransition] = useTransition()
  const rowRefs = useRef(new Map<number, HTMLLIElement>())
  const changed = items.some((item, i) => item.id !== initial[i]?.id)

  function reorder(next: OrderItem[]) {
    setItems(next)
    setResult(null)
  }

  // While dragging: the row swaps with a neighbour once the pointer passes its middle
  function onPointerMove(e: React.PointerEvent) {
    if (dragging === null) return
    const from = items.findIndex(i => i.id === dragging)
    const above = items[from - 1] && rowRefs.current.get(items[from - 1].id)?.getBoundingClientRect()
    const below = items[from + 1] && rowRefs.current.get(items[from + 1].id)?.getBoundingClientRect()
    if (above && e.clientY < above.top + above.height / 2) reorder(move(items, from, from - 1))
    else if (below && e.clientY > below.top + below.height / 2) reorder(move(items, from, from + 1))
  }

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const to = e.key === 'ArrowUp' ? index - 1 : e.key === 'ArrowDown' ? index + 1 : null
    if (to === null || to < 0 || to >= items.length) return
    e.preventDefault()
    reorder(move(items, index, to))
    // Keep the focus on the moved row's handle
    requestAnimationFrame(() => rowRefs.current.get(items[index].id)?.querySelector('button')?.focus())
  }

  return (
    <div className="space-y-3">
      <ol className="space-y-1">
        {items.map((item, index) => (
          <li
            key={item.id}
            ref={el => {
              if (el) rowRefs.current.set(item.id, el)
              else rowRefs.current.delete(item.id)
            }}
            className={`flex items-center gap-3 rounded-field bg-base-100 px-2 py-1 ${dragging === item.id ? 'shadow-lg ring-2 ring-primary' : ''}`}
          >
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square cursor-grab touch-none active:cursor-grabbing"
              aria-label={`Sposta ${item.nome} (frecce su e giù)`}
              onPointerDown={e => {
                e.currentTarget.setPointerCapture(e.pointerId)
                setDragging(item.id)
              }}
              onPointerMove={onPointerMove}
              onPointerUp={() => setDragging(null)}
              onPointerCancel={() => setDragging(null)}
              onKeyDown={e => onKeyDown(e, index)}
            >
              <DotsSixVerticalIcon size={20} weight="bold" aria-hidden />
            </button>
            <span className="w-6 text-right text-sm opacity-50">{index + 1}</span>
            <StaffAvatar img={item.img} name={item.nome} size={28} />
            <span className="font-medium">{item.nome}</span>
            <span className="text-sm opacity-60">{item.staff}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!changed || pending}
          onClick={() =>
            startTransition(async () => {
              setResult(await save(items.map(i => i.id)))
            })
          }
        >
          {pending ? <span className="loading loading-spinner loading-xs" /> : <FloppyDiskIcon size={18} weight="bold" aria-hidden />}
          Salva ordine
        </button>
        {changed && (
          <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => reorder(initial)}>
            Annulla
          </button>
        )}
        {result && !pending && (
          <span role="status" className={`text-sm ${result.ok ? 'text-success' : 'text-error'}`}>
            {result.message}
          </span>
        )}
      </div>
    </div>
  )
}
