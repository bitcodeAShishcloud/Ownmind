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

import { createHmac, timingSafeEqual } from 'node:crypto'

const CAPTCHA_TTL_SECONDS = 300 // 5 minutes
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET ?? 'ownmind-captcha-default-secret-change-in-production'

export type CaptchaChallenge = {
  question: string
  answer: number
  token: string
}

/** Generate a math CAPTCHA challenge: "What is a + b?" */
export function generateCaptcha(): CaptchaChallenge {
  const a = Math.floor(Math.random() * 20) + 1
  const b = Math.floor(Math.random() * 20) + 1
  const answer = a + b

  const expiry = Date.now() + CAPTCHA_TTL_SECONDS * 1000
  const payload = `${answer}:${expiry}`
  const token = createHmac('sha256', CAPTCHA_SECRET)
    .update(payload)
    .digest('hex')

  return {
    question: `What is ${a} + ${b}?`,
    answer,
    token: `${token}:${expiry}`,
  }
}

/** Verify a CAPTCHA submission. Returns true if the token is valid, unexpired, and the answer matches. */
export function verifyCaptcha(token: string, answer: number): boolean {
  if (!token || typeof answer !== 'number') return false

  const parts = token.split(':')
  if (parts.length !== 2) return false

  const [signature, expiry] = parts
  const expiryMs = Number(expiry)

  // Check expiry.
  if (!expiryMs || expiryMs < Date.now()) return false

  // Recompute expected HMAC for the answer + expiry payload.
  const payload = `${answer}:${expiry}`
  const expected = createHmac('sha256', CAPTCHA_SECRET)
    .update(payload)
    .digest('hex')

  // Constant-time comparison to prevent timing attacks.
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false

  return true
}
