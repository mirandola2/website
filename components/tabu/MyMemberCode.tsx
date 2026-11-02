'use client'

import { useState, useTransition } from 'react'
import { EyeIcon, IdentificationCardIcon } from '@phosphor-icons/react'
import { getMyMemberCode } from '@/app/tabu/(riservato)/actions'

// Dashboard card: the code is fetched only on request, to keep database reads down
export default function MyMemberCode() {
  const [codes, setCodes] = useState<{ name: string; code: string }[] | null>(null)
  const [error, setError] = useState(false)
  const [pending, startTransition] = useTransition()

  function load() {
    setError(false)
    startTransition(async () => {
      try {
        setCodes(await getMyMemberCode())
      } catch {
        setError(true)
      }
    })
  }

  return (
    <section className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">
          <IdentificationCardIcon size={24} weight="duotone" aria-hidden />
          Il mio codice socio
        </h2>
        {codes && codes.length > 0 ? (
          <ul className="space-y-1">
            {codes.map(c => (
              <li key={c.code}>
                <span className="font-mono text-3xl font-bold">{c.code}</span>
                {codes.length > 1 && <span className="ms-2 text-sm opacity-70">{c.name}</span>}
              </li>
            ))}
          </ul>
        ) : codes ? (
          <p>Codice socio non trovato: il nome del tuo profilo non corrisponde a nessun socio. Chiedi a un admin.</p>
        ) : (
          <div className="card-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={load} disabled={pending}>
              {pending ? <span className="loading loading-spinner loading-xs" /> : <EyeIcon size={16} weight="bold" aria-hidden />}
              Mostra
            </button>
          </div>
        )}
        {error && <p className="text-error text-sm">Errore, riprova.</p>}
      </div>
    </section>
  )
}
