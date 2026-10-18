/**
 * Guard for the privacy dashboard.
 *
 * This site has no roles table and adding one for a single read only page would
 * be more machinery than the job needs. Instead the dashboard is unlocked with
 * a token from the environment, compared here in constant time.
 *
 * If the token is not configured the page is closed. That is deliberate: a
 * dashboard left open because someone forgot an environment variable would
 * publish every visitor's city and reading habits.
 *
 * Server only.
 */

import { cookies } from 'next/headers'

export const ADMIN_COOKIE = 'ownmind_admin'

function configuredToken(): string | null {
  const token = process.env.OWNMIND_ADMIN_TOKEN
  if (typeof token !== 'string') return null
  const trimmed = token.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Length-independent, content constant-time comparison. Length is not secret
 * here, but an early exit on the first different byte would leak it one byte at
 * a time over enough requests.
 */
export function tokensMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function isAdmin(): Promise<boolean> {
  const expected = configuredToken()
  if (expected === null) return false
  const jar = await cookies()
  const provided = jar.get(ADMIN_COOKIE)?.value
  if (!provided) return false
  return tokensMatch(provided, expected)
}

export function adminConfigured(): boolean {
  return configuredToken() !== null
}

export function adminToken(): string | null {
  return configuredToken()
}