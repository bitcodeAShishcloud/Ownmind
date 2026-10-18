/**
 * Download the MaxMind GeoLite2 City database.
 *
 * The response is a gzip tarball holding the database plus a licence file and a
 * copyright notice. It is unpacked beside the target and only then renamed into
 * place. Rename on the same filesystem is atomic, so a running reader never
 * holds a half written file: it sees either the whole old database or the whole
 * new one.
 *
 * Needs OWNMIND_MAXMIND_LICENSE_KEY. Without it this exits non zero rather than
 * exiting quietly, because a silent no-op looks like a successful update and
 * leaves a stale database in place.
 *
 * Usage: npm run fetch-geoip
 */

import { mkdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'

const LICENSE_KEY = process.env.OWNMIND_MAXMIND_LICENSE_KEY?.trim()
const DB_PATH =
  process.env.OWNMIND_MAXMIND_DB_PATH || '/var/lib/ownmind/geoip/GeoLite2-City.mmdb'

const EDITION_ID = 'GeoLite2-City'

function fail(message: string): never {
  console.error(`[geoip] ${message}`)
  process.exit(1)
}

function sizeOf(target: string): string {
  try {
    return `${(statSync(target).size / 1_048_576).toFixed(1)} MB`
  } catch {
    return 'not present'
  }
}

async function main() {
  if (!LICENSE_KEY) {
    fail(
      'OWNMIND_MAXMIND_LICENSE_KEY is not set. Get a free key at ' +
        'https://www.maxmind.com/en/geolite2/signup then add it to /etc/ownmind/env',
    )
  }

  const dir = path.dirname(DB_PATH)
  mkdirSync(dir, { recursive: true })

  // A fresh temporary directory per run, so two updates racing cannot unpack
  // over each other.
  const work = mkdtemp()
  const archive = path.join(work, 'geoip.tar.gz')

  console.log(`[geoip] current : ${sizeOf(DB_PATH)} at ${DB_PATH}`)
  console.log(`[geoip] fetching : ${EDITION_ID}`)

  const url =
    'https://download.maxmind.com/app/geoip_download' +
    `?edition_id=${encodeURIComponent(EDITION_ID)}` +
    `&license_key=${encodeURIComponent(LICENSE_KEY)}` +
    '&suffix=tar.gz'

  let body: Uint8Array
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(300_000) })
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        fail(
          'the licence key was rejected. Check it at ' +
            'https://www.maxmind.com/en/accounts/current/license-key',
        )
      }
      fail(`download returned HTTP ${response.status}`)
    }
    body = new Uint8Array(await response.arrayBuffer())
  } catch (error) {
    cleanup(work)
    fail(`download failed: ${(error as Error).message}`)
  }

  writeFileSync(archive, body)

  try {
    execFileSync('tar', ['-xzf', archive, '-C', work], { stdio: 'pipe' })
  } catch (error) {
    cleanup(work)
    fail(`could not unpack the archive: ${(error as Error).message}`)
  }

  const unpacked = path.join(work, `${EDITION_ID}.mmdb`)
  try {
    statSync(unpacked)
  } catch {
    cleanup(work)
    fail(`the archive did not contain ${EDITION_ID}.mmdb`)
  }

  // Stage beside the target, then swap. The first and only moment a running
  // reader could see a new database.
  const staged = `${DB_PATH}.new`
  try {
    renameSync(unpacked, staged)
    renameSync(staged, DB_PATH)
  } catch (error) {
    cleanup(work)
    fail(`could not install the database: ${(error as Error).message}`)
  }

  cleanup(work)

  console.log(`[geoip] now     : ${sizeOf(DB_PATH)} at ${DB_PATH}`)
  console.log('[geoip] done. Restart the app if it was already running.')
}

function mkdtemp(): string {
  const base = path.join(os.tmpdir(), 'ownmind-geoip-')
  return execFileSync('mktemp', ['-d', `${base}XXXXXX`]).toString().trim()
}

function cleanup(dir: string) {
  try {
    rmSync(dir, { recursive: true, force: true })
  } catch {
    // A stray temporary directory is not worth failing a download over.
  }
}

await main()