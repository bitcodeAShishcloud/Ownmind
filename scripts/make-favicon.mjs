/**
 * Renders the OwnMind mark to a real multi-size favicon.ico.
 *
 * Run with: node scripts/make-favicon.mjs
 * Output: src/app/favicon.ico
 *
 * The ICO is written by hand: ICONDIR, one ICONDIRENTRY per size, then a
 * BITMAPINFOHEADER with bottom-up BGRA pixels and an AND mask. Doing it by hand
 * avoids pulling an image library into the dependency tree just for an icon.
 */

import { writeFileSync } from 'node:fs'
import path from 'node:path'

const ACCENT = [0xb4, 0x46, 0x2a] // #B4462A
const GLYPH = [0xf7, 0xf2, 0xec] // #F7F2EC
const SIZES = [16, 32, 48]

/** Signed distance helpers, evaluated in a 32 unit design space. */
function insideRoundedRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false
  const cx = Math.min(Math.max(x, x0 + r), x1 - r)
  const cy = Math.min(Math.max(y, y0 + r), y1 - r)
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= r * r
}

const BARS = [
  { x0: 7.5, y0: 8.5, x1: 24.5, y1: 11.5 },
  { x0: 7.5, y0: 14.5, x1: 24.5, y1: 17.5 },
  { x0: 7.5, y0: 20.5, x1: 18.5, y1: 23.5 },
]

/** Colour of the mark at a point in 32 unit space, as [r, g, b, a]. */
function sample(x, y) {
  if (!insideRoundedRect(x, y, 0, 0, 32, 32, 7)) return [0, 0, 0, 0]
  for (const bar of BARS) {
    if (insideRoundedRect(x, y, bar.x0, bar.y0, bar.x1, bar.y1, 1.5)) {
      return [...GLYPH, 255]
    }
  }
  return [...ACCENT, 255]
}

/** One size rendered with 4x4 supersampling so edges are not jagged. */
function renderBgra(size) {
  const pixels = Buffer.alloc(size * size * 4)
  const scale = 32 / size
  const samples = 4

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0

      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const x = (col + (sx + 0.5) / samples) * scale
          const y = (row + (sy + 0.5) / samples) * scale
          const pixel = sample(x, y)
          // Weight colour by coverage so edges blend rather than darken.
          r += pixel[0] * (pixel[3] / 255)
          g += pixel[1] * (pixel[3] / 255)
          b += pixel[2] * (pixel[3] / 255)
          a += pixel[3]
        }
      }

      const total = samples * samples
      const alpha = a / total
      const norm = alpha === 0 ? 0 : 255 / alpha
      const offset = (row * size + col) * 4

      // ICO stores BGRA, bottom-up rows.
      pixels[offset] = Math.round(Math.min(255, (b / total) * norm))
      pixels[offset + 1] = Math.round(Math.min(255, (g / total) * norm))
      pixels[offset + 2] = Math.round(Math.min(255, (r / total) * norm))
      pixels[offset + 3] = Math.round(alpha)
    }
  }

  return pixels
}

function buildImage(size) {
  const bgra = renderBgra(size)
  const header = Buffer.alloc(40)

  header.writeUInt32LE(40, 0) // biSize
  header.writeInt32LE(size, 4) // biWidth
  header.writeInt32LE(size * 2, 8) // biHeight is doubled: XOR plus AND mask
  header.writeUInt16LE(1, 12) // biPlanes
  header.writeUInt16LE(32, 14) // biBitCount
  header.writeUInt32LE(0, 16) // biCompression, BI_RGB
  header.writeUInt32LE(bgra.length, 20) // biSizeImage

  // AND mask: one bit per pixel, rows padded to 4 bytes. All zero, because the
  // alpha channel already carries the shape.
  const maskRowBytes = Math.ceil(size / 32) * 4
  const mask = Buffer.alloc(maskRowBytes * size)

  return Buffer.concat([header, bgra, mask])
}

const images = SIZES.map(buildImage)

const dir = Buffer.alloc(6)
dir.writeUInt16LE(0, 0) // reserved
dir.writeUInt16LE(1, 2) // type 1, icon
dir.writeUInt16LE(images.length, 4)

const entries = []
let offset = 6 + images.length * 16

SIZES.forEach((size, index) => {
  const entry = Buffer.alloc(16)
  entry.writeUInt8(size === 256 ? 0 : size, 0) // width, 0 means 256
  entry.writeUInt8(size === 256 ? 0 : size, 1) // height
  entry.writeUInt8(0, 2) // palette size
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // colour planes
  entry.writeUInt16LE(32, 6) // bits per pixel
  entry.writeUInt32LE(images[index].length, 8)
  entry.writeUInt32LE(offset, 12)
  entries.push(entry)
  offset += images[index].length
})

const ico = Buffer.concat([dir, ...entries, ...images])
const out = path.join(process.cwd(), 'src', 'app', 'favicon.ico')

writeFileSync(out, ico)
console.log(`wrote ${out} (${ico.length} bytes, sizes ${SIZES.join(', ')})`)
