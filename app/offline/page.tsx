import type { Metadata } from 'next'
import Link from 'next/link'
import Hero from '@/components/Hero'

// Shown by the service worker (public/sw.js) for a page that is not stored when there is no network
export const metadata: Metadata = {
  title: 'Sei offline',
  robots: { index: false, follow: false },
}

const available = [
  { href: '/morse/', label: 'Traduttore Morse' },
  { href: '/totem/', label: 'Nomi Totem' },
  { href: '/codice-socio/', label: 'Codice Socio' },
  { href: '/tabu/progetti/', label: 'Tutti i Progetti dei Capi (Tabù)' },
]

export default function OfflinePage() {
  return (
    <>
      <Hero title="Sei offline" />
      <div className="container py-12 max-w-2xl space-y-6">
        <p className="text-lg">
          Questa pagina non è stata salvata sul dispositivo, quindi serve la connessione per aprirla.
        </p>
        <div>
          <p className="mb-3 font-bold">Si aprono anche senza connessione, se le hai già visitate online:</p>
          <ul className="list-disc ps-6 space-y-1">
            {available.map(page => (
              <li key={page.href}>
                <Link href={page.href} prefetch={false} className="link link-primary">
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
