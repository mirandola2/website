// Renders the app icons (PWA manifest, iOS home screen) from public/icon.svg.
// The SVG already has the brand purple full-bleed, so the same image also serves as the maskable icon.
// The "MIRANDOLA 2" text uses Eurostile, which falls back to the system sans-serif if not installed.
//
//   npx tsx scripts/make-icons.mts [icon.svg]
import fs from 'node:fs'
import sharp from 'sharp'

const svg = fs.readFileSync(process.argv[2] ?? 'public/icon.svg')
fs.mkdirSync('public/icons', { recursive: true })

async function icon(file: string, size: number) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(`public/icons/${file}`)
}

await icon('icon-192.png', 192)
await icon('icon-512.png', 512)
await icon('apple-touch-icon.png', 180)
