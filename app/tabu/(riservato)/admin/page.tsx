import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/dal'
import { getAdminCounts } from '@/lib/tabu'

export const metadata: Metadata = { title: 'Admin' }

export default async function AdminPage() {
  await requireAdmin()
  const counts = await getAdminCounts()
  const sections = [
    { href: '/tabu/admin/staff/', title: 'Staff', text: `${counts.staff} righe (capi e RS), ${counts.withEmail} con accesso al Tabù` },
    { href: '/tabu/admin/media/', title: 'Foto e video', text: `${counts.media} link alle raccolte` },
    { href: '/tabu/admin/totem/', title: 'Totem', text: `${counts.totem} nomi totem` },
  ]

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-primary">Admin</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {sections.map(s => (
          <Link key={s.href} href={s.href} className="card bg-base-200 hover:shadow-md transition-shadow">
            <div className="card-body">
              <h2 className="card-title">{s.title}</h2>
              <p>{s.text}</p>
            </div>
          </Link>
        ))}
      </div>
      <p className="text-sm opacity-70">Le modifiche compaiono sul sito pubblico entro pochi secondi, senza nuovo deploy.</p>
    </div>
  )
}
