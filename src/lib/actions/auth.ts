'use server'

import { redirect } from 'next/navigation'
import {
  endSession,
  findUserByEmail,
  hashPassword,
  insertUser,
  pruneExpiredSessions,
  startSession,
  verifyPassword,
} from '@/lib/session'

export type AuthState = {
  error?: string
  fieldErrors?: { email?: string; password?: string; name?: string }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MIN_PASSWORD = 10

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

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  pruneExpiredSessions()

  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const name = String(formData.get('name') ?? '')

  const invalid = validateEmail(email, password, name)
  if (invalid) return invalid

  const normalised = email.trim().toLowerCase()
  if (findUserByEmail(normalised)) {
    return { error: 'An account already exists for that email. Try signing in instead.' }
  }

  const passwordHash = await hashPassword(password)
  const userId = insertUser(normalised, passwordHash, name)

  await startSession(userId)
  redirect('/library')
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  pruneExpiredSessions()

  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const invalid = validateEmail(email, password)
  if (invalid) return invalid

  const user = findUserByEmail(email)
  // Same message either way so the form does not confirm which emails exist.
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { error: 'That email and password do not match an account.' }
  }

  await startSession(user.id)
  redirect('/library')
}

export async function signOut() {
  await endSession()
  redirect('/')
}
