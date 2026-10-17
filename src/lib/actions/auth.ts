'use server'

import { redirect } from 'next/navigation'
import {
  endSession,
  findUserByEmail,
  hashPassword,
  insertUser,
  startSession,
  verifyPassword,
} from '@/lib/session'
import { db, newId, nowIso } from '@/lib/db'
import {
  createOtpCode,
  sendOtpCode,
  verifyOtpCode,
  invalidateOtps,
  type OtpPurpose,
} from '@/lib/otp'
import { generateCaptcha, verifyCaptcha } from '@/lib/captcha'

export type AuthState = {
  error?: string
  sent?: boolean
  fieldErrors?: {
    email?: string
    password?: string
    name?: string
    captcha?: string
    otpCode?: string
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]{2,}$/
const MIN_PASSWORD = 10
const PENDING_TTL_MINUTES = 30

function validateEmail(email: string, password: string, name?: string): AuthState | null {
  const fieldErrors: NonNullable<AuthState['fieldErrors']> = {}

  if (!email) fieldErrors.email = 'Enter your email address.'
  else if (!EMAIL_PATTERN.test(email)) fieldErrors.email = 'That does not look like an email address.'

  if (!password) fieldErrors.password = 'Enter a password.'
  else if (password.length < MIN_PASSWORD) {
    fieldErrors.password = `Use at least ${MIN_PASSWORD} characters.`
  }

  if (name !== undefined && !name.trim()) {
    fieldErrors.name = 'Enter a name, or leave it blank to use your email.'
  }

  return Object.keys(fieldErrors).length > 0 ? { fieldErrors } : null
}

/* -------------------------------------------------------------------------- */
/* Signup: Page 1 — Name + CAPTCHA                                            */
/* -------------------------------------------------------------------------- */

export async function signupStep1(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get('name') ?? '').trim() || undefined
  const captchaToken = String(formData.get('captchaToken') ?? '')
  const captchaAnswer = Number(formData.get('captchaAnswer') ?? -1)

  if (!verifyCaptcha(captchaToken, captchaAnswer)) {
    return { error: 'CAPTCHA verification failed. Please try again.' }
  }

  const token = newId()
  const createdAt = nowIso()
  const expiresAt = new Date(Date.now() + PENDING_TTL_MINUTES * 60_000).toISOString()

  db()
    .prepare(
      `insert into pending_auth (id, kind, email, name, otp_code, otp_sent, token, expires_at, created_at)
       values (?, 'signup', null, ?, null, 0, ?, ?, ?)`,
    )
    .run(token, name, token, expiresAt, createdAt)

  return { sent: true } as unknown as AuthState
}

/* -------------------------------------------------------------------------- */
/* Signup: Page 2 — Email + OTP                                               */
/* -------------------------------------------------------------------------- */

export async function signupStep2(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const token = String(formData.get('token') ?? '')
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const otpCode = String(formData.get('otpCode') ?? '').trim()

  if (!email || !EMAIL_PATTERN.test(email)) {
    return { error: 'Enter a valid email address.' }
  }

  const pending = db()
    .prepare('select * from pending_auth where token = ? and kind = ?')
    .get(token, 'signup') as { id: string; name: string | null; email: string | null; otp_sent: number } | undefined

  if (!pending) {
    return { error: 'Session expired. Please start over.' }
  }

  // Verify OTP if one was already sent for this email/purpose
  if (otpCode) {
    if (!verifyOtpCode(email, otpCode, 'signup')) {
      return { error: 'Invalid or expired code. Request a new one.' }
    }
    invalidateOtps(email, 'signup')
    db()
      .prepare(
        `update pending_auth set email = ?, otp_code = null, otp_sent = 1 where id = ?`,
      )
      .run(email, pending.id)
    return { sent: true } as unknown as AuthState
  }

  // First time on this page: generate and send OTP
  createOtpCode(email, 'signup')
  await sendOtpCode(email, '', 'signup')

  db()
    .prepare(`update pending_auth set email = ?, otp_sent = 1 where id = ?`)
    .run(email, pending.id)

  return { sent: true } as unknown as AuthState
}

/* -------------------------------------------------------------------------- */
/* Signup: Page 3 — Password + OTP verify → create account                    */
/* -------------------------------------------------------------------------- */

