'use client'

import { useState, useRef, useSyncExternalStore } from 'react'
import { useCookie } from '@/hooks/useCookie'
import { sha256Hex } from '@/lib/sha256'
import { searchMemberCode as searchMemberCodeAction } from '@/app/actions/member'
import { authClient } from '@/lib/auth-client'
import { MagnifyingGlassIcon, SignOutIcon, FloppyDiskIcon, UserCheckIcon } from '@phosphor-icons/react'

interface CodiceSocioProps {
  lastupdate?: string
}

interface PersonData {
  name?: string
  birthday?: string
  code?: string
}

// Cookies can't be observed, so login/logout notify subscribers manually.
const listeners = new Set<() => void>()
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const notify = () => listeners.forEach(l => l())

export default function CodiceSocio({ lastupdate }: CodiceSocioProps) {
  const pskCookie = useCookie('psk')
  const hasToken = useSyncExternalStore(subscribe, () => pskCookie.get()?.length === 64, () => false)
  // Only leaders can have a session (lib/auth.ts). Hiding the token form is cosmetic: the server
  // action checks the session or the token again.
  const { data: session } = authClient.useSession()
  const isLeader = !!session
  const logged = isLeader || hasToken
  const [name, setName] = useState('')
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [personData, setPersonData] = useState<PersonData[]>([])
  const dialogRef = useRef<HTMLDialogElement>(null)

  async function handleSave() {
    if (!pw) return
    pskCookie.set(await sha256Hex(pw), { expires: 365, sameSite: 'strict', secure: location.protocol === 'https:' })
    setPw('')
    notify()
  }

  function logout() {
    pskCookie.remove()
    setPersonData([])
    setError('')
    notify()
  }

  async function searchMemberCode() {
    const cleaned = name.trim().replace(/\s+/g, ' ')
    if (!cleaned || loading) return

    setLoading(true)
    setError('')
    setPersonData([])
    dialogRef.current?.showModal()

    try {
      const res = await searchMemberCodeAction(cleaned)
      if (res.ok) setPersonData(res.people)
      else if (res.error === 'unauthorized') setError('Non sei autorizzato o il token usato è errato. Esci e riprova.')
      else setError('Nome non valido.')
    } catch {
      setError('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="card w-full not-prose max-w-xl mt-12 mx-auto bg-base-200">
        <div className="card-body gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="card-title">Ricerca codice socio</h2>
            {isLeader ? (
              <span className="badge badge-ghost gap-1">
                <UserCheckIcon size={16} weight="bold" aria-hidden />
                Accesso come capo
              </span>
            ) : hasToken && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
                <SignOutIcon size={18} weight="bold" aria-hidden />
                Reset Token
              </button>
            )}
          </div>

          {!logged && (
            <form className="join w-full" onSubmit={e => { e.preventDefault(); handleSave() }}>
              <input
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="Token Magico"
                autoComplete="current-password"
                className="input join-item w-full"
              />
              <button type="submit" className="btn btn-primary join-item" disabled={!pw}>
                <FloppyDiskIcon size={18} weight="bold" aria-hidden />
                Salva
              </button>
            </form>
          )}

          <form className="join w-full" onSubmit={e => { e.preventDefault(); searchMemberCode() }}>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, ''))}
              placeholder="Nome Completo"
              className="input join-item w-full"
              disabled={!logged}
            />
            <button type="submit" className="btn btn-primary join-item" disabled={!logged || !name.trim()}>
              <MagnifyingGlassIcon size={18} weight="bold" aria-hidden />
              Cerca
            </button>
          </form>

          {lastupdate && <p className="text-sm text-right opacity-70">Dati aggiornati al {lastupdate}</p>}
        </div>
      </div>

      <dialog ref={dialogRef} className="modal">
        <div className="modal-box">
          {loading && <span className="loading loading-spinner loading-md" />}
          {error && <span className="font-bold text-error">{error}</span>}
          {!loading && !error && personData.length === 0 && <span>Codice socio non trovato.</span>}
          {!loading &&
            personData.map((data, i) => (
              <table key={i} className="table text-sm py-8 font-mono">
                <tbody>
                  <tr>
                    <td className="pl-0">Nome:</td>
                    <th>{data?.name}</th>
                  </tr>
                  <tr>
                    <td className="pl-0">Data di nascita:</td>
                    <th>{data?.birthday}</th>
                  </tr>
                  <tr>
                    <td className="pl-0">Codice Socio:</td>
                    <th className="text-3xl font-bold">{data?.code}</th>
                  </tr>
                </tbody>
              </table>
            ))}
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-outline btn-primary">Chiudi</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  )
}
