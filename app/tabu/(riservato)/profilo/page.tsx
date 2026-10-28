import type { Metadata } from 'next'
import Link from 'next/link'
import { requireLeader } from '@/lib/dal'
import { splitStaff, staffPages } from '@/lib/staff'
import StaffAvatar from '@/components/tabu/StaffAvatar'
import PhotoUploader from '@/components/tabu/PhotoUploader'
import ActionForm from '@/components/tabu/ActionForm'
import { updateMyDesc, uploadMyPhoto } from './actions'

export const metadata: Metadata = { title: 'Profilo' }

const LC_STAFF = ['L', 'C']

export default async function ProfilePage() {
  const leader = await requireLeader()
  const codes = splitStaff(leader.staff)
  const pages = codes.flatMap(s => (staffPages[s] ? [{ ...staffPages[s], code: s }] : []))
  const huntName = codes.some(s => LC_STAFF.includes(s)) && leader.nomeCaccia

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">Profilo</h1>

      <section className="card bg-base-200">
        <div className="card-body gap-4">
          <h2 className="card-title">Foto</h2>
          <div className="flex flex-wrap items-center gap-6">
            <StaffAvatar img={leader.img} name={leader.nome} size={112} />
            <div className="text-sm space-y-1">
              <p>È la foto delle schede dei capi sul sito:</p>
              <ul className="list-disc list-inside">
                <li>
                  <Link className="link" href="/coca/">
                    Comunità Capi
                  </Link>{' '}
                  (nome e cognome)
                </li>
                {pages.map(p => (
                  <li key={p.href}>
                    <Link className="link" href={p.href}>
                      {p.label}
                    </Link>{' '}
                    ({LC_STAFF.includes(p.code) && huntName ? `solo come ${huntName}` : 'nome di battesimo'})
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-sm opacity-70">
            Scegli una foto in cui si veda bene il viso: verrà ritagliata al centro in un quadrato. Dopo il
            caricamento le pagine del sito si aggiornano entro pochi secondi.
          </p>
          <PhotoUploader action={uploadMyPhoto} />
        </div>
      </section>

      <section className="card bg-base-200">
        <ActionForm action={updateMyDesc} className="card-body gap-2">
          <h2 className="card-title">Descrizione</h2>
          <p className="text-sm opacity-70">
            Compare sotto la foto nelle pagine delle unità (non nella pagina della Co.Ca.).
            {huntName && ` Nelle pagine L/C è la descrizione di ${huntName}.`}
          </p>
          <textarea name="desc" className="textarea w-full min-h-28" maxLength={600} defaultValue={leader.desc ?? ''} />
        </ActionForm>
      </section>
    </div>
  )
}
