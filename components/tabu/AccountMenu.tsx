'use client'

import Link from 'next/link'
import Cookies from 'js-cookie'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { HouseIcon, SignOutIcon, UserCircleCheckIcon, UserIcon } from '@phosphor-icons/react'
import { LEADER_HINT_COOKIE } from '@/lib/leader-hint'
import type { NavbarLeader } from '@/lib/dal'
import { confirmLeave } from '@/lib/unsaved-changes'

const blur = () => (document.activeElement as HTMLElement | null)?.blur()

// A "logged in" icon opening Tabù / Profilo / Esci (daisyUI dropdown, opens on focus), the same in
// the Tabù navbar and in the site navbar (SiteAccount). Its links are not prefetched: they are
// hidden until the menu opens, and the pages are dynamic.
export default function AccountMenu({ leader, onSignedOut }: { leader: NavbarLeader; onSignedOut?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)
  const inTabu = pathname === '/tabu' || pathname.startsWith('/tabu/')

  async function signOut() {
    if (!confirmLeave()) return
    setLeaving(true)
    // Loaded on demand: this menu is in every page's bundle, the auth client is only needed here
    const { authClient } = await import('@/lib/auth-client')
    await authClient.signOut()
    Cookies.remove(LEADER_HINT_COOKIE)
    if (inTabu) {
      router.push('/tabu/login/')
      router.refresh()
    } else {
      onSignedOut?.()
    }
  }

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        aria-label={`Menu di ${leader.firstName}`}
        title={`Sei nel Tabù come ${leader.firstName}`}
        className="grid size-11 place-items-center rounded-field cursor-pointer text-white transition hover:bg-white/10 active:scale-95 focus-visible:outline-2 focus-visible:outline-white"
      >
        <UserCircleCheckIcon size={28} weight="bold" aria-hidden />
      </div>
      <ul tabIndex={0} className="dropdown-content menu z-10 mt-2 w-48 rounded-box bg-base-100 p-2 text-base-content shadow-xl">
        <li className="menu-title">{leader.firstName}</li>
        {!inTabu && (
          <li>
            <Link href="/tabu/" prefetch={false} onClick={blur}>
              <HouseIcon size={18} aria-hidden />
              Tabù
            </Link>
          </li>
        )}
        <li>
          <Link href="/tabu/profilo/" prefetch={false} onClick={blur}>
            <UserIcon size={18} aria-hidden />
            Profilo
          </Link>
        </li>
        <li>
          <button type="button" onClick={signOut} disabled={leaving}>
            <SignOutIcon size={18} aria-hidden />
            Esci
          </button>
        </li>
      </ul>
    </div>
  )
}
