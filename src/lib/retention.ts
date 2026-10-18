/**
 * The data lifecycle: what gets deleted, when, and what happens when someone
 * asks for it to go now.
 *
 * Retention numbers live here and nowhere else, so the policy page, the
 * scheduled job and the tests all read the same value rather than three
 * copies drifting apart.
 *
 * Server only.
 */

import { db, newId, nowIso } from './db'

/** Twelve months, the figure quoted in the privacy policy. */
export const ANALYTICS_RETENTION_DAYS = 365
/** Consent evidence is kept a year from the last time the person spoke to us. */
export const CONSENT_RETENTION_DAYS = 365
/** Server access logs hold an IP address. Short life, enforced by logrotate. */
export const SERVER_LOG_RETENTION_DAYS = 90

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

/** node:sqlite reports affected rows as number | bigint. These counts are small. */
function changed(result: { changes: number | bigint }): number {
  return Number(result.changes)
}

export type RetentionResult = {
  analyticsDeleted: number
  consentDeleted: number
  authHousekeeping: number
  ranAt: string
}

/**
 * Delete everything past its date. Safe to run as often as you like: every
 * statement is a delete bounded by a timestamp, so a second run a minute later
 * removes nothing and does not error.
 */
export function runRetention(): RetentionResult {
  const conn = db()
  const ranAt = nowIso()

  const analyticsDeleted = changed(
    conn.prepare('delete from analytics_events where created_at <= ?').run(daysAgo(ANALYTICS_RETENTION_DAYS)),
  )

  // last_seen_at moves forward whenever the person changes a choice, so a
  // consent log survives while it is still the current decision.
  const consentDeleted = changed(
    conn.prepare('delete from consent_logs where last_seen_at <= ?').run(daysAgo(CONSENT_RETENTION_DAYS)),
  )

  // Sign in housekeeping. Expired rows are of no use to anyone once past.
  const authHousekeeping =
    changed(conn.prepare('delete from pending_auth where expires_at <= ?').run(daysAgo(0))) +
    changed(conn.prepare('delete from otp_codes where expires_at <= ?').run(daysAgo(0)))

  return { analyticsDeleted, consentDeleted, authHousekeeping, ranAt }
}

/* -------------------------------------------------------------------------- */
/* Erasure                                                                    */
/* -------------------------------------------------------------------------- */

export type ErasureResult = {
  accountFound: boolean
  cardsDeleted: number
  spacesDeleted: number
  sessionsDeleted: number
  authRowsDeleted: number
}

/**
 * Delete an account and everything hanging off it.
 *
 * The user row goes last and the foreign keys cascade from it, which is why
 * cards and spaces do not need deleting individually. Nothing in
 * analytics_events is touched: that data never carried an identifier, so there
 * is nothing there to match an email against. That is a privacy property, not
 * an omission.
 */
export function eraseAccount(email: string): ErasureResult {
  const conn = db()
  const normalised = email.trim().toLowerCase()
  const user = conn
    .prepare('select id from users where email = ?')
    .get(normalised) as { id: string } | undefined

  const authRowsDeleted =
    changed(conn.prepare('delete from otp_codes where email = ?').run(normalised)) +
    changed(conn.prepare('delete from pending_auth where email = ?').run(normalised)) +
    changed(conn.prepare('delete from otp_rate_limits where target = ?').run(normalised))

  if (!user) {
    return {
      accountFound: false,
      cardsDeleted: 0,
      spacesDeleted: 0,
      sessionsDeleted: 0,
      authRowsDeleted,
    }
  }

  const count = (sql: string): number => changed(conn.prepare(sql).run(user.id))

  // space_cards and card_links cascade from both sides, so these three are the
  // whole graph.
  const cardsDeleted = count('delete from cards where user_id = ?')
  const spacesDeleted = count('delete from spaces where user_id = ?')
  const sessionsDeleted = count('delete from sessions where user_id = ?')
  count('delete from users where id = ?')

  return {
    accountFound: true,
    cardsDeleted,
    spacesDeleted,
    sessionsDeleted,
    authRowsDeleted,
  }
}

export type DeletionRequest = {
  id: string
  email: string
  details: string | null
  status: string
  createdAt: string
}

export function recordDeletionRequest(
  email: string,
  details: string | null,
): DeletionRequest {
  const id = newId()
  const createdAt = nowIso()
  db()
    .prepare(
      `insert into deletion_requests (id, email, details, status, created_at)
       values (?, ?, ?, 'received', ?)`,
    )
    .run(id, email.trim().toLowerCase(), details, createdAt)
  return { id, email: email.trim().toLowerCase(), details, status: 'received', createdAt }
}

export function recentDeletionRequests(limit = 20): DeletionRequest[] {
  const rows = db()
    .prepare(
      `select id, email, details, status, created_at as createdAt
       from deletion_requests order by created_at desc limit ?`,
    )
    .all(limit) as unknown as DeletionRequest[]
  return rows
}