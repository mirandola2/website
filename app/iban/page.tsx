import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRightIcon } from '@phosphor-icons/react/ssr'
import IbanCard from './IbanCard'

// Shared by link with the families: not indexed (also excluded in robots.ts). The site navbar
// and footer hide themselves here (isStandalonePage in components/navigation.ts).
export const metadata: Metadata = {
  title: 'IBAN',
  description: 'Coordinate bancarie del Gruppo Mirandola 2 per censimenti e campi.',
  robots: { index: false, follow: false },
}

export default function IbanPage() {
  return (
    <div className="min-h-screen bg-base-200">
      <header className="bg-primary text-primary-content">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-2">
          <Link href="/" aria-label="Home - Scout Mirandola 2">
            <Image src="/img/graphics/logo_white.svg" alt="Logo Scout Mirandola 2" width={96} height={96} className="h-12 w-auto" />
          </Link>
          <Link href="/" className="btn btn-ghost btn-sm gap-1 text-primary-content hover:bg-white/10">
            Vai al sito
            <ArrowRightIcon size={16} weight="bold" aria-hidden />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 py-8">
        <IbanCard />
      </div>
    </div>
  )
}
