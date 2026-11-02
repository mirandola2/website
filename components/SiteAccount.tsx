'use client'

import Cookies from 'js-cookie'
import { useEffect, useState } from 'react'
import { LEADER_HINT_COOKIE } from '@/lib/leader-hint'
import type { NavbarLeader } from '@/lib/dal'
import AccountMenu from './tabu/AccountMenu'

// The "logged in" icon in the site navbar, with the account menu. The pages are static, so it is
// loaded from the browser, and only when the hint cookie says there is a session (lib/leader-hint.ts).
export default function SiteAccount() {
  const [leader, setLeader] = useState<NavbarLeader | null>(null)

  useEffect(() => {
    if (!Cookies.get(LEADER_HINT_COOKIE)) return
    let active = true
    // A GET route: it only reads, and server actions are meant for writes
    fetch('/api/leader/')
      .then(res => (res.ok ? (res.json() as Promise<NavbarLeader | null>) : null))
      .then(result => {
        // Expired session: drop the hint, so the next pages don't ask again
        if (!result) Cookies.remove(LEADER_HINT_COOKIE)
        if (active) setLeader(result)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return leader && <AccountMenu leader={leader} onSignedOut={() => setLeader(null)} />
}
