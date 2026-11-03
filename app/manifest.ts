import type { MetadataRoute } from 'next'

// Makes the site installable (Chrome/Edge/Android offer it, Safari on iOS has "Add to Home Screen").
// What works without a connection is decided by public/sw.js. The icons are drawn by scripts/make-icons.mts.
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
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    shortcuts: [
      { name: 'Traduttore Morse', url: '/morse/' },
      { name: 'Nomi Totem', url: '/totem/' },
      { name: 'Tabù', url: '/tabu/' },
    ],
  }
}
