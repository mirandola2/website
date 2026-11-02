'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import type { NavbarLeader } from '@/lib/dal'
import AccountMenu from './AccountMenu'

const sections = [
  { href: '/tabu/', label: 'Bacheca' },
  { href: '/tabu/progetto/', label: 'Il mio progetto' },
  { href: '/tabu/progetti/', label: 'Tutti i progetti' },
]

// Replaces the site navbar under /tabu (HeaderNavbar hides itself there), with the same width
// (px-2 is the padding of daisyUI's .navbar).
// Logged out (login page) it only shows the logo and the title.
export default function TabuNavbar({ leader }: { leader: NavbarLeader | null }) {
  const pathname = usePathname()
  const current = pathname.endsWith('/') ? pathname : `${pathname}/`
  const links = leader?.isAdmin ? [...sections, { href: '/tabu/admin/', label: 'Admin' }] : sections

  const nav = (className: string) => (
    <nav className={className} aria-label="Sezioni del Tabù">
      {links.map(link => {
        const active = link.href === '/tabu/' ? current === link.href : current.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className="shrink-0 rounded-field px-3 py-1.5 transition-colors hover:bg-white/10 aria-[current=page]:bg-white/15 aria-[current=page]:font-bold"
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <header className="sticky top-0 z-50 bg-primary px-2 text-primary-content shadow-md">
      <div className="container max-xl:px-3 flex items-center gap-3 py-2">
        <Link href="/" aria-label="Torna al sito" className="shrink-0">
          <Image src="/img/graphics/logo_white.svg" alt="Logo Scout Mirandola 2" width={96} height={96} className="h-12 w-auto" />
        </Link>
        <Link href={leader ? '/tabu/' : '/tabu/login/'} className="font-display text-3xl leading-none">
          Tabù
        </Link>
        {leader && nav('hidden md:flex items-center gap-1 ms-4')}
        {leader && (
          <div className="ms-auto">
            <AccountMenu leader={leader} />
          </div>
        )}
      </div>
      {/* Small screens: the sections on their own scrollable row */}
      {leader && nav('md:hidden flex gap-1 overflow-x-auto px-3 pb-2 text-sm')}
    </header>
  )
}
