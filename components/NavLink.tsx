'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const normalize = (p: string) => p.replace(/\/+$/, '') || '/'

export default function NavLink({
  href,
  className = '',
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  const active = normalize(usePathname()) === normalize(href)

  // The Tabù pages are dynamic: prefetching them would run the server (and the session check) on
  // every visit to a public page
  const prefetch = href.startsWith('/tabu') ? false : undefined

  return (
    <Link href={href} prefetch={prefetch} aria-current={active ? 'page' : undefined} className={className}>
      {children}
    </Link>
  )
}