export async function signupStep3(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const token = String(formData.get('token') ?? '')
  const password = String(formData.get('password') ?? '')
  const otpCode = String(formData.get('otpCode') ?? '').trim()

  if (!password || password.length < MIN_PASSWORD) {
    return { error: `Use at least ${MIN_PASSWORD} characters.` }
  }

  const pending = db()
    .prepare('select * from pending_auth where token = ? and kind = ?')
    .get(token, 'signup') as {
      id: string
      name: string | null
      email: string | null
    } | undefined

  if (!pending || !pending.email) {
    return { error: 'Session expired. Please start over.' }
  }

  if (!verifyOtpCode(pending.email, otpCode, 'signup')) {
    return { error: 'Invalid or expired code. Request a new one.' }
  }

  if (findUserByEmail(pending.email)) {
    return { error: 'An account already exists for that email. Try signing in instead.' }
  }

  invalidateOtps(pending.email, 'signup')

  const passwordHash = await hashPassword(password)
  const userId = insertUser(pending.email, passwordHash, pending.name)

  db().prepare(`delete from pending_auth where id = ?`).run(token)

  await startSession(userId)
  redirect('/library')
}

/* -------------------------------------------------------------------------- */
/* Signin: Page 1 — Email + CAPTCHA → send OTP                                */
/* -------------------------------------------------------------------------- */

export async function signinStep1(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const captchaToken = String(formData.get('captchaToken') ?? '')
  const captchaAnswer = Number(formData.get('captchaAnswer') ?? -1)

  if (!email || !EMAIL_PATTERN.test(email)) {
    return { error: 'Enter a valid email address.' }
  }

  if (!verifyCaptcha(captchaToken, captchaAnswer)) {
    return { error: 'CAPTCHA verification failed. Please try again.' }
  }

  const token = newId()
  const createdAt = nowIso()
  const expiresAt = new Date(Date.now() + PENDING_TTL_MINUTES * 60_000).toISOString()

  db()
    .prepare(
      `insert into pending_auth (id, kind, email, name, otp_code, otp_sent, token, expires_at, created_at)
       values (?, 'signin', ?, null, null, 0, ?, ?, ?)`,
    )
    .run(token, email, token, expiresAt, createdAt)

  const code = createOtpCode(email, 'signin')
  await sendOtpCode(email, code, 'signin')

  return { sent: true } as unknown as AuthState
}

/* -------------------------------------------------------------------------- */
/* Signin: Page 2 — Password + OTP verify → sign in                           */
/* -------------------------------------------------------------------------- */

export async function signinStep2(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const token = String(formData.get('token') ?? '')
  const password = String(formData.get('password') ?? '')
  const otpCode = String(formData.get('otpCode') ?? '').trim()

  if (!otpCode || otpCode.length !== 6) {
    return { error: 'Enter the 6-digit code sent to your email.' }
  }

  if (!password || password.length < MIN_PASSWORD) {
    return { error: `Use at least ${MIN_PASSWORD} characters.` }
  }

  const pending = db()
    .prepare('select * from pending_auth where token = ? and kind = ?')
    .get(token, 'signin') as { id: string; email: string | null } | undefined

  if (!pending || !pending.email) {
    return { error: 'Session expired. Please start over.' }
  }

  if (!verifyOtpCode(pending.email, otpCode, 'signin')) {
    return { error: 'Invalid or expired code. Request a new one.' }
  }

  const user = findUserByEmail(pending.email)
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { error: 'That email and password do not match an account.' }
  }

  invalidateOtps(pending.email, 'signin')
  db().prepare(`delete from pending_auth where id = ?`).run(token)

  await startSession(user.id)
  redirect('/library')
}

/* -------------------------------------------------------------------------- */
/* Signout                                                                    */
/* -------------------------------------------------------------------------- */

export async function signOut() {
  await endSession()
  redirect('/')
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export async function generateCaptchaAction() {
  return generateCaptcha()
}

/** Prune expired pending_auth rows. Call periodically. */
export function prunePendingAuth(): void {
  db().prepare(`delete from pending_auth where expires_at <= ?`).run(nowIso())
}
