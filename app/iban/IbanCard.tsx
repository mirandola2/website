'use client'

import { useRef, useState, useSyncExternalStore } from 'react'
import { CheckIcon, CopyIcon, PlusIcon, QuestionIcon, TrashIcon, XIcon } from '@phosphor-icons/react'
import { copyText } from '@/lib/clipboard'

const IBAN = 'IT97C0538766850000004609222'
const HOLDER = 'AGESCI Gruppo Mirandola 2'

const REASONS = ['Censimento', 'Campo', 'Altro evento'] as const
const BRANCHES = [
  { code: 'LC', label: 'LC', className: 'bg-lc text-lc-content border-lc' },
  { code: 'EG', label: 'EG', className: 'bg-eg text-eg-content border-eg' },
  { code: 'RS', label: 'RS', className: 'bg-rs text-rs-content border-rs' },
  // The leaders (Comunità Capi) pay the census only
  { code: 'CC', label: 'CoCa', className: 'bg-cc text-cc-content border-cc', censusOnly: true },
] as const

// The scout year runs like the school year: from 1 October it is already the next one
function scoutYear(date = new Date()) {
  return date.getMonth() >= 9 ? date.getFullYear() + 1 : date.getFullYear()
}

const noSubscribe = () => () => {}

interface Child {
  id: number
  branch: string
  name: string
  // The name field was left at least once: only then is a missing surname pointed out
  touched?: boolean
}

// First name and surname: at least two words
const hasFullName = (name: string) => name.trim().includes(' ')

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className={`btn btn-sm shrink-0 ${copied ? 'btn-success' : 'btn-primary'}`}
      disabled={!text}
      onClick={async () => {
        await copyText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      aria-label={`Copia ${label}`}
    >
      {copied ? <CheckIcon size={16} weight="bold" aria-hidden /> : <CopyIcon size={16} weight="bold" aria-hidden />}
      {copied ? 'Copiato' : 'Copia'}
    </button>
  )
}

function Field({ label, value, display, copy }: { label: string; value: string; display?: React.ReactNode; copy?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-base-content/60">{label}</p>
        <p className="mt-1 wrap-break-word font-mono text-lg">{display ?? (value || '—')}</p>
      </div>
      <CopyButton text={copy ?? value} label={label} />
    </div>
  )
}

