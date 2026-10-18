'use server'

import { redirect } from 'next/navigation'
import {
  clearPendingAuthCookie,
  endSession,
  findUserByEmail,
  getPendingAuthToken,
  hashPassword,
  insertUser,
  setPendingAuthCookie,
  startSession,
  verifyPassword,
} from '@/lib/session'
import { db, newId, nowIso } from '@/lib/db'
import {
  createOtpCode,
  sendOtpCode,
  verifyOtpCode,
  invalidateOtps,
  canSendOtp,
  recordOtpSend,
} from '@/lib/otp'
import { headers } from 'next/headers'
import { verifyCaptcha, pruneExpiredCaptchas } from '@/lib/captcha'

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

async function getCallerId(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}

/* -------------------------------------------------------------------------- */
/* Signup: Page 1 — Name + CAPTCHA → redirect to email page                   */
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

  prunePendingAuth()

  db()
    .prepare(
      `insert into pending_auth (id, kind, email, name, otp_code, otp_sent, token, expires_at, created_at)
       values (?, 'signup', null, ?, null, 0, ?, ?, ?)`,
    )
    .run(token, name ?? null, token, expiresAt, createdAt)

  await setPendingAuthCookie(token)
  redirect('/signup/email')
}

/* -------------------------------------------------------------------------- */
/* Signup: Page 2 — Email + OTP                                               */
/* -------------------------------------------------------------------------- */

export async function signupSendCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const token = await getPendingAuthToken()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (!email || !EMAIL_PATTERN.test(email)) {
    return { error: 'Enter a valid email address.' }
  }

  const pending = db()
    .prepare('select * from pending_auth where token = ? and kind = ?')
    .get(token ?? '', 'signup') as { id: string } | undefined

  if (!pending) {
    return { error: 'This sign up has expired. Start again from the beginning.' }
  }

  if (findUserByEmail(email)) {
    return { error: 'An account already exists for that address. Sign in instead.' }
  }

  const callerId = await getCallerId()
  if (!canSendOtp(email, callerId)) {
    return { error: 'Too many codes requested. Try again in a few minutes.' }
  }

  const code = createOtpCode(email, 'signup')
  await sendOtpCode(email, code, 'signup')
  recordOtpSend(email, callerId)

  db()
    .prepare('update pending_auth set email = ?, otp_sent = 1 where id = ?')
    .run(email, pending.id)

  return { sent: true }
}

/**
 * Check the code that was sent. The address comes from the saved step, not from
 * the form, so a tampered field cannot redirect the code somewhere else.
 */
export async function signupVerifyCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const token = await getPendingAuthToken()
  const otpCode = String(formData.get('otpCode') ?? '').trim()

  const pending = db()
    .prepare('select * from pending_auth where token = ? and kind = ?')
    .get(token ?? '', 'signup') as { email: string | null } | undefined

  if (!pending?.email) {
    return { error: 'This sign up has expired. Start again from the beginning.' }
  }

  if (otpCode.length !== 6) {
    return { error: 'Enter the six digits from the email.' }
  }

  if (!verifyOtpCode(pending.email, otpCode, 'signup')) {
    return { error: 'That code is not right. Check it and try again.' }
  }

  redirect('/signup/password')
}

/* -------------------------------------------------------------------------- */
/* Signup: Page 3 — Password + OTP verify → create account                    */
/* -------------------------------------------------------------------------- */

export async function signupStep3(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const token = await getPendingAuthToken()
  const password = String(formData.get('password') ?? '')

  if (!password || password.length < MIN_PASSWORD) {
    return { error: `Use at least ${MIN_PASSWORD} characters.` }
  }

  const pending = db()
    .prepare('select * from pending_auth where token = ? and kind = ?')
    .get(token ?? '', 'signup') as {
      id: string
      name: string | null
      email: string | null
    } | undefined

  // otp_sent only turns true once the code has been accepted, which is what
  // makes this screen reachable at all.
  if (!pending?.email) {
    return { error: 'This sign up has expired. Start again from the beginning.' }
  }

  if (findUserByEmail(pending.email)) {
    return { error: 'An account already exists for that address. Sign in instead.' }
  }

  invalidateOtps(pending.email, 'signup')

  const passwordHash = await hashPassword(password)
  const userId = insertUser(pending.email, passwordHash, pending.name)

  db().prepare(`delete from pending_auth where id = ?`).run(token)
  await clearPendingAuthCookie()

  await startSession(userId)
  redirect('/library')
}

/* -------------------------------------------------------------------------- */
/* Signin: Page 1 — Email + CAPTCHA → send OTP → redirect to verify page      */
/* -------------------------------------------------------------------------- */

export async function signinSendCode(
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
    return { error: 'That answer was not right. Try the sum again.' }
  }

  // Checking here means a stranger cannot aim the sign in form at an address
  // they do not own and have it fill that inbox.
  if (!findUserByEmail(email)) {
    return { error: 'No account uses that address. Create one instead.' }
  }

  const callerId = await getCallerId()
  if (!canSendOtp(email, callerId)) {
    return { error: 'Too many codes requested. Try again in a few minutes.' }
  }

  const code = createOtpCode(email, 'signin')
  await sendOtpCode(email, code, 'signin')
  recordOtpSend(email, callerId)

  return { sent: true }
}

/**
 * Check the code, then open a short-lived step for the password. The account is
 * not unlocked yet — that only happens once the password matches.
 */
export async function signinVerifyCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const otpCode = String(formData.get('otpCode') ?? '').trim()

  if (otpCode.length !== 6) {
    return { error: 'Enter the six digits from the email.' }
  }

  if (!verifyOtpCode(email, otpCode, 'signin')) {
    return { error: 'That code is not right. Check it and try again.' }
  }

  prunePendingAuth()

  const token = newId()
  const expiresAt = new Date(Date.now() + PENDING_TTL_MINUTES * 60_000).toISOString()

  db()
    .prepare(
      `insert into pending_auth (id, kind, email, name, otp_code, otp_sent, token, expires_at, created_at)
       values (?, 'signin', ?, null, null, 1, ?, ?, ?)`,
    )
    .run(token, email, token, expiresAt, nowIso())

  await setPendingAuthCookie(token)
  redirect('/signin/password')
}

/* -------------------------------------------------------------------------- */
/* Signin: Page 2 — Password + OTP verify → sign in                           */
/* -------------------------------------------------------------------------- */

export async function signinStep2(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const token = await getPendingAuthToken()
  const password = String(formData.get('password') ?? '')

  if (!password || password.length < MIN_PASSWORD) {
    return { error: `Use at least ${MIN_PASSWORD} characters.` }
  }

  const pending = db()
    .prepare('select * from pending_auth where token = ? and kind = ?')
    .get(token ?? '', 'signin') as { id: string; email: string | null } | undefined

  if (!pending?.email) {
    return { error: 'This sign in has expired. Start again from the beginning.' }
  }

  // OTP was already verified on the previous page — just check password
  const user = findUserByEmail(pending.email)
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { error: 'That email and password do not match an account.' }
  }

  invalidateOtps(pending.email, 'signin')
  db().prepare(`delete from pending_auth where id = ?`).run(token)
  await clearPendingAuthCookie()

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

/**
 * Drop rows for attempts that were never finished. Every new flow clears the
 * slate, so the table stays the size of the last half hour rather than growing
 * for as long as the site is up.
 */
function prunePendingAuth(): void {
  db().prepare(`delete from pending_auth where expires_at <= ?`).run(nowIso())
  pruneExpiredCaptchas()
}