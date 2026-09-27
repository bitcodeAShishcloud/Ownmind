'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { AuthState } from '@/lib/actions/auth'

const initial: AuthState = {}

type Mode = 'signin' | 'signup'

export function AuthForm({
  mode,
  action,
  notice,
}: {
  mode: Mode
  action: (state: AuthState, formData: FormData) => Promise<AuthState>
  /** Shown above the form, for example after a completed password reset. */
  notice?: string
}) {
  const [state, formAction, pending] = useActionState(action, initial)
  const isSignUp = mode === 'signup'

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {notice ? (
        <p
          role="status"
          className="rounded-[6px] border border-line bg-surface-2 px-3 py-2 text-sm text-ink-2"
        >
          {notice}
        </p>
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-[6px] border border-accent/40 bg-accent-wash px-3 py-2 text-sm text-accent-ink"
        >
          {state.error}
        </p>
      ) : null}

      {isSignUp ? (
        <Field
          label="Name"
          name="name"
          type="text"
          autoComplete="name"
          error={state.fieldErrors?.name}
          hint="Optional. Shown in the corner of your workspace."
        />
      ) : null}

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
      />

      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        required
        error={state.fieldErrors?.password}
        hint={isSignUp ? 'At least 10 characters.' : undefined}
      />

      <button type="submit" className="btn btn-primary mt-1 w-full" disabled={pending}>
        {pending ? 'Working' : isSignUp ? 'Create account' : 'Sign in'}
      </button>

      {isSignUp ? null : (
        <p className="-mt-1 text-right text-sm">
          <Link
            href="/forgot-password"
            className="text-muted underline underline-offset-2 hover:text-ink"
          >
            Forgotten your password?
          </Link>
        </p>
      )}

      <p className="text-center text-sm text-muted">
        {isSignUp ? 'Already have an account? ' : 'New to OwnMind? '}
        <Link
          href={isSignUp ? '/signin' : '/signup'}
          className="text-ink underline underline-offset-2 hover:text-accent-ink"
        >
          {isSignUp ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </form>
  )
}

function Field({
  label,
  name,
  type,
  error,
  hint,
  autoComplete,
  required,
}: {
  label: string
  name: string
  type: string
  error?: string
  hint?: string
  autoComplete?: string
  required?: boolean
}) {
  const errorId = `${name}-error`
  const hintId = `${name}-hint`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined}
        className="field"
      />
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-accent-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
