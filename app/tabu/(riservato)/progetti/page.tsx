import type { Metadata } from 'next'
import { requireLeader } from '@/lib/dal'
import { getProjectsForYear, resolveReadableYear } from '@/lib/tabu'
import { formatDate } from '@/lib/format'
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
  // Finished projects first (most recent first), then the drafts ("Bozza"), then who hasn't written one yet. Drafts
  // and missing only while the year is open: a closed year lists every saved project together, and its missing list
  // would be today's leaders, not that year's
  const saved = rows
    .flatMap(r => (r.project ? [{ ...r, project: r.project }] : []))
    .sort((a, b) => b.project.updatedAt.getTime() - a.project.updatedAt.getTime())
  const written = year.active ? saved.filter(r => !r.project.draft) : saved
  const drafts = year.active ? saved.filter(r => r.project.draft) : []
  const missing = rows.filter(r => !r.project)

  const card = ({ memberCode, nome, shortName, img, staff, project }: (typeof saved)[number]) => (
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
            {year.active && project.draft && ' · Bozza'}
          </p>
        </div>
      </header>
      <ProjectView template={year.template} answers={project.sections} />
    </ProjectDialog>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-primary">Tutti i Progetti dei Capi</h1>
        {visible.length > 1 && <YearSelect years={visible.map(y => y.id)} current={year.id} basePath="/tabu/progetti/" />}
      </div>
      {/* The finished ones (a closed year has no drafts: all its projects are here) */}
      {written.length > 0 && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{written.map(card)}</div>}

      {drafts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-secondary">Devono ancora finire</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{drafts.map(card)}</div>
        </section>
      )}

      {year.active && missing.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-secondary">Non ancora compilato</h2>
          <ul className="flex flex-wrap gap-3">
            {missing.map(r => (
              <li key={r.memberCode} className="flex items-center gap-2 text-sm">
                <StaffAvatar img={r.img} name={r.nome} size={32} />
                {r.shortName}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
