import type { Metadata } from 'next'
import { requireLeader } from '@/lib/dal'
import { getProject, getProjectYears } from '@/lib/tabu'
import { parseScoutYear, scoutYearOf, scoutYearOptions } from '@/lib/scout-year'
import { formatDate } from '@/lib/format'
import ActionForm from '@/components/tabu/ActionForm'
import YearPicker from '@/components/tabu/YearPicker'
import { saveYearProject } from './actions'

export const metadata: Metadata = { title: 'Il mio progetto' }

const fields = [
  { name: 'obiettivi', label: 'Obiettivi', hint: 'Cosa vuoi raggiungere quest’anno, con la tua unità e come capo.' },
  { name: 'tappe', label: 'Tappe', hint: 'I passi e i momenti principali dell’anno.' },
  { name: 'verifica', label: 'Verifica', hint: 'Come e quando capirai se ci sei riuscito.' },
] as const

export default async function MyProjectPage({ searchParams }: { searchParams: Promise<{ anno?: string }> }) {
  const leader = await requireLeader()
  const { anno } = await searchParams
  const year = parseScoutYear(anno) !== null ? anno! : scoutYearOf()
  const [project, years] = await Promise.all([getProject(leader.id, year), getProjectYears()])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-primary">Il mio progetto</h1>
        <YearPicker years={scoutYearOptions([...years, year])} current={year} basePath="/tabu/progetto/" />
      </div>
      <p className="opacity-70">
        Anno {year}.{' '}
        {project ? `Ultima modifica il ${formatDate(project.updatedAt)}.` : 'Non ancora salvato.'} Gli altri capi
        possono leggerlo, solo tu puoi modificarlo.
      </p>

      {/* key: reset the fields when switching year */}
      <div className="card bg-base-200">
        <ActionForm key={year} action={saveYearProject} className="card-body gap-4">
          <input type="hidden" name="scoutYear" value={year} />
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-base">Titolo</legend>
            <input name="titolo" className="input w-full" maxLength={200} defaultValue={project?.titolo} />
          </fieldset>
          {fields.map(f => (
            <fieldset key={f.name} className="fieldset">
              <legend className="fieldset-legend text-base">{f.label}</legend>
              <textarea
                name={f.name}
                className="textarea w-full min-h-36"
                maxLength={5000}
                defaultValue={project?.[f.name]}
              />
              <p className="label whitespace-normal">{f.hint}</p>
            </fieldset>
          ))}
        </ActionForm>
      </div>
    </div>
  )
}
