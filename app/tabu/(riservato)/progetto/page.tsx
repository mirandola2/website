import type { Metadata } from 'next'
import { requireLeader } from '@/lib/dal'
import { getProject, getProjectYears, getYearQuestion } from '@/lib/tabu'
import { parseScoutYear, scoutYearOf, scoutYearOptions } from '@/lib/scout-year'
import { formatDate } from '@/lib/format'
import { CHECKPOINTS, MAX_ANSWER, MAX_TEXT, normalizeSections, PROJECT_SECTIONS } from '@/lib/project'
import ActionForm from '@/components/tabu/ActionForm'
import ScoreRange from '@/components/tabu/ScoreRange'
import YearPicker from '@/components/tabu/YearPicker'
import { saveYearProject } from './actions'

export const metadata: Metadata = { title: 'Il mio progetto' }

export default async function MyProjectPage({ searchParams }: { searchParams: Promise<{ anno?: string }> }) {
  const leader = await requireLeader()
  const { anno } = await searchParams
  const year = parseScoutYear(anno) !== null ? anno! : scoutYearOf()
  const [project, years, question] = await Promise.all([getProject(leader.id, year), getProjectYears(), getYearQuestion(year)])
  const sections = project?.sections ?? normalizeSections(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-primary">Progetto del Capo {year.replace('-', '/20')}</h1>
        <YearPicker years={scoutYearOptions([...years, year])} current={year} basePath="/tabu/progetto/" />
      </div>
      <p className="opacity-70">
        {project ? `Ultima modifica il ${formatDate(project.updatedAt)}.` : 'Non ancora salvato.'} Gli altri capi possono
        leggerlo, solo tu puoi modificarlo.
      </p>

      {/* key: reset the fields when switching year */}
      <ActionForm key={year} action={saveYearProject} submitLabel="Salva progetto" className="space-y-4">
        <input type="hidden" name="scoutYear" value={year} />
        <div className="grid gap-4 lg:grid-cols-2">
          {PROJECT_SECTIONS.map(({ key, title, subtitle }) => {
            const s = sections[key]
            return (
              <fieldset key={key} className="card bg-base-200">
                <div className="card-body gap-3">
                  <legend className="sr-only">{title}</legend>
                  <div>
                    <h2 className="card-title text-primary">{title}</h2>
                    <p className="text-sm opacity-70">{subtitle}</p>
                  </div>
                  <label className="fieldset">
                    <span className="fieldset-legend">Obiettivi</span>
                    <textarea name={`${key}.obiettivi`} defaultValue={s.obiettivi} maxLength={MAX_TEXT} className="textarea w-full min-h-28" />
                  </label>
                  <label className="fieldset">
                    <span className="fieldset-legend">Strumenti</span>
                    <textarea name={`${key}.strumenti`} defaultValue={s.strumenti} maxLength={MAX_TEXT} className="textarea w-full min-h-28" />
                  </label>
                  <label className="fieldset">
                    <span className="fieldset-legend">{question}</span>
                    <input name={`${key}.risposta`} defaultValue={s.risposta} maxLength={MAX_ANSWER} className="input w-full" />
                  </label>
                  <div className="space-y-2">
                    <p className="fieldset-legend">Verifica</p>
                    {CHECKPOINTS.map(c => (
                      <ScoreRange key={c.key} name={`${key}.${c.key}`} label={c.label} defaultValue={s[c.key]} />
                    ))}
                  </div>
                </div>
              </fieldset>
            )
          })}
        </div>
      </ActionForm>
    </div>
  )
}
