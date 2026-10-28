import type { Metadata } from 'next'
import { requireLeader } from '@/lib/dal'
import { getProject, resolveYear } from '@/lib/tabu'
import { formatDate } from '@/lib/format'
import { CHECKPOINTS, MAX_ANSWER, MAX_TEXT, normalizeSections, PROJECT_SECTIONS } from '@/lib/project'
import ProjectForm from '@/components/tabu/ProjectForm'
import ScoreRange from '@/components/tabu/ScoreRange'
import YearSelect from '@/components/tabu/YearSelect'
import { saveYearProject } from './actions'

export const metadata: Metadata = { title: 'Il mio progetto' }

export default async function MyProjectPage({ searchParams }: { searchParams: Promise<{ anno?: string }> }) {
  const leader = await requireLeader()
  const { anno } = await searchParams
  const { year, visible } = await resolveYear(anno)
  const project = await getProject(leader.id, year.id)
  const sections = project?.sections ?? normalizeSections(null)

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
      {!year.active && (
        <div role="alert" className="alert alert-info alert-soft">
          Questo anno è chiuso: il progetto non si può più modificare.
        </div>
      )}

      {/* key: reset the fields when switching year */}
      <ProjectForm key={year.id} action={saveYearProject} editable={year.active}>
        <input type="hidden" name="scoutYear" value={year.id} />
        <div className="grid gap-4 lg:grid-cols-2">
          {PROJECT_SECTIONS.map(({ key, title, subtitle }) => {
            const s = sections[key]
            return (
              <section key={key} className="card bg-base-200">
                <div className="card-body gap-3">
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
                    <span className="fieldset-legend">{year.question}</span>
                    <input name={`${key}.risposta`} defaultValue={s.risposta} maxLength={MAX_ANSWER} className="input w-full" />
                  </label>
                  <div className="space-y-2">
                    <p className="fieldset-legend">Verifica</p>
                    {CHECKPOINTS.map(c => (
                      <ScoreRange key={c.key} name={`${key}.${c.key}`} label={c.label} defaultValue={s[c.key]} />
                    ))}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      </ProjectForm>
    </div>
  )
}
