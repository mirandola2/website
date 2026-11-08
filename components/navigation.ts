import type { Icon } from '@phosphor-icons/react'
import { BroadcastIcon, CardsThreeIcon, IdentificationCardIcon, LockKeyIcon, PawPrintIcon } from '@phosphor-icons/react/ssr'

export const DRAWER_ID = 'main-drawer'

// Pages with their own minimal chrome: no site navbar, drawer or footer (e.g. /iban, linked from messages)
const STANDALONE_PATHS = ['/iban']

export function isStandalonePage(pathname: string) {
  return STANDALONE_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))
}

export interface MenuItem {
  label: string
  href?: string
  children?: MenuItem[]
}

export const menuItems: MenuItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Chi Siamo',
    children: [
      { label: "L'Associazione", href: '/associazione' },
      { label: 'Il Gruppo', href: '/gruppo' },
      { label: 'La Comunità Capi', href: '/coca' },
      { label: 'Il Progetto Educativo', href: '/progetto' },
      { label: 'Contatti', href: '/contatti' },
      { label: 'Iscrizioni', href: '/iscrizioni' },
    ],
  },
  {
    label: 'Lupetti e Coccinelle',
    children: [
      { label: 'La Branca L/C', href: '/lc' },
      { label: 'Branco della Roccia Azzurra', href: '/lc/lupetti' },
      { label: 'Cerchio del Bosco Gioioso', href: '/lc/coccinelle' },
      { label: 'Piccole Orme', href: '/lc/piccole-orme' },
      { label: 'Specialità', href: '/lc/specialita' },
      { label: 'Iniziazione Cristiana', href: '/lc/ic' },
    ],
  },
  {
    label: 'Esploratori e Guide',
    children: [
      { label: 'La Branca E/G', href: '/eg' },
      { label: 'Reparto Brownsea', href: '/eg/brownsea' },
      { label: 'Reparto Antares', href: '/eg/antares' },
      { label: 'Campi di Specialità e Competenza', href: '/eg/campetti' },
      { label: 'Specialità e Competenze', href: '/eg/specialita' },
    ],
  },
  {
    label: 'Rover e Scolte',
    children: [
      { label: 'La Branca R/S', href: '/rs' },
      { label: 'Clan Fuoco MdV', href: '/rs/mdv' },
      { label: 'Noviziato', href: '/rs/noviziato' },
      { label: 'Epppi/Ross', href: '/rs/epppi-ross' },
    ],
  },
  {
    label: 'Archivio',
    children: [
      { label: 'Staff del Passato', href: '/archivio-staff' },
      { label: 'Campi e Route', href: '/archivio-campi-route' },
      { label: 'Foto e Video', href: '/media' },
      { label: 'Uniforme e Distintivi', href: '/uniforme' },
      { label: 'Materiali e link', href: '/materiale' },
    ],
  },
]

export interface UtilityItem {
  label: string
  href: string
  icon: Icon
}

// Shown in the header speed dial (desktop and mobile)
export const utilityItems: UtilityItem[] = [
  { label: 'Ricerca Codice Socio', href: '/codice-socio', icon: IdentificationCardIcon },
  { label: 'Traduttore Morse', href: '/morse', icon: BroadcastIcon },
  { label: 'Generatore Alci', href: '/alci', icon: CardsThreeIcon },
  { label: 'Archivio Totem', href: '/totem', icon: PawPrintIcon },
  { label: 'Tabù', href: '/tabu', icon: LockKeyIcon },
]
