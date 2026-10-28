'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { SignOutIcon } from '@phosphor-icons/react'
import { authClient } from '@/lib/auth-client'

const tabs = [
  { href: '/tabu/', label: 'Bacheca' },
  { href: '/tabu/progetto/', label: 'Il mio progetto' },
  { href: '/tabu/progetti/', label: 'Progetti Co.Ca.' },
  { href: '/tabu/profilo/', label: 'Profilo' },
]

export default function TabuNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)
  const all = isAdmin ? [...tabs, { href: '/tabu/admin/', label: 'Admin' }] : tabs
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`

  async function signOut() {
    setLeaving(true)
    await authClient.signOut()
    router.push('/tabu/login/')
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <nav role="tablist" className="tabs tabs-box bg-base-200 flex-wrap" aria-label="Sezioni del Tabù">
        {all.map(tab => {
          const active = tab.href === '/tabu/' ? normalized === tab.href : normalized.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-current={active ? 'page' : undefined}
              className={`tab ${active ? 'tab-active font-bold' : ''}`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
      <button type="button" className="btn btn-ghost btn-sm" onClick={signOut} disabled={leaving}>
        <SignOutIcon size={18} weight="bold" aria-hidden />
        Esci
      </button>
    </div>
  )
}
