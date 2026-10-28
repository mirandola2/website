import type { Metadata } from 'next'
import { requireLeader } from '@/lib/dal'
import { getProjectsForYear, resolveYear } from '@/lib/tabu'
import { filledSentence, firstName, formatDate } from '@/lib/format'
import { CHECKPOINTS, isSectionEmpty, PROJECT_SECTIONS } from '@/lib/project'
import { splitStaff, staffColors, staffLabels } from '@/lib/staff'
import StaffAvatar from '@/components/tabu/StaffAvatar'
import ScoreBoxes from '@/components/tabu/ScoreBoxes'
import ProjectDialog from '@/components/tabu/ProjectDialog'
import YearSelect from '@/components/tabu/YearSelect'

export const metadata: Metadata = { title: 'Tutti i progetti' }

function StaffBadges({ staff }: { staff: string }) {
  return (
    <>
      {splitStaff(staff).map(s => (
        <span key={s} className={`badge badge-sm border-0 ${staffColors[s] || 'bg-base-300'}`}>
          {staffLabels[s] || s}
        </span>
      ))}
    </>
  )
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ anno?: string }> }) {
  await requireLeader()
  const { anno } = await searchParams
  const { year, visible } = await resolveYear(anno)
  const rows = await getProjectsForYear(year.id)
  // Written projects first (most recent first), then who hasn't written one yet
  const written = rows
    .flatMap(r => (r.project ? [{ ...r, project: r.project }] : []))
    .sort((a, b) => b.project.updatedAt.getTime() - a.project.updatedAt.getTime())
  const missing = rows.filter(r => !r.project)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-primary">Tutti i Progetti dei Capi</h1>
        {visible.length > 1 && <YearSelect years={visible.map(y => y.id)} current={year.id} basePath="/tabu/progetti/" />}
      </div>
      <p className="opacity-70">{filledSentence(written.length, rows.length, year.id.replace('-', '/20'))}</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {written.map(({ leaderId, nome, img, staff, project }) => (
          <ProjectDialog
            key={leaderId}
            title={`Progetto di ${firstName(nome)}`}
            trigger={
              <div className="card-body flex-row items-center gap-4 p-4">
                <StaffAvatar img={img} name={nome} size={56} />
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-primary">{firstName(nome)}</h2>
                  <div className="flex flex-wrap gap-1">
                    <StaffBadges staff={staff} />
                  </div>
                  <p className="text-xs opacity-60">Modificato il {formatDate(project.updatedAt)}</p>
                </div>
              </div>
            }
          >
            <header className="flex items-center gap-4 mb-4 pe-8">
              <StaffAvatar img={img} name={nome} size={56} />
              <div>
                <h2 className="text-2xl font-bold text-primary">{firstName(nome)}</h2>
                <p className="text-sm opacity-70">
                  Progetto del Capo {year.id.replace('-', '/20')} · {formatDate(project.updatedAt)}
                </p>
              </div>
            </header>
            <div className="grid gap-3 md:grid-cols-2">
              {PROJECT_SECTIONS.map(({ key, title }) => {
                const s = project.sections[key]
                if (isSectionEmpty(s)) return null
                return (
                  <section key={key} className="rounded-box bg-base-200 p-4 space-y-2">
                    <h3 className="font-bold text-primary">{title}</h3>
                    {s.obiettivi && (
                      <div>
                        <h4 className="text-sm font-bold">Obiettivi</h4>
                        <p className="whitespace-pre-line">{s.obiettivi}</p>
                      </div>
                    )}
                    {s.strumenti && (
                      <div>
                        <h4 className="text-sm font-bold">Strumenti</h4>
                        <p className="whitespace-pre-line">{s.strumenti}</p>
                      </div>
                    )}
                    {s.risposta && (
                      <div>
                        <h4 className="text-sm font-bold">{year.question}</h4>
                        <p>{s.risposta}</p>
                      </div>
                    )}
                    <div className="space-y-1 pt-1">
                      {CHECKPOINTS.map(c => (
                        <ScoreBoxes key={c.key} label={c.label} value={s[c.key]} />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </ProjectDialog>
        ))}
      </div>

      {missing.length > 0 && (
        <section className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Non ancora compilato</h2>
            <ul className="flex flex-wrap gap-3">
              {missing.map(r => (
                <li key={r.leaderId} className="flex items-center gap-2 text-sm">
                  <StaffAvatar img={r.img} name={r.nome} size={32} />
                  {firstName(r.nome)}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
