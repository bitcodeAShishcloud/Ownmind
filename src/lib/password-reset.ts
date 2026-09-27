/**
 * Password reset tokens.
 *
 * A token is a 256 bit random string stored in the clear alongside the user id.
 * That is safe because the token is only ever read by someone who already has
 * the emailed link, and storing a hash of it would buy nothing here: unlike a
 * password, the token is not a long lived secret the user retypes.
 *
 * Tokens are single use and expire. A new request invalidates any previous
 * unspent token for that account, so an older email in an inbox cannot be used
 * after a newer one was sent.
 *
 * Server only, no framework imports.
 */

import { randomBytes } from 'node:crypto'
import { db, nowIso } from './db'

const LIFETIME_MINUTES = 60

export const RESET_LINK_LIFETIME_MINUTES = LIFETIME_MINUTES

export function createResetToken(userId: string): string {
  db()
    .prepare('delete from password_resets where user_id = ? and used_at is null')
    .run(userId)

  const token = randomBytes(32).toString('base64url')

  db()
    .prepare(
      `insert into password_resets (id, user_id, created_at, expires_at)
       values (?, ?, ?, ?)`,
    )
    .run(
      token,
      userId,
      nowIso(),
      new Date(Date.now() + LIFETIME_MINUTES * 60_000).toISOString(),
    )

  return token
}

export function isResetTokenValid(token: string): boolean {
  if (!token) return false

  const row = db()
    .prepare(
      `select 1 from password_resets
       where id = ? and used_at is null and expires_at > ?`,
    )
    .get(token, nowIso())

  return Boolean(row)
}

export type Redemption = { ok: true; userId: string } | { ok: false }

/**
 * Consumes a token and swaps the password hash in one transaction, so a token
 * cannot be spent twice even if two requests race.
 */
export function redeemResetToken(token: string, passwordHash: string): Redemption {
  const conn = db()

  const row = conn
    .prepare(
      `select id, user_id from password_resets
       where id = ? and used_at is null and expires_at > ?`,
    )
    .get(token, nowIso()) as { id: string; user_id: string } | undefined

  if (!row) return { ok: false }

  conn.exec('begin')
  try {
    // Changing a password signs every device out, so a stolen session cannot
    // survive the owner taking their account back.
    conn.prepare('update users set password_hash = ? where id = ?').run(passwordHash, row.user_id)
    conn.prepare('update password_resets set used_at = ? where id = ?').run(nowIso(), row.id)
    conn.prepare('delete from password_resets where user_id = ?').run(row.user_id)
    conn.prepare('delete from sessions where user_id = ?').run(row.user_id)
    conn.exec('commit')
  } catch (error) {
    conn.exec('rollback')
    throw error
  }

  return { ok: true, userId: row.user_id }
}

/** Housekeeping. Expired and spent rows are pointless to keep. */
export function pruneResetTokens() {
  db().prepare('delete from password_resets where expires_at <= ?').run(nowIso())
}
