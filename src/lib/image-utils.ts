'use client'

/**
 * Client side image preparation, done before upload for two reasons: the
 * payload stays small, and we get the dominant colour for free while the pixels
 * are already decoded on the GPU.
 */

export type PreparedImage = {
  dataUrl: string
  accent: string
  width: number
  height: number
}

const MAX_EDGE = 1800
const JPEG_QUALITY = 0.82

function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`
}

/**
 * Average the pixels, but weight towards the centre and skip near white and near
 * black, otherwise a photo with a white sky or a black border reports a flat
 * colour that tells you nothing.
 */
function dominantColour(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const step = Math.max(1, Math.floor(Math.min(width, height) / 64))
  const data = ctx.getImageData(0, 0, width, height).data

  let r = 0
  let g = 0
  let b = 0
  let weight = 0

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4
      const alpha = data[i + 3]
      if (alpha < 128) continue

      const pr = data[i]
      const pg = data[i + 1]
      const pb = data[i + 2]
      const max = Math.max(pr, pg, pb)
      const min = Math.min(pr, pg, pb)
      if (max < 24 || min > 236) continue

      // Saturation proxy, so a washed out background does not dominate.
      const chroma = max - min
      const dx = (x / width - 0.5) * 2
      const dy = (y / height - 0.5) * 2
      const centre = 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy) / 1.414)
      const w = (0.35 + chroma / 255) * (0.6 + centre * 0.4)

      r += pr * w
      g += pg * w
      b += pb * w
      weight += w
    }
  }

  if (weight === 0) return '#8a8178'
  return toHex(r / weight, g / weight, b / weight)
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file)

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Could not read the image.')

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const accent = dominantColour(ctx, width, height)

  // Animated formats lose their animation through a canvas re-encode. Keep them
  // as-is so a saved GIF still moves.
  if (file.type === 'image/gif') {
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    return {
      dataUrl: `data:image/gif;base64,${btoa(binary)}`,
      accent,
      width,
      height,
    }
  }

  return {
    dataUrl: canvas.toDataURL('image/jpeg', JPEG_QUALITY),
    accent,
    width,
    height,
  }
}
