'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { DRAWER_ID, isStandalonePage } from './navigation'

function subscribeScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}

// The navbar is always `fixed` (same scroll behaviour on every page, also after client-side
// navigation). Pages under /blog have no coloured Hero band behind it, so a transparent navbar
// would leave the white text unreadable: keep it solid there (BlogLayout leaves room for it).
export default function HeaderNavbar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isBlog = pathname === '/blog' || pathname.startsWith('/blog/')
  const scrolled = useSyncExternalStore(subscribeScroll, () => window.scrollY > 5, () => false)

  // Client-side navigation doesn't reload the page: close the mobile drawer and
  // any focused dropdown or speed dial when one of their links is clicked.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const link = (e.target as Element | null)?.closest?.('a')
      if (!link) return
      if (link.closest('.drawer-side')) {
        const toggle = document.getElementById(DRAWER_ID) as HTMLInputElement | null
        if (toggle) toggle.checked = false
      }
      // The speed dial stays open while focus is inside it
      if (link.closest('.fab') && document.activeElement instanceof HTMLElement) document.activeElement.blur()
      const dropdown = link.closest<HTMLElement>('.dropdown')
      if (dropdown) {
        // Hide the menu right away: otherwise it stays open (hover/focus) over the new page
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        dropdown.classList.add('dropdown-close')
        dropdown.addEventListener('mouseleave', () => dropdown.classList.remove('dropdown-close'), { once: true })
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const solid = scrolled || isBlog

  // The Tabù (leaders' area) has its own navbar (components/tabu/TabuNavbar.tsx)
  if (pathname === '/tabu' || pathname.startsWith('/tabu/')) return null
  if (isStandalonePage(pathname)) return null

  // `data-scrolled` lets the children (e.g. the logo) shrink once the page is scrolled
  return (
    <div
      data-scrolled={scrolled || undefined}
      className={`navbar group/navbar fixed top-0 z-50 text-primary-content transition-[background-color,box-shadow,padding] duration-300 ${
        solid ? 'bg-primary shadow-md' : 'bg-transparent'
      } ${scrolled ? 'py-1' : 'py-2'}`}
    >
      {children}
    </div>
  )
}
