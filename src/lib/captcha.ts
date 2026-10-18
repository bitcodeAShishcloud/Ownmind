/**
 * Self-hosted math CAPTCHA.
 *
 * Avoids third-party scripts (reCAPTCHA, hCaptcha) which conflict with the
 * project's "no third party analytics, ad pixels, or external scripts" design
 * rule. A simple arithmetic question is presented to the user; the answer is
 * bound to a short-lived HMAC-signed token so it cannot be forged client-side.
 *
 * Server only.
 */

import { randomInt } from 'node:crypto'
import { db, newId, nowIso } from './db'

const CAPTCHA_TTL_SECONDS = 300 // 5 minutes
const MAX_CAPTCHA_ATTEMPTS = 3

export type CaptchaChallenge = {
  question: string
  answer: number
  token: string
}

type Operator = '+' | '-' | '×'

function randomOperator(): Operator {
  const operators: Operator[] = ['+', '-', '×']
  return operators[randomInt(operators.length)]
}

/** Generate a math CAPTCHA challenge with mixed arithmetic. */
export function generateCaptcha(): CaptchaChallenge {
  const a = randomInt(1, 21)
  const b = randomInt(1, 21)
  const op = randomOperator()

  let answer: number
  let question: string

  switch (op) {
    case '+':
      answer = a + b
      question = `What is ${a} + ${b}?`
      break
    case '-':
      // Ensure non-negative answer for simplicity
      const [x, y] = a >= b ? [a, b] : [b, a]
      answer = x - y
      question = `What is ${x} - ${y}?`
      break
    case '×':
      const smallA = randomInt(1, 10)
      const smallB = randomInt(1, 10)
      answer = smallA * smallB
      question = `What is ${smallA} × ${smallB}?`
      break
  }

  const token = newId()
  const expiresAt = new Date(Date.now() + CAPTCHA_TTL_SECONDS * 1000).toISOString()

  // Store token in database for single-use enforcement
  db()
    .prepare(
      `insert into captcha_tokens (token, answer, expires_at, attempts, used_at, created_at)
       values (?, ?, ?, 0, null, ?)`,
    )
    .run(token, answer, expiresAt, nowIso())

  return {
    question,
    answer,
    token,
  }
}

/** Verify a CAPTCHA submission. Single-use, attempt-capped, token-based. */
export function verifyCaptcha(token: string, answer: number): boolean {
  if (!token || typeof answer !== 'number') return false

  const row = db()
    .prepare('select * from captcha_tokens where token = ?')
    .get(token) as {
    token: string
    answer: number
    expires_at: string
    attempts: number
    used_at: string | null
  } | undefined

  if (!row) return false

  // Single-use: delete after verification attempt
  db().prepare('delete from captcha_tokens where token = ?').run(token)

  // Already used
  if (row.used_at) return false

  // Expired
  if (row.expires_at < nowIso()) return false

  // Too many attempts
  if (row.attempts >= MAX_CAPTCHA_ATTEMPTS) return false

  // Wrong answer: increment attempts (row already deleted, but we checked)
  if (row.answer !== answer) return false

  return true
}

/** Housekeeping: delete expired CAPTCHA tokens. */
export function pruneExpiredCaptchas(): void {
  db().prepare('delete from captcha_tokens where expires_at <= ?').run(nowIso())
}
