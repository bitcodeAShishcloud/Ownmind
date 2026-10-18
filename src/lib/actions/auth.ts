'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import {
  clearPendingAuthCookie,
  endSession,
  findUserByEmail,
  getPendingAuthToken,
  insertUser,
  setPendingAuthCookie,
  startSession,
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
import { verifyTurnstile } from '@/lib/turnstile'

export type AuthState = {
  error?: string
  sent?: boolean
  fieldErrors?: {
    email?: string
    name?: string
    otpCode?: string
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]{2,}$/
const PENDING_TTL_MINUTES = 30

/**
 * The caller, as the proxy sees them. Only used to rate limit by address and
 * by caller so one person cannot flood one inbox from many turns.
 */
async function getCallerId(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}

/** Every step that sends a code checks the challenge first. */
async function challengePassed(formData: FormData): Promise<AuthState | null> {
  const verdict = await verifyTurnstile(
    String(formData.get('turnstileToken') ?? ''),
    await getCallerId(),
  )
  return verdict.ok ? null : { error: verdict.reason }
}

/** Clear anything older than the window, so the table stays small. */
function prunePendingAuth(): void {
  db().prepare(`delete from pending_auth where expires_at <= ?`).run(nowIso())
}

function pendingFor(token: string | null, kind: 'signup' | 'signin') {
  return db()
    .prepare('select * from pending_auth where token = ? and kind = ?')
    .get(token ?? '', kind) as
    | { id: string; name: string | null; email: string | null }
    | undefined
}

/**
 * Create the account, sign in, and clear the trail. Two people racing on the
 * same address means one insert loses; it is caught and turned into an
 * ordinary message rather than an error page.
 */
async function finishSignup(
  pending: { name: string | null; email: string },
): Promise<AuthState> {
  let userId: string
  try {
    userId = insertUser(pending.email, pending.name)
  } catch {
    // Two people raced on the same address and one insert lost. Say the same
    // thing the sign up page would, rather than showing a failure.
    invalidateOtps(pending.email, 'signup')
    redirect('/signin?exists=1')
  }

  invalidateOtps(pending.email, 'signup')
  await startSession(userId)
  await clearPendingAuthCookie()
  redirect('/library')
}

/* -------------------------------------------------------------------------- */
/* Sign up                                                                     */
/* -------------------------------------------------------------------------- */

/** Sign up, page 1 of 2: the name and the challenge. */
export async function signupStep1(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get('name') ?? '').trim()

  const failed = await challengePassed(formData)
  if (failed) return failed

  prunePendingAuth()

  const token = newId()
  const expiresAt = new Date(Date.now() + PENDING_TTL_MINUTES * 60_000).toISOString()

  db()
    .prepare(
      `insert into pending_auth (id, kind, email, name, otp_code, otp_sent, token, expires_at, created_at)
       values (?, 'signup', null, ?, null, 0, ?, ?, ?)`,
    )
    .run(token, name || null, token, expiresAt, nowIso())

  await setPendingAuthCookie(token)
  redirect('/signup/email')
}

/** Sign up, page 2 of 2: the address, and the code that goes to it. */
export async function signupSendCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (!email || !EMAIL_PATTERN.test(email)) {
    return { error: 'Enter a valid email address.' }
  }

  const failed = await challengePassed(formData)
  if (failed) return failed

  const token = await getPendingAuthToken()
  const pending = pendingFor(token, 'signup')

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
 * Accepting the code creates the account and signs in. There is no third page
 * because there is nothing left to ask.
 */
export async function signupVerifyCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const otpCode = String(formData.get('otpCode') ?? '').trim()

  const pending = pendingFor(await getPendingAuthToken(), 'signup')

  if (!pending?.email) {
    return { error: 'This sign up has expired. Start again from the beginning.' }
  }

  if (otpCode.length !== 6) {
    return { error: 'Enter the six digits from the email.' }
  }

  if (!verifyOtpCode(pending.email, otpCode, 'signup')) {
    return { error: 'That code is not right. Check it and try again.' }
  }

  db().prepare('delete from pending_auth where id = ?').run(pending.id)

  return finishSignup({ name: pending.name, email: pending.email })
}

/* -------------------------------------------------------------------------- */
/* Sign in                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Sign in, page 1 of 2: the address, the challenge, and the code. Address and
 * code are both on the page from the first paint.
 */
export async function signinSendCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (!email || !EMAIL_PATTERN.test(email)) {
    return { error: 'Enter a valid email address.' }
  }

  const failed = await challengePassed(formData)
  if (failed) return failed

  // Checked before anything is sent, so the form cannot be pointed at an
  // address that has nothing to do with the person using it.
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

  // The code is typed into a form of its own, which holds no address, so the
  // flow has to remember it here. Sign up does the same thing on page 1.
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

  return { sent: true }
}

/** Accepting the code signs in. The address was proved by reading the code. */
export async function signinVerifyCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const otpCode = String(formData.get('otpCode') ?? '').trim()

  if (otpCode.length !== 6) {
    return { error: 'Enter the six digits from the email.' }
  }

  // Read the address from the flow record rather than the form. The code is
  // typed into a form of its own that carries no address, and a value the
  // browser sends up is one the browser could have edited.
  const pending = pendingFor(await getPendingAuthToken(), 'signin')
  if (!pending?.email) {
    return { error: 'This sign in has expired. Ask for a new code.' }
  }
  const email = pending.email

  const user = findUserByEmail(email)

  // The same wording either way, so a stranger cannot use the error to learn
  // whether an address has an account.
  if (!user || !verifyOtpCode(email, otpCode, 'signin')) {
    return { error: 'That code is not right. Check it and try again.' }
  }

  prunePendingAuth()
  db().prepare('delete from pending_auth where id = ?').run(pending.id)
  await clearPendingAuthCookie()

  invalidateOtps(email, 'signin')
  await startSession(user.id)
  redirect('/library')
}

/* -------------------------------------------------------------------------- */
/* Sign out                                                                    */
/* -------------------------------------------------------------------------- */

export async function signOut() {
  await endSession()
  redirect('/')
}