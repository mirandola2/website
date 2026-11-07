// Renders the app icons (PWA manifest, iOS home screen) from public/icons/icon_m2.svg, the yellow and
// green fleur-de-lis on the brand purple. The SVG is drawn almost edge to edge, so the logo is taken off
// its background and placed back on the purple with the padding each use needs:
//
// - icon-*.png, apple-touch-icon.png ("any"): the logo spans ANY of the square, so the rounded corners
//   iOS, macOS and Windows apply never touch it.
// - maskable-512.png: Android crops it to a circle, squircle or teardrop. Every pixel of the logo stays
//   inside the safe zone, a centred circle with a radius of 40% of the side (SAFE leaves a margin).
// - monochrome-512.png: for Android themed icons, which ignore the colours and tint the alpha
//   channel with the wallpaper palette. The logo becomes one solid shape, with a thin transparent
//   line separating the fleur-de-lis from the trefoil. Same placement as the maskable icon.
//
//   npx tsx scripts/make-icons.mts [icon.svg]
import fs from 'node:fs'
import sharp from 'sharp'

const BRAND = '#462678'
// share of the side taken by the longer side of the logo, in the "any" icons
const ANY = 0.8
// distance of the farthest logo pixel from the centre, as a share of the side (the spec allows 0.4)
const SAFE = 0.38
// resolution the logo is rendered at before being scaled down
const HI = 2048

// The background is the first <rect> of the file: drop it to get the logo alone, on transparent.
const source = fs.readFileSync(process.argv[2] ?? 'public/icons/icon_m2.svg', 'utf8')
const logoSvg = source.replace(/<rect\b[^>]*\/>/, '')
if (logoSvg === source) throw new Error('No background <rect> found in the SVG')

const { data, info } = await sharp(Buffer.from(logoSvg), { density: (72 * HI) / 512 })
  .resize(HI, HI)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

// Bounding box of the logo, then the farthest opaque pixel from its centre.
let [left, top, right, bottom] = [HI, HI, -1, -1]
for (let y = 0; y < HI; y++)
  for (let x = 0; x < HI; x++)
    if (data[(y * HI + x) * 4 + 3] > 8) {
      left = Math.min(left, x)
      top = Math.min(top, y)
      right = Math.max(right, x)
      bottom = Math.max(bottom, y)
    }
const width = right - left + 1
const height = bottom - top + 1
const [cx, cy] = [left + width / 2, top + height / 2]
let radius = 0
for (let y = top; y <= bottom; y++)
  for (let x = left; x <= right; x++)
    if (data[(y * HI + x) * 4 + 3] > 8) radius = Math.max(radius, Math.hypot(x + 0.5 - cx, y + 0.5 - cy))

const color = await sharp(data, { raw: info }).extract({ left, top, width, height }).png().toBuffer()

// Monochrome: the whole logo in white, with a thin gap along the outline of the green paths (drawn as a
// black stroke, then turned into transparency) so the fleur-de-lis, its stars and its band stay apart
// from the trefoil. Stroke width in the units of the paths: about 2.3 px of the 512 px SVG each.
const GAP = 4.5
const monoSvg = logoSvg
  .replace(/(<path\b[^>]*style="fill:rgb\(2,168,38\)[^"]*"\/>)/g, (path: string) =>
    path + path.replace(/style="[^"]*"/, `style="fill:none;stroke:black;stroke-width:${GAP};stroke-linejoin:round"`),
  )
  .replace(/fill:rgb\((255,234,25|2,168,38)\)/g, 'fill:white')
const mono = await sharp(Buffer.from(monoSvg), { density: (72 * HI) / 512 })
  .resize(HI, HI)
  .ensureAlpha()
  .raw()
  .toBuffer()
for (let i = 0; i < mono.length; i += 4) {
  mono[i + 3] = Math.round((mono[i + 3] * mono[i]) / 255)
  mono[i] = mono[i + 1] = mono[i + 2] = 255
}
const monochrome = await sharp(mono, { raw: info }).extract({ left, top, width, height }).png().toBuffer()

fs.mkdirSync('public/icons', { recursive: true })

/** Draws `logo` scaled by `scale` (output px per rendered px), centred on a `size` square. */
async function icon(file: string, size: number, logo: Buffer, scale: number, background = BRAND) {
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  const mark = await sharp(logo).resize(w, h, { kernel: 'lanczos3' }).png().toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: mark, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) }])
    .png()
    .toFile(`public/icons/${file}`)
}

const anyScale = (size: number) => (size * ANY) / Math.max(width, height)
const safeScale = (size: number) => (size * SAFE) / radius

await icon('icon-192.png', 192, color, anyScale(192))
await icon('icon-512.png', 512, color, anyScale(512))
await icon('apple-touch-icon.png', 180, color, anyScale(180))
await icon('maskable-512.png', 512, color, safeScale(512))
await icon('monochrome-512.png', 512, monochrome, safeScale(512), '#0000')
