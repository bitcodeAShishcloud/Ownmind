/**
 * Read and write OwnMind's .env without ever printing a secret.
 *
 * The point is that a key can be rotated from the terminal instead of being
 * pasted into a chat, a ticket or a screenshot. Every command here prints a
 * status, never the value.
 *
 *   npm run env                      list every key and whether it is set
 *   npm run env -- show              same
 *   npm run env -- set KEY=value ...  replace values, keeping the file intact
 *   npm run env -- unset KEY         comment a key out
 *   npm run env -- path              where the file is
 *   npm run env -- check             report anything missing, non zero if broken
 *
 * Values may be quoted if they contain a space:
 *   npm run env -- set OWNMIND_MAIL_FROM="OwnMind <no-reply@example.com>"
 */

import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { ENV_FILE } from './load-env.mts'

/** Never echoed, not even partially, past the first few characters. */
function mask(value: string): string {
  if (value.length === 0) return '(empty)'
  if (value.length <= 8) return '*'.repeat(value.length)
  return `${value.slice(0, 4)}${'*'.repeat(Math.min(value.length - 4, 12))} (${value.length} chars)`
}

/** Values the service cannot run without, or falls back to something unsafe. */
const REQUIRED = ['OWNMIND_DATA_DIR']
const RECOMMENDED = [
  'OWNMIND_MAIL_API_KEY',
  'OWNMIND_MAIL_FROM',
  'OWNMIND_TURNSTILE_SITE_KEY',
  'OWNMIND_TURNSTILE_SECRET_KEY',
  'OWNMIND_ADMIN_TOKEN',
  'OWNMIND_MAXMIND_ACCOUNT_ID',
  'OWNMIND_MAXMIND_LICENSE_KEY',
]

type Entry = { key: string; value: string; line: number }

function parse(text: string): { entries: Entry[]; lines: string[] } {
  const lines = text.split('\n')
  const entries: Entry[] = []
  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const at = trimmed.indexOf('=')
    if (at === -1) return
    entries.push({
      key: trimmed.slice(0, at).trim(),
      value: trimmed.slice(at + 1).trim(),
      line: index,
    })
  })
  return { entries, lines }
}

/** Replace a key in place so the comments and ordering around it survive. */
function setValue(text: string, key: string, value: string): string {
  const { entries, lines } = parse(text)
  const existing = entries.find((e) => e.key === key)

  if (existing) {
    lines[existing.line] = `${key}=${value}`
    return lines.join('\n')
  }

  // Not present yet, so append it rather than silently doing nothing.
  const trailing = text.endsWith('\n') ? '' : '\n'
  return `${text}${trailing}${key}=${value}\n`
}

function unsetValue(text: string, key: string): string | null {
  const { entries, lines } = parse(text)
  const existing = entries.find((e) => e.key === key)
  if (!existing) return null

  lines[existing.line] = `# ${lines[existing.line]}`
  return lines.join('\n')
}

function die(message: string): never {
  console.error(`[env] ${message}`)
  process.exit(1)
}

const args = process.argv.slice(2)
const command = args[0] ?? 'show'

if (command === 'path') {
  console.log(ENV_FILE)
  process.exit(0)
}

if (!existsSync(ENV_FILE)) {
  die(
    `${ENV_FILE} does not exist. Copy .env.example to it and fill in the values:\n` +
      `  cp .env.example ${ENV_FILE} && chmod 600 ${ENV_FILE}`,
  )
}

const text = readFileSync(ENV_FILE, 'utf8')

if (command === 'set') {
  const pairs = args.slice(1)
  if (pairs.length === 0) die('nothing to set. Usage: npm run env -- set KEY=value')
  let next = text
  for (const pair of pairs) {
    const at = pair.indexOf('=')
    if (at === -1) die(`"${pair}" is not KEY=value`)
    const key = pair.slice(0, at).trim()
    const value = pair.slice(at + 1).trim()
    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) die(`"${key}" is not a valid variable name`)
    next = setValue(next, key, value)
    console.log(`  set   ${key} ${mask(value)}`)
  }
  writeFileSync(ENV_FILE, next)
  chmodSync(ENV_FILE, 0o600)
  console.log(`\n[env] written to ${ENV_FILE}, mode 600`)
  console.log('[env] restart the app for it to take effect: systemctl restart ownmind')
  process.exit(0)
}

if (command === 'unset') {
  const keys = args.slice(1)
  if (keys.length === 0) die('nothing to unset. Usage: npm run env -- unset KEY')
  let next = text
  for (const key of keys) {
    const result = unsetValue(next, key)
    if (result === null) {
      console.log(`  skip  ${key} was not set`)
      continue
    }
    next = result
    console.log(`  unset ${key}`)
  }
  writeFileSync(ENV_FILE, next)
  chmodSync(ENV_FILE, 0o600)
  console.log(`\n[env] written to ${ENV_FILE}, mode 600`)
  console.log('[env] restart the app for it to take effect: systemctl restart ownmind')
  process.exit(0)
}

if (command === 'check') {
  const { entries } = parse(text)
  const map = new Map(entries.map((e) => [e.key, e.value]))
  let bad = 0

  console.log(`\n${ENV_FILE}\n`)
  for (const key of REQUIRED) {
    const value = map.get(key)
    const good = Boolean(value)
    if (!good) bad++
    console.log(`  ${good ? 'ok   ' : 'NEED '} ${key}${good ? ` ${mask(value!)}` : ''}`)
  }
  for (const key of RECOMMENDED) {
    const value = map.get(key)
    const good = Boolean(value)
    if (!good) bad++
    console.log(`  ${good ? 'ok   ' : 'warn '} ${key}${good ? ` ${mask(value!)}` : ''}`)
  }

  console.log('')
  if (bad === 0) console.log('[env] everything the service needs is set')
  else console.log(`[env] ${bad} value(s) missing. The site still runs; see .env.example for what each does.`)
  process.exit(bad > 0 && REQUIRED.some((k) => !map.get(k)) ? 1 : 0)
}

if (command !== 'show') die(`unknown command "${command}". Try: show, set, unset, check, path`)

const { entries } = parse(text)
console.log(`\n${ENV_FILE}  (${entries.length} keys, values hidden)\n`)
for (const entry of entries) {
  const tag = entry.value ? 'ok  ' : 'warn'
  console.log(`  ${tag} ${entry.key.padEnd(32)} ${entry.value ? mask(entry.value) : '(not set)'}`)
}
console.log('\n  npm run env -- set KEY=value      change a value')
console.log('  npm run env -- check              what is missing')
console.log('')