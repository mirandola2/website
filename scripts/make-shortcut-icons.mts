// Draws the icons of the PWA shortcuts (long press on the app icon): the same Phosphor icons
// used in the header speed dial (components/navigation.ts), in white on a brand purple circle.
// Chrome packs only the "any" icon of a shortcut, and Android shows it as a plain bitmap: a square would
// end up small inside a white circle. Drawn like Android's own shortcut icons (a 44dp circle with a 24dp
// glyph in a 48dp square, transparent around), it fills the button instead.
//
//   npx tsx scripts/make-shortcut-icons.mts
import fs from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import sharp from 'sharp'
import type { Icon } from '@phosphor-icons/react'
import { BroadcastIcon, LockKeyIcon, PawPrintIcon } from '@phosphor-icons/react/ssr'

const BRAND = '#462678'
const SIZE = 192
const CIRCLE = 44 / 48
const GLYPH = 24 / 48

fs.mkdirSync('public/icons', { recursive: true })

async function shortcutIcon(file: string, glyph: Icon) {
  const inner = Math.round(SIZE * GLYPH)
  const svg = renderToStaticMarkup(createElement(glyph, { size: inner, color: '#fff', weight: 'bold' }))
  const mark = await sharp(Buffer.from(svg), { density: 300 }).resize(inner, inner).png().toBuffer()
  const circle = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${(SIZE * CIRCLE) / 2}" fill="${BRAND}"/></svg>`
  await sharp(Buffer.from(circle))
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(`public/icons/${file}`)
}

await shortcutIcon('shortcut-morse.png', BroadcastIcon)
await shortcutIcon('shortcut-totem.png', PawPrintIcon)
await shortcutIcon('shortcut-tabu.png', LockKeyIcon)
