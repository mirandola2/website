import type { Metadata } from 'next'
import { requireLeader } from '@/lib/dal'
import { getProject, NO_YEAR, resolveYear } from '@/lib/tabu'
import { formatDate } from '@/lib/format'
import { MAX_TEXT, normalizeAnswers } from '@/lib/project'
import ProjectForm from '@/components/tabu/ProjectForm'
import ProjectView from '@/components/tabu/ProjectView'
import ScoreRange from '@/components/tabu/ScoreRange'
import YearSelect from '@/components/tabu/YearSelect'
import { saveYearProject } from './actions'

export const metadata: Metadata = { title: 'Il mio progetto' }

export default async function MyProjectPage({ searchParams }: { searchParams: Promise<{ anno?: string }> }) {
  const leader = await requireLeader()
  const { anno } = await searchParams
  const { year, visible } = await resolveYear(anno)
  if (!year) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-4xl text-primary">Il mio Progetto del Capo</h1>
        <p>{NO_YEAR}</p>
      </div>
    )
  }
  const project = await getProject(leader.memberCode, year)
  const answers = project?.sections ?? normalizeAnswers(year.template, null)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-primary">Il mio Progetto del Capo</h1>
        {visible.length > 1 && <YearSelect years={visible.map(y => y.id)} current={year.id} basePath="/tabu/progetto/" />}
      </div>
      <p className="opacity-70">
        Anno {year.id.replace('-', '/20')}.{' '}
        {project ? `Ultima modifica il ${formatDate(project.updatedAt)}.` : 'Non ancora salvato.'} Gli altri capi possono
        leggerlo, solo tu puoi modificarlo.
      </p>
      {year.active && project?.draft && (
        <div role="status" className="alert alert-warning alert-soft">
          <span className="badge badge-warning">Bozza</span>
          Il progetto è ancora una bozza: gli altri capi lo vedono tra chi deve ancora finire.
        </div>
      )}
      {!year.active && (
        <div role="alert" className="alert alert-info alert-soft">
          Questo anno è chiuso: il progetto non si può più modificare.
        </div>
      )}

      {/* key: reset the fields when switching year */}
      <ProjectForm
        key={year.id}
        action={saveYearProject}
        editable={year.active}
        saved={!!project}
        draft={project?.draft ?? false}
        view={<ProjectView template={year.template} answers={answers} detailed />}
      >
        <input type="hidden" name="scoutYear" value={year.id} />
        <div className="grid gap-4 lg:grid-cols-2">
          {year.template.areas.map(area => (
            <section key={area.id} className="card bg-base-200">
              <div className="card-body gap-3">
                <div>
                  <h2 className="card-title text-primary">{area.title}</h2>
                  {area.subtitle && <p className="text-sm opacity-70">{area.subtitle}</p>}
                </div>
                {year.template.questions.map(q => {
                  // Field names: "<area>.<question>" (read back by saveYearProject)
                  const name = `${area.id}.${q.id}`
                  const value = answers[area.id][q.id]
                  if (q.kind === 'score') return <ScoreRange key={q.id} name={name} label={q.label} defaultValue={Number(value)} />
                  return (
                    <label key={q.id} className="fieldset">
                      <span className="fieldset-legend">{q.label}</span>
                      {q.kind === 'long' ? (
                        <textarea name={name} defaultValue={String(value)} maxLength={MAX_TEXT.long} className="textarea w-full min-h-28" />
                      ) : (
                        <input name={name} defaultValue={String(value)} maxLength={MAX_TEXT.short} className="input w-full" />
                      )}
                    </label>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </ProjectForm>
    </div>
  )
}