export default function IbanCard() {
  // The page is static: the year comes from the visitor's clock, not from the build
  const currentYear = useSyncExternalStore(noSubscribe, () => scoutYear(), () => null)
  const [reason, setReason] = useState<(typeof REASONS)[number]>('Censimento')
  // Siblings can share one transfer for the census only
  const [children, setChildren] = useState<Child[]>([{ id: 0, branch: '', name: '' }])
  const nextId = useRef(1)
  const helpRef = useRef<HTMLDialogElement>(null)

  const isCensus = reason === 'Censimento'
  const branchOptions = BRANCHES.filter(b => isCensus || !('censusOnly' in b))
  const shown = isCensus ? children : children.slice(0, 1)
  const cleaned = shown.map(c => ({
    branch: branchOptions.some(b => b.code === c.branch) ? c.branch : '',
    name: c.name.trim().replace(/\s+/g, ' '),
  }))
  const complete = !!currentYear && cleaned.every(c => c.branch && hasFullName(c.name))
  // Siblings in the same branch: the branch is written once
  const branches = [...new Set(cleaned.map(c => c.branch || 'Branca'))].join('/')
  const names = cleaned.map(c => c.name || 'Nome Cognome').join(', ')
  const causale = `${reason} ${currentYear ?? ''} - ${branches} - ${names}`

  function update(id: number, patch: Partial<Child>) {
    setChildren(list => list.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }

  return (
    <>
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body gap-0 divide-y divide-base-300 py-2">
          <Field label="IBAN" value={IBAN} display={IBAN.match(/.{1,4}/g)!.join(' ')} />
          <Field label="Intestatario" value={HOLDER} />
        </div>
      </div>

      <details className="collapse collapse-arrow mt-6 bg-base-100 shadow-sm">
        <summary className="collapse-title">
          <h1 className="text-lg font-bold">Causale</h1>
          <p className="text-sm text-base-content/60">Componi la causale da copiare nel bonifico</p>
        </summary>
        <div className="collapse-content flex flex-col gap-5">
          <button
            type="button"
            className="btn btn-ghost btn-sm self-end"
            onClick={() => helpRef.current?.showModal()}
          >
            <QuestionIcon size={18} weight="bold" aria-hidden />
            Aiutami
          </button>

          <div className="join w-full" role="group" aria-label="Motivo del pagamento">
            {REASONS.map(r => (
              <button
                key={r}
                type="button"
                aria-pressed={reason === r}
                className={`btn join-item flex-1 ${reason === r ? 'btn-primary' : ''}`}
                onClick={() => setReason(r)}
              >
                {r}
              </button>
            ))}
          </div>

          {reason === 'Altro evento' ? (
            <p className="rounded-box bg-base-200 p-4">
              Scrivi il nome dell&apos;evento seguito dal nome e cognome del ragazzo o della ragazza, oppure segui le
              indicazioni ricevute dai capi.
            </p>
          ) : (
            <>
              {shown.map((child, i) => {
                const invalid = !!child.touched && !hasFullName(child.name)
                return (
                <fieldset key={child.id} className={`space-y-2 ${i > 0 ? 'border-t border-base-300 pt-5' : ''}`}>
                  {shown.length > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                        {i + 1}° figlio/a
                      </p>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => setChildren(list => list.filter(c => c.id !== child.id))}
                      >
                        <TrashIcon size={14} weight="bold" aria-hidden />
                        Rimuovi
                      </button>
                    </div>
                  )}
                  <div className={`grid gap-2 ${isCensus ? 'grid-cols-4' : 'grid-cols-3'}`} role="group" aria-label="Branca">
                    {branchOptions.map(b => (
                      <button
                        key={b.code}
                        type="button"
                        aria-pressed={child.branch === b.code}
                        className={`btn ${child.branch === b.code ? b.className : 'btn-outline border-base-300'}`}
                        onClick={() => update(child.id, { branch: b.code })}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={child.name}
                    onChange={e => update(child.id, { name: e.target.value })}
                    onBlur={() => update(child.id, { touched: true })}
                    placeholder="Nome e cognome del ragazzo/a"
                    autoComplete="off"
                    className={`input w-full ${invalid ? 'input-error' : ''}`}
                    aria-label="Nome e cognome del ragazzo/a"
                    aria-invalid={invalid}
                    aria-describedby={invalid ? `name-error-${child.id}` : undefined}
                  />
                  {invalid && (
                    <p id={`name-error-${child.id}`} className="text-sm text-error">
                      Inserisci nome e cognome del ragazzo/a.
                    </p>
                  )}
                </fieldset>
                )
              })}

              {reason === 'Censimento' && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm self-start"
                  onClick={() => setChildren(list => [...list, { id: nextId.current++, branch: '', name: '' }])}
                >
                  <PlusIcon size={16} weight="bold" aria-hidden />
                  Aggiungi un fratello o una sorella
                </button>
              )}

              <div className="flex items-center justify-between gap-3 rounded-box bg-base-200 p-4">
                <p className={`min-w-0 wrap-break-word font-mono ${complete ? '' : 'text-base-content/50'}`}>{causale}</p>
                <CopyButton text={complete ? causale : ''} label="causale" />
              </div>
            </>
          )}
        </div>
      </details>

      <dialog ref={helpRef} className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Chiudi">
              <XIcon size={18} weight="bold" aria-hidden />
            </button>
          </form>
          <h2 className="text-lg font-bold text-primary">Cosa devo mettere come causale?</h2>
          <p className="mt-3">
            La causale è <b>motivo anno - branca - nome e cognome</b>, ad esempio{' '}
            <span className="font-mono">Censimento {currentYear ?? ''} - EG - Mario Rossi</span>.
          </p>

          
          <h3 className="mt-5 font-bold">Branca</h3>
          <p className="mt-2">È il gruppo di età di cui fa parte il ragazzo o la ragazza:</p>
          <ul className="mt-2 space-y-2">
            <li className="flex gap-3">
              <span className="badge shrink-0 bg-lc text-lc-content">LC</span>
              <span><b>Lupetti e Coccinelle</b>, dagli 8 agli 11 anni circa (Branco e Cerchio).</span>
            </li>
            <li className="flex gap-3">
              <span className="badge shrink-0 bg-eg text-eg-content">EG</span>
              <span><b>Esploratori e Guide</b>, dagli 11-12 ai 16 anni circa (Reparto).</span>
            </li>
            <li className="flex gap-3">
              <span className="badge shrink-0 bg-rs text-rs-content">RS</span>
              <span><b>Rover e Scolte</b>, dai 16 ai 21 anni (Noviziato e Clan).</span>
            </li>
            <li className="flex gap-3">
              <span className="badge shrink-0 bg-cc text-cc-content">CC</span>
              <span><b>Comunità Capi</b>, i capi del gruppo: solo per il censimento.</span>
            </li>
          </ul>

          <h3 className="mt-5 font-bold">Nome e cognome</h3>
          <p className="mt-2">Quelli del ragazzo o della ragazza iscritti, non di chi fa il bonifico.</p>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label="Chiudi">chiudi</button>
        </form>
      </dialog>
    </>
  )
}
