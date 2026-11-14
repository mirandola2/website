import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/dal'
import { formatDate } from '@/lib/format'
import { getPescaPool, listPesche } from '@/lib/pesca'
import ActionForm from '@/components/tabu/ActionForm'
import PescaDialog from '@/components/tabu/PescaDialog'
import { createPesca, deletePesca, savePescaStatus } from './actions'

export const metadata: Metadata = { title: 'Admin · Pesca' }

export default async function AdminPescaPage() {
  await requireAdmin()
  const [pesche, pool] = await Promise.all([listPesche(), getPescaPool()])
  const candidates = pool.map(({ email, ...c }) => ({ ...c, canLogin: !!email }))

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">Pesca</h1>
      <ul className="text-sm opacity-70 list-disc list-inside">
        <li>Ogni capo che partecipa pesca un altro capo, mai sé stesso, e lo scopre nel Tabù alla voce <b>Pesca</b>.</li>
        <li>
          Chi ha pescato chi non lo vede nessuno, nemmeno gli admin: nel database è cifrato con una chiave che sta solo su
          Vercel. Ogni capo vede soltanto il proprio abbinamento.
        </li>
        <li>Per rifare una pesca se ne fa una nuova; quella vecchia si archivia o si elimina.</li>
        <li>
          <b>Archiviata</b>: i capi non la vedono più. Se sono tutte archiviate, la voce Pesca sparisce dal Tabù.
        </li>
      </ul>

      <PescaDialog candidates={candidates} action={createPesca} />

      {pesche.length === 0 && <p>Nessuna pesca.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {pesche.map(p => {
          const open = p.status === 'open'
          return (
            <section key={p.id} className="card bg-base-200">
              <div className="card-body gap-3">
                <h2 className="card-title">
                  {p.title}
                  {open ? <span className="badge badge-success badge-sm">aperta</span> : <span className="badge badge-ghost badge-sm">archiviata</span>}
                </h2>
                <p className="text-sm">
                  {formatDate(p.createdAt)} · {p.participantCount} partecipanti
                </p>
                <div className="card-actions items-center justify-between border-t border-base-300 pt-3">
                  <ActionForm
                    action={savePescaStatus}
                    submitLabel={open ? 'Archivia' : 'Riapri'}
                    buttonClassName="btn btn-outline btn-sm"
                    className="[&>div]:mt-0"
                  >
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="status" value={open ? 'archived' : 'open'} />
                  </ActionForm>
                  <ActionForm
                    action={deletePesca}
                    submitLabel="Elimina"
                    buttonClassName="btn btn-error btn-outline btn-sm"
                    confirm={`Eliminare la pesca "${p.title}"? I capi non potranno più vedere chi avevano pescato.`}
                    className="[&>div]:mt-0"
                  >
                    <input type="hidden" name="id" value={p.id} />
                  </ActionForm>
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
