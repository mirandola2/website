import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/dal'
import { getYearSettings, type YearSetting } from '@/lib/tabu'
import { formatScoutYear, parseScoutYear, scoutYearOf } from '@/lib/scout-year'
import { DEFAULT_QUESTION } from '@/lib/project'
import ActionForm from '@/components/tabu/ActionForm'
import { Checkbox, Field } from '@/components/tabu/Field'
import { saveYearSettings } from '../actions'

export const metadata: Metadata = { title: 'Admin · Progetti del Capo' }

export default async function AdminProjectsPage() {
  await requireAdmin()
  const years = await getYearSettings()
  // Offer the next year too, so it can be prepared before September
  const next = formatScoutYear(parseScoutYear(scoutYearOf())! + 1)
  const all: YearSetting[] = years.some(y => y.id === next)
    ? years
    : [{ id: next, question: DEFAULT_QUESTION, visible: false, active: false }, ...years]

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
          <b>Domanda</b>: quella che cambia ogni anno nel modello (una per ciascuna delle quattro aree).
        </li>
      </ul>
      <div className="grid gap-4 md:grid-cols-2">
        {all.map(year => (
          <section key={year.id} className="card bg-base-200">
            <ActionForm action={saveYearSettings} className="card-body gap-1">
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
              <input type="hidden" name="id" value={year.id} />
              <Field label="Domanda" name="question" defaultValue={year.question} required />
              <div className="flex flex-wrap gap-4">
                <Checkbox label="Visibile" name="visible" defaultChecked={year.visible} />
                <Checkbox label="Attivo" name="active" defaultChecked={year.active} />
              </div>
            </ActionForm>
          </section>
        ))}
      </div>
    </div>
  )
}
