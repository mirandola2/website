// Draws the icons of the PWA shortcuts (long press on the app icon): the same Phosphor icons
// used in the header speed dial (components/navigation.ts), in white on the brand purple.
// The purple is full bleed and the manifest declares the icons maskable too, so Android fills the whole
// button with it instead of putting a small square inside a white circle.
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
// share of the square taken by the glyph: it stays inside the maskable safe zone (a circle 80% wide)
const GLYPH = 0.5

fs.mkdirSync('public/icons', { recursive: true })

async function shortcutIcon(file: string, glyph: Icon) {
  const inner = Math.round(SIZE * GLYPH)
  const svg = renderToStaticMarkup(createElement(glyph, { size: inner, color: '#fff', weight: 'bold' }))
  const mark = await sharp(Buffer.from(svg), { density: 300 }).resize(inner, inner).png().toBuffer()
  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: BRAND } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(`public/icons/${file}`)
}

await shortcutIcon('shortcut-morse.png', BroadcastIcon)
await shortcutIcon('shortcut-totem.png', PawPrintIcon)
await shortcutIcon('shortcut-tabu.png', LockKeyIcon)
