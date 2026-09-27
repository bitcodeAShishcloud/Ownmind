/**
 * Local file storage for uploaded images.
 *
 * Uploads are written to `.data/uploads` under a random name. The stored name is
 * always validated against a strict pattern before it is turned into a path, so
 * a crafted request cannot escape the upload directory.
 *
 * Server only.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import path from 'node:path'

const UPLOAD_DIR = path.join(process.env.OWNMIND_DATA_DIR || path.join(process.cwd(), '.data'), 'uploads')

/** Only these names may ever be resolved to a path on disk. */
const SAFE_NAME = /^[a-f0-9]{32}\.(jpg|jpeg|png|webp|gif|mp4|webm)$/

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
}

/** Cap a single upload. Enough for a phone photo after client compression. */
const MAX_BYTES = 12 * 1024 * 1024

export function isSafeName(name: string) {
  return SAFE_NAME.test(name)
}

export function mimeFor(name: string) {
  return MIME[name.split('.').pop() ?? ''] ?? 'application/octet-stream'
}

/** Public URL for a stored file. Served by the /api/media route handler. */
export function mediaUrl(name: string) {
  return `/api/media/${name}`
}

export type StoredMedia = { name: string; url: string; bytes: number }

/**
 * Accepts a data URL, validates the declared mime type, and writes the bytes.
 * Returns null for anything malformed, oversized or of a type we do not store.
 */
export function saveDataUrl(dataUrl: string): StoredMedia | null {
  const match = /^data:([a-z0-9.+/-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl.trim())
  if (!match) return null

  const mime = match[1].toLowerCase()
  const ext = EXT_BY_MIME[mime]
  if (!ext) return null

  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length === 0 || buffer.length > MAX_BYTES) return null

  const name = `${randomBytes(16).toString('hex')}.${ext}`

  mkdirSync(UPLOAD_DIR, { recursive: true })
  writeFileSync(path.join(UPLOAD_DIR, name), buffer)

  return { name, url: mediaUrl(name), bytes: buffer.length }
}

export function readUpload(name: string): Buffer | null {
  if (!isSafeName(name)) return null

  const file = path.join(UPLOAD_DIR, name)
  // Belt and braces: the pattern already blocks separators, this catches anything else.
  if (path.dirname(path.resolve(file)) !== path.resolve(UPLOAD_DIR)) return null
  if (!existsSync(file)) return null

  try {
    return readFileSync(file)
  } catch {
    return null
  }
}
