'use server'

import { redirect } from 'next/navigation'
import { findUserByEmail } from '@/lib/session'
import { hashPassword, isAcceptablePassword } from '@/lib/password'
import { createResetToken, redeemResetToken } from '@/lib/password-reset'
import { logResetLink, passwordResetEmail, sendEmail } from '@/lib/mail'
import { site } from '@/lib/site'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export type ResetState = {
  error?: string
  /** Set once the request is handled, whatever the outcome. */
  sent?: boolean
}

/**
 * Starts a password reset.
 *
 * The response is identical whether or not the email exists, because a
 * different answer is a reliable way to discover which addresses have accounts.
 */
export async function requestPasswordReset(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (!email || !EMAIL_PATTERN.test(email)) {
    return { error: 'Enter the email address on your account.' }
  }

  const user = findUserByEmail(email)

  if (user) {
    const token = createResetToken(user.id)
    const url = `${site.url}/reset-password?token=${encodeURIComponent(token)}`

    logResetLink(user.email, url)
    await sendEmail(passwordResetEmail(user.email, url))
  }

  return { sent: true }
}

export async function completePasswordReset(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const token = String(formData.get('token') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (!token) return { error: 'That reset link is incomplete. Ask for a new one.' }
  if (!isAcceptablePassword(password)) return { error: 'Use at least 10 characters.' }
  if (password !== confirm) return { error: 'The two passwords do not match.' }

  const result = redeemResetToken(token, await hashPassword(password))

  if (!result.ok) {
    return { error: 'That link has expired or has already been used. Ask for a new one.' }
  }

  redirect('/signin?reset=1')
}
