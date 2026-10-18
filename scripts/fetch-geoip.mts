/**
 * Update the MaxMind GeoLite2 database.
 *
 * The credentials live in the project's .env with everything else. geoipupdate
 * reads only /etc/GeoIP.conf, so this writes that file from the environment and
 * then hands over. It holds the same key already present in .env, in one more
 * place only because the tool insists on its own format, and it is mode 600.
 *
 * This used to download the database by hand. It does not any more, because
 * MaxMind changed how downloads authenticate and the old endpoint now refuses
 * every request, valid key or not. geoipupdate is the tool MaxMind ships for
 * exactly this and is what their documentation points at.
 *
 * Usage: npm run fetch-geoip
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { loadEnv } from './load-env.mts'

loadEnv()

const CONF_PATH = '/etc/GeoIP.conf'
/** The full path to the database file, matching src/lib/geo.ts. */
const DB_PATH =
  process.env.OWNMIND_MAXMIND_DB_PATH || '/var/lib/ownmind/geoip/GeoLite2-City.mmdb'
const DB_DIR = path.dirname(DB_PATH)

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

const accountId = process.env.OWNMIND_MAXMIND_ACCOUNT_ID
const licenseKey = process.env.OWNMIND_MAXMIND_LICENSE_KEY

if (!licenseKey) {
  fail(
    'OWNMIND_MAXMIND_LICENSE_KEY is not set and was not found in .env. ' +
      'Get a free key at https://www.maxmind.com/en/geolite2/signup',
  )
}
if (!accountId) {
  fail('OWNMIND_MAXMIND_ACCOUNT_ID is not set. It is on the same page as the key.')
}

console.log(`[geoip] current : ${sizeOf(DB_PATH)} at ${DB_PATH}`)

mkdirSync(DB_DIR, { recursive: true })
writeFileSync(
  CONF_PATH,
  [
    `AccountID ${accountId}`,
    `LicenseKey ${licenseKey}`,
    'EditionIDs GeoLite2-City',
    `DatabaseDirectory ${DB_DIR}`,
    '',
  ].join('\n'),
  { mode: 0o600 },
)

// geoipupdate writes a temporary file and renames it into place, so a running
// reader sees the whole old database or the whole new one.
try {
  const output = execFileSync('geoipupdate', ['-f', CONF_PATH], {
    encoding: 'utf8',
    timeout: 600_000,
  })
  const line = output.trim().split('\n').filter(Boolean).pop() ?? 'updated'
  console.log(`[geoip] ${line}`)
} catch (error) {
  const stderr = (error as { stderr?: string }).stderr?.trim() ?? ''
  if (/401|Unauthorized|licen[cs]e/i.test(stderr)) {
    fail(
      'MaxMind refused the credentials. Check the account id and key at ' +
        'https://www.maxmind.com/en/accounts/current/license-key',
    )
  }
  fail(stderr || `geoipupdate failed: ${(error as Error).message}`)
}

console.log(`[geoip] now     : ${sizeOf(DB_PATH)} at ${DB_PATH}`)
console.log('[geoip] done. Restart the app if it was already running.')