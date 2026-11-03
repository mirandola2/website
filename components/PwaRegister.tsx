'use client'

import { useEffect, useRef } from 'react'
import Cookies from 'js-cookie'
import { usePathname } from 'next/navigation'
import { LEADER_HINT_COOKIE } from '@/lib/leader-hint'
import { isOfflinePath, OFFLINE_PRIVATE, OFFLINE_PUBLIC, storePages } from '@/lib/pwa'

const LAST_STORED_KEY = 'pwa-stored-at'
const STORE_EVERY_MS = 12 * 3600 * 1000

// Registers the service worker (production only: in development it would serve stale files) and
// keeps the pages that work offline up to date: all of them once every 12 hours, and each one again
// when the visitor navigates to it (a client-side navigation does not go through the worker).
export default function PwaRegister() {
  const pathname = usePathname()
  const first = useRef(true)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    let cancelled = false

    async function start() {
      await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      await navigator.serviceWorker.ready
      if (cancelled || !navigator.onLine) return
      let last = 0
      try {
        last = Number(localStorage.getItem(LAST_STORED_KEY)) || 0
      } catch {}
      if (Date.now() - last < STORE_EVERY_MS) return
      // The Tabù pages only for a leader: for anyone else they would just redirect to the login
      await storePages(Cookies.get(LEADER_HINT_COOKIE) ? [...OFFLINE_PUBLIC, ...OFFLINE_PRIVATE] : OFFLINE_PUBLIC)
      try {
        localStorage.setItem(LAST_STORED_KEY, String(Date.now()))
      } catch {}
    }
    start().catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    // The first load went through the worker already
    if (first.current) {
      first.current = false
      return
    }
    if (process.env.NODE_ENV !== 'production' || !navigator.onLine || !isOfflinePath(pathname)) return
    const timer = setTimeout(() => void storePages([location.pathname + location.search]), 1000)
    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
