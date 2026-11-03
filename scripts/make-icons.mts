// Draws the app icons (PWA manifest, iOS home screen) from the white logo on the brand purple.
// The logo is on ImageKit, not in the repo (public/img is ignored):
//
//   curl -o logo_white.svg https://ik.imagekit.io/mir2/img/graphics/logo_white.svg
//   npx tsx scripts/make-icons.mts logo_white.svg
import fs from 'node:fs'
import sharp from 'sharp'

const BRAND = '#462678'
const source = process.argv[2]
if (!source) throw new Error('Usage: make-icons.mts <logo_white.svg>')
const svg = fs.readFileSync(source)
fs.mkdirSync('public/icons', { recursive: true })

// `logo` is the share of the icon taken by the logo: maskable icons are cropped by the OS to a
// circle or squircle, so everything important stays inside the central 80% ("safe zone")
async function icon(file: string, size: number, logo: number) {
  const inner = Math.round(size * logo)
  const mark = await sharp(svg, { density: 300 }).resize(inner, inner, { fit: 'contain', background: '#0000' }).png().toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: BRAND } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(`public/icons/${file}`)
}

await icon('icon-192.png', 192, 0.8)
await icon('icon-512.png', 512, 0.8)
await icon('maskable-512.png', 512, 0.6)
await icon('apple-touch-icon.png', 180, 0.8)
