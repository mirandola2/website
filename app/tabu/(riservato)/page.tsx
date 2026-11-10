import Link from 'next/link'
import { ArrowRightIcon, NotebookIcon, UsersThreeIcon } from '@phosphor-icons/react/ssr'
import { requireLeader } from '@/lib/dal'
import { canReadProjects } from '@/lib/project'
import { scoutYearOf } from '@/lib/scout-year'
import { getDashboardStats, getProject, NO_YEAR, resolveYear } from '@/lib/tabu'
import { filledSentence, firstName, formatDate, greeting, shortNames } from '@/lib/format'
import StaffAvatar from '@/components/tabu/StaffAvatar'
import MyMemberCode from '@/components/tabu/MyMemberCode'

export default async function Dashboard() {
  const leader = await requireLeader()
  const { year } = await resolveYear(undefined)
  const project = year && (await getProject(leader.memberCode, year))
  // The others' projects of this year only if the leader can read them (lib/project.ts)
  const readable = !!year && canReadProjects(year, new Set(project ? [year.id] : []), scoutYearOf())
  const stats = year && readable ? await getDashboardStats(year.id) : null
  const yearLabel = year?.id.replace('-', '/20')
  const latestNames = shortNames(stats?.latest.map(p => p.nome) ?? [])

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">
        {greeting()} {firstName(leader.nome)}!
      </h1>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">
              <NotebookIcon size={24} weight="duotone" aria-hidden />
              Il mio Progetto del Capo
            </h2>
            <p>
              {!year
                ? NO_YEAR
                : `${yearLabel}: ${project ? `ultima modifica il ${formatDate(project.updatedAt)}.` : 'non ancora iniziato.'}`}
            </p>
            <div className="card-actions justify-end">
              <Link href="/tabu/progetto/" className="btn btn-primary btn-sm">
                {!year?.active ? 'Apri' : project ? 'Modifica' : 'Inizia'}
                <ArrowRightIcon size={16} weight="bold" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <section className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">
              <UsersThreeIcon size={24} weight="duotone" aria-hidden />
              Tutti i Progetti dei Capi
            </h2>
            <p>
              {stats
                ? // A closed year has no drafts: they count as filled
                  year!.active
                  ? filledSentence(stats.filled, stats.leaders, yearLabel!, stats.drafting)
                  : filledSentence(stats.filled + stats.drafting, stats.leaders, yearLabel!)
                : year
                  ? `I progetti del ${yearLabel} li leggono solo i capi che hanno scritto il proprio.`
                  : NO_YEAR}
            </p>
            {stats && stats.latest.length > 0 && (
              <ul className="space-y-2">
                {stats.latest.map((p, i) => (
                  <li key={p.memberCode} className="flex items-center gap-2 text-sm">
                    <StaffAvatar img={p.img} name={p.nome} size={28} />
                    <span>
                      {latestNames[i]} · {formatDate(p.updatedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="card-actions justify-end">
              <Link href="/tabu/progetti/" className="btn btn-primary btn-sm">
                Leggi i progetti
                <ArrowRightIcon size={16} weight="bold" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <MyMemberCode memberCode={leader.memberCode} />
      </div>
    </div>
  )
}
