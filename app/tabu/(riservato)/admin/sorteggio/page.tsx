import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/dal'
import { formatDate } from '@/lib/format'
import { getDrawPool, listDraws } from '@/lib/draw'
import ActionForm from '@/components/tabu/ActionForm'
import DrawDialog from '@/components/tabu/DrawDialog'
import { createDraw, deleteDraw, saveDrawStatus } from './actions'

export const metadata: Metadata = { title: 'Admin · Sorteggio' }

export default async function AdminDrawPage() {
  await requireAdmin()
  const [draws, pool] = await Promise.all([listDraws(), getDrawPool()])
  const candidates = pool.map(({ email, ...c }) => ({ ...c, canLogin: !!email }))

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">Sorteggio</h1>
      <ul className="text-sm opacity-70 list-disc list-inside">
        <li>A ogni capo che partecipa tocca in sorte un altro capo, mai sé stesso, e lo scopre nel Tabù alla voce <b>Sorteggio</b>.</li>
        <li>
          A chi è toccato chi non lo vede nessuno, nemmeno gli admin: nel database è cifrato con una chiave che sta solo su
          Vercel. Ogni capo vede soltanto il proprio abbinamento.
        </li>
        <li>Per rifare un sorteggio se ne fa uno nuovo; quello vecchio si archivia o si elimina.</li>
        <li>
          <b>Archiviato</b>: i capi non lo vedono più. Se sono tutti archiviati, la voce Sorteggio sparisce dal Tabù.
        </li>
      </ul>

      <DrawDialog candidates={candidates} action={createDraw} />

      {draws.length === 0 && <p>Nessun sorteggio.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {draws.map(p => {
          const open = p.status === 'open'
          return (
            <section key={p.id} className="card bg-base-200">
              <div className="card-body gap-3">
                <h2 className="card-title">
                  {p.title}
                  {open ? <span className="badge badge-success badge-sm">aperto</span> : <span className="badge badge-ghost badge-sm">archiviato</span>}
                </h2>
                <p className="text-sm">
                  {formatDate(p.createdAt)} · {p.participantCount} partecipanti
                </p>
                <div className="card-actions items-center justify-between border-t border-base-300 pt-3">
                  <ActionForm
                    action={saveDrawStatus}
                    submitLabel={open ? 'Archivia' : 'Riapri'}
                    buttonClassName="btn btn-outline btn-sm"
                    className="[&>div]:mt-0"
                  >
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="status" value={open ? 'archived' : 'open'} />
                  </ActionForm>
                  <ActionForm
                    action={deleteDraw}
                    submitLabel="Elimina"
                    buttonClassName="btn btn-error btn-outline btn-sm"
                    confirm={`Eliminare il sorteggio "${p.title}"? I capi non potranno più vedere chi era toccato loro.`}
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
