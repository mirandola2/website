'use client'

import Link from 'next/link'
import { XIcon } from '@phosphor-icons/react'

export default function Footer() {
  return (
    <div className="mt-auto">
      <footer className="mt-12 py-5 sm:p-10 bg-primary text-primary-content">
        <div className="container footer md:footer-horizontal text-center place-items-center md:justify-between md:place-items-start md:text-left items-center">
          <aside className="gap-5">
            <div className="space-y-2">
              <p>
                <b>AGESCI Gruppo Mirandola 2 APS</b>
                <br />
                Via Posta, 55 - 41037 Mirandola (MO)
                <br />
                CF: 90043640367
              </p>
              <p suppressHydrationWarning>&copy; {new Date().getFullYear()} - Tutti i diritti riservati</p>
              <nav className="text-accent font-bold" aria-label="Link utili">
                <div className="grid grid-flow-col gap-4">
                  <Link className="link link-hover" href="/privacy-policy">
                    Privacy Policy
                  </Link>
                  <Link className="link link-hover" href="/contatti">
                    Contatti
                  </Link>
                  <button
                    type="button"
                    className="link link-hover text-left"
                    onClick={() => (document.getElementById('credit_modal') as HTMLDialogElement | null)?.showModal()}
                  >
                    Credit
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          <p className="text-2xl font-serif inline md:text-right">
            <i>Eccoci,</i> <br />
            <i>del nostro meglio,</i> <br />
            per <i>essere pronti</i> <br />
            a <i>servire</i>.
          </p>
        </div>
      </footer>

      <dialog id="credit_modal" className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Chiudi">
              <XIcon size={18} weight="bold" aria-hidden />
            </button>
          </form>
          <h3 className="font-bold text-lg text-primary">Credits</h3>
          <p className="py-4 font-normal text-justify">
            Il sito web che stai leggendo è stato sviluppato nel corso di più di dieci anni da{' '}
            <i>Lince Spensierata</i> e poi da <i>Aquila Ambiziosa</i> e tutti coloro che li hanno
            aiutati durante le fasi di costruzione e revisione. Il codice sorgente dell&apos;intero
            sito è disponibile su <i>GitHub/Mirandola2</i>. Essendo open-source, chiunque può
            leggere il codice e migliorarlo.
          </p>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label="Chiudi">chiudi</button>
        </form>
      </dialog>
    </div>
  )
}
