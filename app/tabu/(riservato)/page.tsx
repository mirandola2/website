import Link from 'next/link'
import { ArrowRightIcon, ImagesIcon, NotebookIcon, UsersThreeIcon } from '@phosphor-icons/react/ssr'
import { requireLeader } from '@/lib/dal'
import { getAdminCounts, getDashboardStats, getProject } from '@/lib/tabu'
import { scoutYearOf } from '@/lib/scout-year'
import { filledSentence, firstName, formatDate } from '@/lib/format'
import { splitStaff, staffPages } from '@/lib/staff'
import StaffAvatar from '@/components/tabu/StaffAvatar'
import CodiceSocio from '@/components/mdx/CodiceSocio'

export default async function Dashboard() {
  const leader = await requireLeader()
  const year = scoutYearOf()
  const [project, stats, admin] = await Promise.all([
    getProject(leader.id, year),
    getDashboardStats(year),
    leader.isAdmin ? getAdminCounts() : null,
  ])
  const pages = splitStaff(leader.staff).flatMap(s => (staffPages[s] ? [staffPages[s]] : []))

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">Ciao {firstName(leader.nome)}!</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">
              <NotebookIcon size={24} weight="duotone" aria-hidden />
              Il mio progetto {year}
            </h2>
            <p>
              {project ? `Ultima modifica il ${formatDate(project.updatedAt)}.` : 'Non ancora iniziato.'}
            </p>
            <div className="card-actions justify-end">
              <Link href="/tabu/progetto/" className="btn btn-primary btn-sm">
                {project ? 'Modifica' : 'Inizia'}
                <ArrowRightIcon size={16} weight="bold" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <section className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">
              <UsersThreeIcon size={24} weight="duotone" aria-hidden />
              Progetti della Co.Ca.
            </h2>
            <p>
              {filledSentence(stats.filled, stats.leaders, year)}
            </p>
            {stats.latest.length > 0 && (
              <ul className="space-y-2">
                {stats.latest.map(p => (
                  <li key={p.nome} className="flex items-center gap-2 text-sm">
                    <StaffAvatar img={p.img} name={p.nome} size={28} />
                    <span>
                      {firstName(p.nome)} · {formatDate(p.updatedAt)}
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

        <section className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Profilo</h2>
            <div className="flex items-center gap-4">
              <StaffAvatar img={leader.img} name={leader.nome} size={96} />
              <div className="text-sm space-y-1">
                <p>La tua foto compare in:</p>
                <ul className="list-disc list-inside">
                  <li>
                    <Link className="link" href="/coca/">
                      Comunità Capi
                    </Link>
                  </li>
                  {pages.map(p => (
                    <li key={p.href}>
                      <Link className="link" href={p.href}>
                        {p.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="card-actions justify-end">
              <Link href="/tabu/profilo/" className="btn btn-primary btn-sm">
                Cambia foto
                <ArrowRightIcon size={16} weight="bold" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {admin && (
          <section className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">
                <ImagesIcon size={24} weight="duotone" aria-hidden />
                Admin
              </h2>
              <ul className="space-y-1">
                <li>
                  <Link className="link" href="/tabu/admin/staff/">
                    Staff
                  </Link>{' '}
                  · {admin.staff} righe, {admin.withEmail} con accesso
                </li>
                <li>
                  <Link className="link" href="/tabu/admin/media/">
                    Foto e video
                  </Link>{' '}
                  · {admin.media} link
                </li>
                <li>
                  <Link className="link" href="/tabu/admin/totem/">
                    Totem
                  </Link>{' '}
                  · {admin.totem} nomi
                </li>
                <li>
                  <Link className="link" href="/tabu/admin/anni/">
                    Anni scout
                  </Link>{' '}
                  · domanda del progetto
                </li>
              </ul>
            </div>
          </section>
        )}
      </div>

      <CodiceSocio leader />
    </div>
  )
}
