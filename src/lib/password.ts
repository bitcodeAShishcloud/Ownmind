/**
 * Password hashing. Kept in its own module with no framework imports so it can
 * be used from server actions, route handlers and tests alike.
 *
 * scrypt is used with a unique random salt per password. Comparison is done in
 * constant time so a wrong password cannot be rejected faster based on how many
 * leading bytes happened to match.
 */

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>

const KEY_LENGTH = 64
const SALT_LENGTH = 16
const SCHEME = 'scrypt'

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_LENGTH)
  const derived = await scrypt(password, salt, KEY_LENGTH)
  return `${SCHEME}$${salt.toString('base64')}$${derived.toString('base64')}`
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, saltPart, hashPart] = stored.split('$')
  if (scheme !== SCHEME || !saltPart || !hashPart) return false

  let expected: Buffer
  try {
    expected = Buffer.from(hashPart, 'base64')
  } catch {
    return false
  }
  if (expected.length === 0) return false

  const actual = await scrypt(password, Buffer.from(saltPart, 'base64'), expected.length)

  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function isAcceptablePassword(password: string) {
  return typeof password === 'string' && password.length >= 10
}
