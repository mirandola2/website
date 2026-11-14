import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireLeader } from '@/lib/dal'
import { formatDate } from '@/lib/format'
import { listOpenPescheFor } from '@/lib/pesca'
import PescaReveal from '@/components/tabu/PescaReveal'

export const metadata: Metadata = { title: 'Pesca' }

// The open pesche the leader takes part in. With none (all archived, or never picked) the page
// doesn't exist. Who they drew is not in this HTML: PescaReveal asks for it on click.
export default async function PescaPage() {
  const leader = await requireLeader()
  const pesche = await listOpenPescheFor(leader.memberCode)
  if (pesche.length === 0) notFound()

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">Pesca</h1>
      <p className="opacity-70">Solo tu vedi chi hai pescato: nemmeno gli admin lo sanno.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {pesche.map(p => (
          <section key={p.id} className="card bg-base-200">
            <div className="card-body gap-4">
              <div>
                <h2 className="card-title">{p.title}</h2>
                <p className="text-sm opacity-70">{formatDate(p.createdAt)}</p>
              </div>
              <PescaReveal pescaId={p.id} />
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
