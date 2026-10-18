/**
 * Load /root/Ownmind/.env into the process environment.
 *
 * Next.js does this for itself, so pages and routes never need it. The npm
 * scripts do: `npm run retention` from a shell has none of the service
 * configuration, and without OWNMIND_DATA_DIR it would quietly open a database
 * in the project directory instead of the real one.
 *
 * Values already in the environment win. Under systemd the service file has
 * already supplied them, and on-disk contents must not override what the
 * process was actually started with.
 */

import { existsSync, readFileSync } from 'node:fs'

export const ENV_FILE = process.env.OWNMIND_ENV_FILE || '/root/Ownmind/.env'

export function loadEnv(file = ENV_FILE): void {
  if (!existsSync(file)) return

  let text: string
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    return
  }

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue

    const at = line.indexOf('=')
    if (at === -1) continue

    const name = line.slice(0, at).trim()
    let value = line.slice(at + 1).trim()

    // Strip one layer of matching quotes, so a value may contain a space.
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1)
    }

    if (name && process.env[name] === undefined) {
      process.env[name] = value
    }
  }
}