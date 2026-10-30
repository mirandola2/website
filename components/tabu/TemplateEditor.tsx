'use client'

import { startTransition, useActionState, useState } from 'react'
import { ArrowDownIcon, ArrowUpIcon, FloppyDiskIcon, PencilSimpleIcon, PlusIcon, TrashIcon, WarningIcon } from '@phosphor-icons/react'
import {
  MAX_AREAS,
  MAX_QUESTIONS,
  newTemplateId,
  QUESTION_KINDS,
  type ProjectTemplate,
  type TemplateArea,
  type TemplateQuestion,
} from '@/lib/project'
import type { ActionResult } from './types'

interface TemplateEditorProps {
  yearId: string
  template: ProjectTemplate
  // Projects already written for the year: the template applies to them too
  projectCount: number
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
}

const projectsText = (n: number) => (n === 1 ? 'un progetto già compilato' : `${n} progetti già compilati`)

const kindLabel = (kind: TemplateQuestion['kind']) => QUESTION_KINDS.find(k => k.value === kind)?.label

function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

function RowButtons({ index, length, onMove, onRemove, what }: {
  index: number
  length: number
  onMove: (to: number) => void
  onRemove: () => void
  what: string
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className="btn btn-ghost btn-sm btn-square" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Sposta su ${what}`}>
        <ArrowUpIcon size={16} weight="bold" aria-hidden />
      </button>
      <button type="button" className="btn btn-ghost btn-sm btn-square" disabled={index === length - 1} onClick={() => onMove(index + 1)} aria-label={`Sposta giù ${what}`}>
        <ArrowDownIcon size={16} weight="bold" aria-hidden />
      </button>
      <button type="button" className="btn btn-ghost btn-sm btn-square text-error" disabled={length === 1} onClick={onRemove} aria-label={`Togli ${what}`}>
        <TrashIcon size={16} weight="bold" aria-hidden />
      </button>
    </div>
  )
}

// A year's template (areas × questions). Read-only until "Modifica il modello": the changes apply
// to every project already written, so they shouldn't happen by accident.
export default function TemplateEditor({ yearId, template, projectCount, action }: TemplateEditorProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [areas, setAreas] = useState(template.areas)
  const [questions, setQuestions] = useState(template.questions)
  const [result, formAction, pending] = useActionState(async (prev: ActionResult, formData: FormData) => {
    const res = await action(prev, formData)
    if (res?.ok) setUnlocked(false)
    return res
  }, null)

  const updateArea = (i: number, patch: Partial<TemplateArea>) => setAreas(list => list.map((a, j) => (j === i ? { ...a, ...patch } : a)))
  const updateQuestion = (i: number, patch: Partial<TemplateQuestion>) =>
    setQuestions(list => list.map((q, j) => (j === i ? { ...q, ...patch } : q)))

  function cancel() {
    setAreas(template.areas)
    setQuestions(template.questions)
    setUnlocked(false)
  }

  if (!unlocked) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <section className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">Aree</h2>
              <ol className="list-decimal list-inside space-y-1">
                {template.areas.map(a => (
                  <li key={a.id}>
                    <span className="font-bold">{a.title}</span>
                    {a.subtitle && <span className="text-sm opacity-70"> · {a.subtitle}</span>}
                  </li>
                ))}
              </ol>
            </div>
          </section>
          <section className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">Domande (in ogni area)</h2>
              <ol className="list-decimal list-inside space-y-1">
                {template.questions.map(q => (
                  <li key={q.id}>
                    {q.label} <span className="badge badge-sm badge-ghost">{kindLabel(q.kind)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary" onClick={() => setUnlocked(true)}>
            <PencilSimpleIcon size={18} weight="bold" aria-hidden />
            Modifica il modello
          </button>
          {result && (
            <span role="status" className={`text-sm ${result.ok ? 'text-success' : 'text-error'}`}>
              {result.message}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={e => {
        e.preventDefault()
        if (
          projectCount &&
          !window.confirm(
            `Il modello vale anche per ${projectsText(projectCount)}: le risposte alle aree e alle domande tolte verranno cancellate. Salvare?`,
          )
        )
          return
        const data = new FormData(e.currentTarget)
        startTransition(() => formAction(data))
      }}
    >
      <input type="hidden" name="id" value={yearId} />
      <input type="hidden" name="template" value={JSON.stringify({ areas, questions })} />
      {projectCount > 0 && (
        <div role="alert" className="alert alert-warning alert-soft">
          <WarningIcon size={20} weight="bold" aria-hidden />
          <span>
            Progetti già compilati per questo anno: {projectCount}. Le modifiche valgono anche per loro: rinominare
            un&apos;area o una domanda mantiene le risposte, toglierla le cancella.
          </span>
        </div>
      )}

      <section className="card bg-base-200">
        <div className="card-body gap-3">
          <h2 className="card-title">Aree</h2>
          {areas.map((a, i) => (
            <div key={a.id} className="flex flex-col gap-2 rounded-box bg-base-100 p-3 sm:flex-row sm:items-end">
              <label className="fieldset flex-1 py-0">
                <span className="fieldset-legend">Titolo</span>
                <input value={a.title} onChange={e => updateArea(i, { title: e.target.value })} required maxLength={100} className="input w-full" />
              </label>
              <label className="fieldset flex-[2] py-0">
                <span className="fieldset-legend">Sottotitolo</span>
                <input value={a.subtitle} onChange={e => updateArea(i, { subtitle: e.target.value })} maxLength={300} className="input w-full" />
              </label>
              <RowButtons
                index={i}
                length={areas.length}
                what={a.title || 'area'}
                onMove={to => setAreas(list => move(list, i, to))}
                onRemove={() => setAreas(list => list.filter((_, j) => j !== i))}
              />
            </div>
          ))}
          <div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={areas.length >= MAX_AREAS}
              onClick={() => setAreas(list => [...list, { id: newTemplateId(), title: '', subtitle: '' }])}
            >
              <PlusIcon size={16} weight="bold" aria-hidden />
              Aggiungi area
            </button>
          </div>
        </div>
      </section>

      <section className="card bg-base-200">
        <div className="card-body gap-3">
          <h2 className="card-title">Domande</h2>
          <p className="text-sm opacity-70">Le stesse in ogni area, in questo ordine.</p>
          {questions.map((q, i) => (
            <div key={q.id} className="flex flex-col gap-2 rounded-box bg-base-100 p-3 sm:flex-row sm:items-end">
              <label className="fieldset flex-[2] py-0">
                <span className="fieldset-legend">Domanda</span>
                <input value={q.label} onChange={e => updateQuestion(i, { label: e.target.value })} required maxLength={200} className="input w-full" />
              </label>
              <label className="fieldset flex-1 py-0">
                <span className="fieldset-legend">Tipo</span>
                <select
                  value={q.kind}
                  onChange={e => updateQuestion(i, { kind: e.target.value as TemplateQuestion['kind'] })}
                  className="select w-full"
                >
                  {QUESTION_KINDS.map(k => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </label>
              <RowButtons
                index={i}
                length={questions.length}
                what={q.label || 'domanda'}
                onMove={to => setQuestions(list => move(list, i, to))}
                onRemove={() => setQuestions(list => list.filter((_, j) => j !== i))}
              />
            </div>
          ))}
          <div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={questions.length >= MAX_QUESTIONS}
              onClick={() => setQuestions(list => [...list, { id: newTemplateId(), label: '', kind: 'long' }])}
            >
              <PlusIcon size={16} weight="bold" aria-hidden />
              Aggiungi domanda
            </button>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 px-4 py-3 bg-base-100/95 backdrop-blur border-t border-base-300 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? <span className="loading loading-spinner loading-xs" /> : <FloppyDiskIcon size={18} weight="bold" aria-hidden />}
          Salva modello
        </button>
        <button type="button" className="btn btn-ghost" disabled={pending} onClick={cancel}>
          Annulla
        </button>
        {result && !result.ok && !pending && (
          <span role="status" className="text-sm text-error">
            {result.message}
          </span>
        )}
      </div>
    </form>
  )
}
