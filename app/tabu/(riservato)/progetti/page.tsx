import type { Metadata } from 'next'
import { requireLeader } from '@/lib/dal'
import { getProjectsForYear, resolveReadableYear } from '@/lib/tabu'
import { filledSentence, formatDate } from '@/lib/format'
import { splitStaff, staffColors, staffLabels } from '@/lib/staff'
import StaffAvatar from '@/components/tabu/StaffAvatar'
import ProjectView from '@/components/tabu/ProjectView'
import ProjectDialog from '@/components/tabu/ProjectDialog'
import YearSelect from '@/components/tabu/YearSelect'

export const metadata: Metadata = { title: 'Tutti i progetti' }

const NO_READABLE_YEAR =
  'Nessun anno da leggere: si leggono i progetti dell’anno in corso, degli anni ancora aperti e di quelli in cui hai scritto il tuo.'

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
  const leader = await requireLeader()
  const { anno } = await searchParams
  // Only the years whose projects this leader can read: the others are not even listed
  const { year, visible } = await resolveReadableYear(anno, leader.memberCode)
  if (!year) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-4xl text-primary">Tutti i Progetti dei Capi</h1>
        <p>{NO_READABLE_YEAR}</p>
      </div>
    )
  }
  const rows = await getProjectsForYear(year)
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
        {written.map(({ memberCode, nome, shortName, img, staff, project }) => (
          <ProjectDialog
            key={memberCode}
            title={`Progetto di ${shortName}`}
            trigger={
              <div className="card-body flex-row items-center gap-4 p-4">
                <StaffAvatar img={img} name={nome} size={56} />
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-primary">{shortName}</h2>
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
                <h2 className="text-2xl font-bold text-primary">{shortName}</h2>
                <p className="text-sm opacity-70">
                  Progetto del Capo {year.id.replace('-', '/20')} · {formatDate(project.updatedAt)}
                </p>
              </div>
            </header>
            <ProjectView template={year.template} answers={project.sections} />
          </ProjectDialog>
        ))}
      </div>

      {missing.length > 0 && (
        <section className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Non ancora compilato</h2>
            <ul className="flex flex-wrap gap-3">
              {missing.map(r => (
                <li key={r.memberCode} className="flex items-center gap-2 text-sm">
                  <StaffAvatar img={r.img} name={r.nome} size={32} />
                  {r.shortName}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
