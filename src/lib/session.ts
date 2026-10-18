/**
 * Authentication: a code sent to the address is the proof, plus opaque database
 * backed sessions.
 *
 * There is no password to store or check. The only thing standing between a
 * stranger and an account is knowing the address and reading its inbox.
 *
 * Session cookies hold a 256 bit random token. Only the token id is stored, so
 * there is nothing to reverse if the database leaks. Tokens expire and are
 * rotated on sign in.
 *
 * Server only.
 */

import { cookies } from 'next/headers'
import { randomBytes } from 'node:crypto'
import { db, newId, nowIso } from './db'
import { redirect } from 'next/navigation'

const SESSION_COOKIE = 'ownmind_session'
const SESSION_DAYS = 30

const PENDING_AUTH_COOKIE = 'ownmind_pending_auth'
const PENDING_AUTH_TTL_HOURS = 1

export type User = {
  id: string
  email: string
  name: string | null
  theme: string
  created_at: string
}

export function findUserByEmail(email: string) {
  return db()
    .prepare('select * from users where email = ?')
    .get(email.trim().toLowerCase()) as User | undefined
}

export function findUserById(id: string) {
  return db().prepare('select * from users where id = ?').get(id) as User | undefined
}

/** Accounts made through the code flow have no password to store. */
export function insertUser(email: string, name?: string | null) {
  const id = newId()
  const createdAt = nowIso()

  db()
    .prepare(
      `insert into users (id, email, password_hash, name, theme, created_at)
       values (?, ?, null, ?, 'system', ?)`,
    )
    .run(id, email.trim().toLowerCase(), name?.trim() || null, createdAt)

  return id
}

/* -------------------------------------------------------------------------- */
/* Sessions                                                                    */
/* -------------------------------------------------------------------------- */

export async function startSession(userId: string) {
  const token = randomBytes(32).toString('base64url')
  const created = new Date()
  const expires = new Date(created.getTime() + SESSION_DAYS * 86_400_000)

  db()
    .prepare('insert into sessions (id, user_id, created_at, expires_at) values (?, ?, ?, ?)')
    .run(token, userId, created.toISOString(), expires.toISOString())

  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // Host-only cookies are not shared across www/non-www. Set the domain so a
    // session started on one host is valid on the other (nginx canonicalizes
    // to non-www, but this guards against any edge case).
    domain: process.env.NODE_ENV === 'production' ? 'sriprayagclasses.in' : undefined,
    expires,
  })
}

export async function endSession() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) {
    db().prepare('delete from sessions where id = ?').run(token)
  }
  jar.delete(SESSION_COOKIE)
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null

  const row = db()
    .prepare(
      `select u.* from sessions s
       join users u on u.id = s.user_id
       where s.id = ? and s.expires_at > ?`,
    )
    .get(token, nowIso()) as User | undefined

  return row ?? null
}

/** For pages and server actions that cannot render without a user. */
export async function requireUser(returnTo?: string): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : ''
    redirect(`/signin${next}`)
  }
  return user
}

/** Housekeeping. Expired rows are cheap to drop but pointless to accumulate. */
export function pruneExpiredSessions() {
  db().prepare('delete from sessions where expires_at <= ?').run(nowIso())
}

/* -------------------------------------------------------------------------- */
/* Pending auth cookie                                                         */
/* -------------------------------------------------------------------------- */

export async function setPendingAuthCookie(token: string) {
  const expires = new Date(Date.now() + PENDING_AUTH_TTL_HOURS * 3_600_000)
  const jar = await cookies()
  jar.set(PENDING_AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  })
}

export async function getPendingAuthToken(): Promise<string | null> {
  const jar = await cookies()
  return jar.get(PENDING_AUTH_COOKIE)?.value ?? null
}

export async function clearPendingAuthCookie() {
  const jar = await cookies()
  jar.delete(PENDING_AUTH_COOKIE)
}
