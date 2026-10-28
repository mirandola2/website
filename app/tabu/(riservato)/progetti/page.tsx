import type { Metadata } from 'next'
import { requireLeader } from '@/lib/dal'
import { getProjectsForYear, getProjectYears } from '@/lib/tabu'
import { parseScoutYear, scoutYearOf, scoutYearOptions } from '@/lib/scout-year'
import { formatDate } from '@/lib/format'
import { splitStaff, staffColors, staffLabels } from '@/lib/staff'
import StaffAvatar from '@/components/tabu/StaffAvatar'
import YearPicker from '@/components/tabu/YearPicker'

export const metadata: Metadata = { title: 'Progetti della Co.Ca.' }

const sections = [
  { key: 'obiettivi', label: 'Obiettivi' },
  { key: 'tappe', label: 'Tappe' },
  { key: 'verifica', label: 'Verifica' },
] as const

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ anno?: string }> }) {
  await requireLeader()
  const { anno } = await searchParams
  const year = parseScoutYear(anno) !== null ? anno! : scoutYearOf()
  const [rows, years] = await Promise.all([getProjectsForYear(year), getProjectYears()])
  // Written projects first (most recent first), then who hasn't written one yet
  const written = rows
    .filter(r => r.project?.updatedAt)
    .sort((a, b) => b.project!.updatedAt!.getTime() - a.project!.updatedAt!.getTime())
  const missing = rows.filter(r => !r.project?.updatedAt)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-primary">Progetti della Co.Ca.</h1>
        <YearPicker years={scoutYearOptions([...years, year])} current={year} basePath="/tabu/progetti/" />
      </div>
      <p className="opacity-70">
        {written.length} capi su {rows.length} hanno compilato il progetto {year}.
      </p>

      {written.map(({ leaderId, nome, img, staff, project }) => (
        <article key={leaderId} className="card bg-base-200">
          <div className="card-body gap-4">
            <header className="flex items-center gap-4">
              <StaffAvatar img={img} name={nome} size={56} />
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-primary">{project!.titolo || nome}</h2>
                <div className="flex flex-wrap items-center gap-1 text-sm">
                  <span>{nome}</span>
                  {splitStaff(staff).map(s => (
                    <span key={s} className={`badge badge-sm border-0 ${staffColors[s] || 'bg-base-300'}`}>
                      {staffLabels[s] || s}
                    </span>
                  ))}
                  <span className="opacity-60">· {formatDate(project!.updatedAt!)}</span>
                </div>
              </div>
            </header>
            {sections.map(
              s =>
                project![s.key] && (
                  <section key={s.key}>
                    <h3 className="font-bold">{s.label}</h3>
                    <p className="whitespace-pre-line">{project![s.key]}</p>
                  </section>
                ),
            )}
          </div>
        </article>
      ))}

      {missing.length > 0 && (
        <section className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Non ancora compilato</h2>
            <ul className="flex flex-wrap gap-3">
              {missing.map(r => (
                <li key={r.leaderId} className="flex items-center gap-2 text-sm">
                  <StaffAvatar img={r.img} name={r.nome} size={32} />
                  {r.nome}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
