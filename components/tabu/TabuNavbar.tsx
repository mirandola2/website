'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { SignOutIcon } from '@phosphor-icons/react'
import { authClient } from '@/lib/auth-client'
import StaffAvatar from './StaffAvatar'

const sections = [
  { href: '/tabu/', label: 'Bacheca' },
  { href: '/tabu/progetto/', label: 'Il mio progetto' },
  { href: '/tabu/progetti/', label: 'Progetti Co.Ca.' },
  { href: '/tabu/profilo/', label: 'Profilo' },
]

export interface NavbarLeader {
  firstName: string
  img: string | null
  isAdmin: boolean
}

// Replaces the site navbar under /tabu (HeaderNavbar hides itself there). Logged out (login
// page) it only shows the logo and the title.
export default function TabuNavbar({ leader }: { leader: NavbarLeader | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)
  const current = pathname.endsWith('/') ? pathname : `${pathname}/`
  const links = leader?.isAdmin ? [...sections, { href: '/tabu/admin/', label: 'Admin' }] : sections

  async function signOut() {
    setLeaving(true)
    await authClient.signOut()
    router.push('/tabu/login/')
    router.refresh()
  }

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
    <header className="sticky top-0 z-50 bg-primary text-primary-content shadow-md">
      <div className="container max-w-5xl px-4 flex items-center gap-3 py-2">
        <Link href="/" aria-label="Torna al sito" className="shrink-0">
          <Image src="/img/graphics/logo_white.svg" alt="Logo Scout Mirandola 2" width={48} height={48} className="h-12 w-auto" />
        </Link>
        <Link href={leader ? '/tabu/' : '/tabu/login/'} className="font-display text-3xl leading-none">
          Tabù
        </Link>
        {leader && nav('hidden md:flex items-center gap-1 ms-4')}
        {leader && (
          <div className="ms-auto flex items-center gap-2">
            <Link href="/tabu/profilo/" className="flex items-center gap-2" aria-label="Profilo">
              <StaffAvatar img={leader.img} name={leader.firstName} size={40} />
              <span className="hidden sm:inline font-medium">{leader.firstName}</span>
            </Link>
            <button
              type="button"
              className="btn btn-sm btn-ghost text-primary-content hover:bg-white/10 border-0"
              onClick={signOut}
              disabled={leaving}
            >
              <SignOutIcon size={18} weight="bold" aria-hidden />
              Esci
            </button>
          </div>
        )}
      </div>
      {/* Small screens: the sections on their own scrollable row */}
      {leader && nav('md:hidden flex gap-1 overflow-x-auto px-4 pb-2 text-sm')}
    </header>
  )
}
