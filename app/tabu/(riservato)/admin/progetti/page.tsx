import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRightIcon } from '@phosphor-icons/react/ssr'
import { requireAdmin } from '@/lib/dal'
import { countDraftsByYear, countProjectsByYear, getYearSettings } from '@/lib/tabu'
import { formatScoutYear, parseScoutYear, scoutYearOf } from '@/lib/scout-year'
import ActionForm from '@/components/tabu/ActionForm'
import { Checkbox } from '@/components/tabu/Field'
import BulkDraftChecks from '@/components/tabu/BulkDraftChecks'
import { addYear, deleteYear, saveYearSettings } from '../actions'

export const metadata: Metadata = { title: 'Admin · Progetti del Capo' }

export default async function AdminProjectsPage() {
  await requireAdmin()
  const [years, counts, draftCounts] = await Promise.all([getYearSettings(), countProjectsByYear(), countDraftsByYear()])
  // Years that can be added: from two years ago to next year
  const current = parseScoutYear(scoutYearOf())!
  const addable = [current + 1, current, current - 1, current - 2].map(formatScoutYear).filter(id => !years.some(y => y.id === id))

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">Amministra Progetti del Capo</h1>
      <ul className="text-sm opacity-70 list-disc list-inside">
        <li>
          <b>Visibile</b>: l&apos;anno compare nella tendina di &ldquo;Il mio progetto&rdquo; e &ldquo;Tutti i progetti&rdquo;.
        </li>
        <li>
          <b>Attivo</b>: i capi possono ancora modificare il proprio progetto. Negli anni non attivi non si può più modificare
          nulla. Un anno attivo è sempre anche visibile.
        </li>
        <li>
          <b>Rendi tutti i PdC bozze / Rendi definitivi tutti i PdC</b>: finché l&apos;anno è attivo, rendono bozze o definitivi tutti insieme
          i progetti già salvati, premendo Salva. In &ldquo;Tutti i progetti&rdquo; le bozze stanno tra chi deve ancora finire.
        </li>
        <li>
          <b>Modello</b>: le aree e le domande del progetto di quell&apos;anno. Cambiarlo cambia anche i progetti già
          compilati.
        </li>
      </ul>

      {addable.length > 0 && (
        <details className="collapse collapse-arrow bg-base-200">
          <summary className="collapse-title font-bold">Aggiungi un anno</summary>
          <div className="collapse-content">
            <ActionForm action={addYear} submitLabel="Aggiungi">
              <div className="grid gap-x-4 md:grid-cols-2">
                <label className="fieldset">
                  <span className="fieldset-legend">Anno</span>
                  <select name="id" className="select w-full">
                    {addable.map(id => (
                      <option key={id}>{id}</option>
                    ))}
                  </select>
                  <span className="label whitespace-normal">Parte nascosto: rendilo visibile quando il modello è pronto</span>
                </label>
                <label className="fieldset">
                  <span className="fieldset-legend">Copia il modello da</span>
                  <select name="copyFrom" className="select w-full">
                    {years.map(y => (
                      <option key={y.id} value={y.id}>
                        {y.id}
                      </option>
                    ))}
                    <option value="">Modello cartaceo</option>
                  </select>
                </label>
              </div>
            </ActionForm>
          </div>
        </details>
      )}

      {years.length === 0 && <p>Nessun anno: aggiungine uno.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {years.map(year => {
          const projects = counts.get(year.id) ?? 0
          const drafts = draftCounts.get(year.id) ?? 0
          return (
            <section key={year.id} className="card bg-base-200">
              <div className="card-body gap-3">
                <h2 className="card-title">
                  {year.id}
                  {year.active ? (
                    <span className="badge badge-success badge-sm">attivo</span>
                  ) : year.visible ? (
                    <span className="badge badge-sm">solo lettura</span>
                  ) : (
                    <span className="badge badge-ghost badge-sm">nascosto</span>
                  )}
                </h2>
                <p className="text-sm">
                  {year.template.areas.length} aree × {year.template.questions.length} domande ·{' '}
                  {projects === 1 ? '1 progetto compilato' : `${projects} progetti compilati`}
                  {projects > 0 && ` (${drafts === 1 ? '1 bozza' : `${drafts} bozze`})`}
                </p>
                <ActionForm action={saveYearSettings} buttonClassName="btn btn-primary btn-sm">
                  <input type="hidden" name="id" value={year.id} />
                  <div className="flex flex-wrap gap-4">
                    <Checkbox label="Visibile" name="visible" defaultChecked={year.visible} />
                    <Checkbox label="Attivo" name="active" defaultChecked={year.active} />
                  </div>
                  {/* key: unchecked again once the save has changed the drafts */}
                  {year.active && projects > 0 && <BulkDraftChecks key={drafts} />}
                </ActionForm>
                <div className="card-actions items-center justify-between border-t border-base-300 pt-3">
                  <Link href={`/tabu/admin/progetti/${year.id}/`} className="btn btn-outline btn-sm">
                    Modello
                    <ArrowRightIcon size={16} weight="bold" aria-hidden />
                  </Link>
                  {projects === 0 && (
                    <ActionForm
                      action={deleteYear}
                      submitLabel="Elimina anno"
                      buttonClassName="btn btn-error btn-outline btn-sm"
                      confirm={`Eliminare il ${year.id}?`}
                      className="[&>div]:mt-0"
                    >
                      <input type="hidden" name="id" value={year.id} />
                    </ActionForm>
                  )}
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
