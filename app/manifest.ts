import type { MetadataRoute } from 'next'
import { ICONS_VERSION } from '@/lib/pwa'

type Icon = NonNullable<MetadataRoute.Manifest['icons']>[number]

const png = (file: string, size: number, purpose: Icon['purpose']): Icon => ({
  src: `/icons/${file}.png?v=${ICONS_VERSION}`,
  sizes: `${size}x${size}`,
  type: 'image/png',
  purpose,
})

// "any" only: Chrome ignores the other purposes for shortcuts (see scripts/make-shortcut-icons.mts).
const shortcutIcons = (name: string) => [png(`shortcut-${name}`, 192, 'any')]

// Makes the site installable (Chrome/Edge/Android offer it, Safari on iOS has "Add to Home Screen").
// What works without a connection is decided by public/sw.js. The icons are drawn by scripts/make-icons.mts and scripts/make-shortcut-icons.mts.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Scout Mirandola 2',
    short_name: 'Mirandola 2',
    description: 'Il sito del Gruppo Scout Mirandola 2: Morse, nomi totem, codice socio e il Tabù dei capi.',
    lang: 'it',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#462678',
    theme_color: '#462678',
    icons: [
      png('icon-192', 192, 'any'),
      png('icon-512', 512, 'any'),
      png('maskable-512', 512, 'maskable'),
      png('monochrome-512', 512, 'monochrome'),
    ],
    shortcuts: [
      { name: 'Traduttore Morse', short_name: 'Morse', url: '/morse/', icons: shortcutIcons('morse') },
      { name: 'Nomi Totem', short_name: 'Totem', url: '/totem/', icons: shortcutIcons('totem') },
      { name: 'Tabù', url: '/tabu/', icons: shortcutIcons('tabu') },
    ],
  }
}
