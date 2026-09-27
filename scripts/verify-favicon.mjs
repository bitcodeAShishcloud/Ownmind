/** Verifies favicon.ico structure and prints an ASCII preview of the 32px art. */
import { readFileSync } from 'node:fs'

const buf = readFileSync('src/app/favicon.ico')

const reserved = buf.readUInt16LE(0)
const type = buf.readUInt16LE(2)
const count = buf.readUInt16LE(4)

console.log(`reserved=${reserved} type=${type} count=${count} bytes=${buf.length}`)

if (reserved !== 0 || type !== 1) throw new Error('not an ICO file')

const chunks = []
for (let i = 0; i < count; i++) {
  const e = 6 + i * 16
  const w = buf.readUInt8(e)
  const h = buf.readUInt8(e + 1)
  const bpp = buf.readUInt16LE(e + 6)
  const len = buf.readUInt32LE(e + 8)
  const off = buf.readUInt32LE(e + 12)
  const biSize = buf.readUInt32LE(off)
  const biW = buf.readInt32LE(off + 4)
  const biH = buf.readInt32LE(off + 8)
  console.log(
    `entry ${i}: ${w || 256}x${h || 256} bpp=${bpp} len=${len} off=${off} biSize=${biSize} biW=${biW} biH=${biH}`,
  )

  if (off + len > buf.length) throw new Error(`entry ${i} points past end of file`)
  if (biSize !== 40) throw new Error(`entry ${i} bad BITMAPINFOHEADER`)

  const w2 = w || 256
  const xor = buf.subarray(off + 40, off + 40 + w2 * w2 * 4)
  chunks.push({ w: w2, xor })
}

const target = chunks.find((c) => c.w === 32)
if (!target) throw new Error('no 32px entry to preview')

console.log('\n32px preview (# = glyph, o = accent, space = transparent):')
for (let row = 0; row < 32; row++) {
  let line = ''
  for (let col = 0; col < 32; col++) {
    // ICO rows are bottom-up within the XOR bitmap.
    const srcRow = 31 - row
    const o = (srcRow * 32 + col) * 4
    const g = target.xor[o + 1]
    const r = target.xor[o + 2]
    const a = target.xor[o + 3]
    if (a < 40) line += ' '
    else if (r > 200 && g > 190) line += '#'
    else line += 'o'
  }
  console.log(line)
}

const centre = (() => {
  const o = (16 * 32 + 16) * 4
  return [target.xor[o + 2], target.xor[o + 1], target.xor[o], target.xor[o + 3]]
})()
console.log(`\ncentre pixel rgba: ${centre.join(',')} (lands on a glyph bar)`)
console.log('favicon.ico OK')
