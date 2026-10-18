'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import type { AuthState } from '@/lib/actions/auth'

const initial: AuthState = {}

type Action = (state: AuthState, formData: FormData) => Promise<AuthState>

/**
 * One screen, one job. Every field a step will ever ask for is on the page from
 * the first paint, so nothing swaps out from under the person filling it in.
 */
type Step = 'name' | 'email' | 'password'

export function AuthForm({
  step,
  action,
  sendAction,
  notice,
  captcha: initialCaptcha,
}: {
  /** The step this screen is on. */
  step: Step
  /** The action that moves the flow forward. */
  action: Action
  /** On the address and code screen, the action that posts the code out. */
  sendAction?: Action
  notice?: string
  captcha?: { question: string; token: string }
}) {
  const [sendState, sendFormAction, sending] = useActionState(sendAction ?? noop, initial)
  const [state, formAction, pending] = useActionState(action, initial)
  const [captcha] = useState(initialCaptcha ?? null)

  const error = state.error ?? sendState.error
  const sent = sendState.sent === true
  const showCaptcha = Boolean(captcha) && step === 'name'

  return (
    <div className="flex flex-col gap-4">
      {notice ? <Notice>{notice}</Notice> : null}
      {sent ? (
        <Notice>
          Check your email. The code is good for ten minutes.
        </Notice>
      ) : null}
      {error ? <Error>{error}</Error> : null}

      {sendAction ? (
        <form action={sendFormAction} className="flex flex-col gap-4 border-b border-line pb-5" noValidate>
          <AddressStep captcha={captcha} pending={sending} />
        </form>
      ) : null}

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {step === 'name' ? (
          <Field
            label="Name"
            name="name"
            type="text"
            autoComplete="name"
            hint="Optional. Shows in the corner of your workspace."
          />
        ) : null}

        {step === 'email' ? <CodeField /> : null}

        {step === 'password' ? (
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            hint="At least 10 characters."
          />
        ) : null}

        {showCaptcha && captcha ? <CaptchaField captcha={captcha} /> : null}

        <button type="submit" className="btn btn-primary w-full" disabled={pending || sending}>
          {pending ? <Loader2 size={14} strokeWidth={2} className="animate-spin" /> : null}
          {step === 'password' ? 'Create account' : 'Continue'}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        {step === 'password' ? 'Already have an account? ' : 'New to OwnMind? '}
        <Link
          href={step === 'password' ? '/signin' : '/signup'}
          className="text-ink underline underline-offset-2 hover:text-accent-ink"
        >
          {step === 'password' ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

/** The address, and on sign in the arithmetic check that goes with it. */
function AddressStep({
  captcha,
  pending,
}: {
  captcha: { question: string; token: string } | null
  pending: boolean
}) {
  return (
    <>
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />

      {captcha ? <CaptchaField captcha={captcha} /> : null}

      <button type="submit" className="btn btn-outline w-full" disabled={pending}>
        {pending ? <Loader2 size={14} strokeWidth={2} className="animate-spin" /> : null}
        {pending ? 'Sending' : 'Send the code'}
      </button>
    </>
  )
}

function CodeField() {
  return (
    <Field
      label="Six-digit code"
      name="otpCode"
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      required
      hint="From the email we just sent."
    />
  )
}

function CaptchaField({ captcha }: { captcha: { question: string; token: string } }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="captcha-answer" className="text-sm font-medium">
        {captcha.question}
      </label>
      <input
        id="captcha-answer"
        name="captchaAnswer"
        type="number"
        inputMode="numeric"
        required
        className="field w-20"
      />
      <input type="hidden" name="captchaToken" value={captcha.token} />
    </div>
  )
}

function Field({
  label,
  name,
  type,
  hint,
  autoComplete,
  required,
  maxLength,
  inputMode,
}: {
  label: string
  name: string
  type: string
  hint?: string
  autoComplete?: string
  required?: boolean
  maxLength?: number
  inputMode?: 'numeric'
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        required={required}
        maxLength={maxLength}
        className="field"
      />
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
    </div>
  )
}

function Error({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-[6px] border border-accent/40 bg-accent-wash px-3 py-2 text-sm text-accent-ink"
    >
      {children}
    </p>
  )
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="text-sm leading-relaxed text-muted">
      {children}
    </p>
  )
}

/** Stand-in for the send action on screens that do not have one. */
async function noop(): Promise<AuthState> {
  return {}
}