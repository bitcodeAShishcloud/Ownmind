/**
 * One-time passcodes for email verification.
 *
 * OTP codes are 6-digit numeric, single use and expire after 10 minutes. They
 * are sent via Resend (configured in mail.ts). The `purpose` distinguishes
 * signup, signin and password reset flows so a code from one flow cannot be
 * reused in another.
 *
 * Server only.
 */

import { randomBytes } from 'node:crypto'
import { db, nowIso, newId } from './db'
import { sendEmail, isMailConfigured, logResetLink } from './mail'

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 10
const MAX_ATTEMPTS = 5
const MAX_SEND_PER_EMAIL_PER_HOUR = 5
const MAX_SEND_PER_CALLER_PER_HOUR = 10

export type OtpPurpose = 'signup' | 'signin' | 'password_reset'

export type OtpCode = {
  id: string
  email: string
  code: string
  purpose: OtpPurpose
  expires_at: string
  used_at: string | null
  attempts: number
}

/** Generate a 6-digit numeric OTP code. */
export function generateOtpCode(): string {
  let code = ''
  for (let i = 0; i < OTP_LENGTH; i++) {
    code += String(Math.floor(randomBytes(1)[0] / 256 * 10))
  }
  return code.padStart(OTP_LENGTH, '0')
}

/** Create and store an OTP code for the given email and purpose. Returns the code. */
export function createOtpCode(email: string, purpose: OtpPurpose): string {
  const code = generateOtpCode()
  const id = newId()
  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60_000,
  ).toISOString()

  // Invalidate any existing unused codes for this email + purpose.
  db()
    .prepare(
      `update otp_codes set used_at = ?
       where email = ? and purpose = ? and used_at is null`,
    )
    .run(nowIso(), email.trim().toLowerCase(), purpose)

  db()
    .prepare(
      `insert into otp_codes (id, email, code, purpose, expires_at, used_at, attempts)
       values (?, ?, ?, ?, ?, null, 0)`,
    )
    .run(id, email.trim().toLowerCase(), code, purpose, expiresAt)

  return code
}

/** Send an OTP code by email. Falls back to server log when mail is unconfigured. */
export async function sendOtpCode(
  email: string,
  code: string,
  purpose: OtpPurpose,
): Promise<boolean> {
  const subjectMap: Record<OtpPurpose, string> = {
    signup: `Your OwnMind signup code`,
    signin: `Your OwnMind sign-in code`,
    password_reset: `Your OwnMind password reset code`,
  }

  const bodyMap: Record<OtpPurpose, string> = {
    signup: `Use this code to complete your OwnMind account signup: ${code}\n\nIt expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    signin: `Use this code to complete your OwnMind sign-in: ${code}\n\nIt expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    password_reset: `Use this code to reset your OwnMind password: ${code}\n\nIt expires in ${OTP_EXPIRY_MINUTES} minutes.`,
  }

  const message = {
    to: email,
    subject: subjectMap[purpose],
    text: bodyMap[purpose],
    html: `
      <p>Your OwnMind ${purpose} code is:</p>
      <h2 style="letter-spacing: 4px">${code}</h2>
      <p>It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
    `,
  }

  if (!isMailConfigured()) {
    logResetLink(email, `OTP code: ${code}`)
    return false
  }

  return sendEmail(message)
}

/** Verify an OTP code. Returns true on success, false on invalid/expired/used. */
export function verifyOtpCode(
  email: string,
  code: string,
  purpose: OtpPurpose,
): boolean {
  const normalised = email.trim().toLowerCase()

  const row = db()
    .prepare(
      `select * from otp_codes
       where email = ? and purpose = ? and used_at is null and expires_at > ?
       limit 1`,
    )
    .get(normalised, purpose, nowIso()) as OtpCode | undefined

  if (!row) return false

  // Rate limit: too many failed attempts invalidates the code.
  if (row.attempts >= MAX_ATTEMPTS) return false

  if (row.code !== code) {
    db()
      .prepare('update otp_codes set attempts = attempts + 1 where id = ?')
      .run(row.id)
    return false
  }

  // Mark as used.
  db()
    .prepare('update otp_codes set used_at = ? where id = ?')
    .run(nowIso(), row.id)

  return true
}

/** Invalidate all unused OTP codes for an email and purpose. */
export function invalidateOtps(email: string, purpose: OtpPurpose): void {
  db()
    .prepare(
      `update otp_codes set used_at = ?
       where email = ? and purpose = ? and used_at is null`,
    )
    .run(nowIso(), email.trim().toLowerCase(), purpose)
}

/** Housekeeping: delete expired and used OTP codes. */
export function pruneExpiredOtps(): void {
  db()
    .prepare(
      `delete from otp_codes where expires_at <= ? or used_at is not null`,
    )
    .run(nowIso())
}

/** Send OTP and return whether mail was actually sent. */
export async function requestOtp(
  email: string,
  purpose: OtpPurpose,
): Promise<{ code: string; sent: boolean }> {
  const code = createOtpCode(email, purpose)
  const sent = await sendOtpCode(email, code, purpose)
  return { code, sent }
}

/* -------------------------------------------------------------------------- */
/* Rate limiting                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Check if the rate limit has been exceeded for a given target.
 * Returns true if the request is allowed, false if it should be blocked.
 */
function isAllowed(targetType: 'email' | 'caller', target: string, maxPerHour: number): boolean {
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()

  const count = db()
    .prepare(
      `select count(*) as count from otp_rate_limits
       where target_type = ? and target = ? and created_at > ?`,
    )
    .get(targetType, target, oneHourAgo) as { count: number }

  return count.count < maxPerHour
}

/** Record a rate limit hit for the given target. */
function recordHit(targetType: 'email' | 'caller', target: string): void {
  db()
    .prepare(
      `insert into otp_rate_limits (id, target_type, target, created_at)
       values (?, ?, ?, ?)`,
    )
    .run(newId(), targetType, target, nowIso())
}

/**
 * Check if sending an OTP to the given email is allowed by rate limits.
 * Caller identifier is typically an IP address or session token.
 */
export function canSendOtp(email: string, callerId: string): boolean {
  return isAllowed('email', email, MAX_SEND_PER_EMAIL_PER_HOUR) &&
    isAllowed('caller', callerId, MAX_SEND_PER_CALLER_PER_HOUR)
}

/** Record that an OTP was sent. Call this after a successful send. */
export function recordOtpSend(email: string, callerId: string): void {
  recordHit('email', email)
  recordHit('caller', callerId)
}

/** Housekeeping: delete old rate limit records. */
export function pruneRateLimits(): void {
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()
  db().prepare('delete from otp_rate_limits where created_at <= ?').run(oneHourAgo)
}
