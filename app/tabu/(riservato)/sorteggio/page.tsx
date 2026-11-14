import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireLeader } from '@/lib/dal'
import { formatDate } from '@/lib/format'
import { listOpenDrawsFor } from '@/lib/draw'
import DrawReveal from '@/components/tabu/DrawReveal'

export const metadata: Metadata = { title: 'Sorteggio' }

// The open draws the leader takes part in. With none (all archived, or never picked) the page
// doesn't exist. Who they drew is not in this HTML: DrawReveal asks for it on click.
export default async function DrawPage() {
  const leader = await requireLeader()
  const draws = await listOpenDrawsFor(leader.memberCode)
  if (draws.length === 0) notFound()

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">Sorteggio</h1>
      <p className="opacity-70">Solo tu vedi chi ti è toccato: nemmeno gli admin possono saperlo perché è cifrato.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {draws.map(p => (
          <section key={p.id} className="card bg-base-200">
            <div className="card-body gap-4">
              <div>
                <h2 className="card-title">{p.title}</h2>
                <p className="text-sm opacity-70">{formatDate(p.createdAt)}</p>
              </div>
              <DrawReveal drawId={p.id} />
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
