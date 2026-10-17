'use client'

import { useActionState, useRef, useState } from 'react'
import Link from 'next/link'
import type { AuthState } from '@/lib/actions/auth'

const initial: AuthState = {}

type Mode = 'signin' | 'signup'

type Step = 'name' | 'email' | 'otp' | 'password'

export function AuthForm({
  mode,
  action,
  notice,
  captcha: initialCaptcha,
  step: initialStep,
  token,
}: {
  mode: Mode
  action: (state: AuthState, formData: FormData) => Promise<AuthState>
  /** Shown above the form, for example after a completed password reset. */
  notice?: string
  captcha?: { question: string; token: string; answer: number }
  /** Current step in the multi-page flow. */
  step?: Step
  /** Token passed between pages for pending auth state. */
  token?: string
}) {
  const [state, formAction, pending] = useActionState(action, initial)
  const [step, setStep] = useState<Step>(initialStep ?? 'name')
  const [captcha, setCaptcha] = useState<{ question: string; token: string; answer: number } | null>(initialCaptcha ?? null)
  const prevSent = useRef(false)
  const isSignUp = mode === 'signup'

  // When OTP is sent successfully, move to next step.
  // eslint-disable-next-line react-hooks/refs
  if (state.sent && !prevSent.current) {
    prevSent.current = true
    if (step === 'email') {
      setStep('otp')
    }
  }

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

      {/* Hidden token field for multi-page flows */}
      {token ? <input type="hidden" name="token" value={token} /> : null}

      {/* ------------------------------------------------------------------ */}
      {/* Signup Page 1: Name + CAPTCHA                                      */}
      {/* ------------------------------------------------------------------ */}
      {isSignUp && step === 'name' ? (
        <>
          <Field
            label="Name"
            name="name"
            type="text"
            autoComplete="name"
            error={state.fieldErrors?.name}
            hint="Optional. Shown in the corner of your workspace."
          />

          <input type="hidden" name="step" value="name" />

          {captcha ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="captcha-answer" className="text-sm font-medium text-ink">
                {captcha.question}
              </label>
              <input
                id="captcha-answer"
                name="captchaAnswer"
                type="number"
                required
                className="field w-[80px]"
              />
              <input type="hidden" name="captchaToken" value={captcha.token} />
            </div>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary mt-1 w-full"
            disabled={pending}
          >
            {pending ? 'Next' : 'Next'}
          </button>
        </>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Signup Page 2: Email (+ OTP auto-sent on load)                     */}
      {/* ------------------------------------------------------------------ */}
      {isSignUp && step === 'email' ? (
        <>
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={state.fieldErrors?.email}
          />

          <input type="hidden" name="step" value="email" />

          <button
            type="submit"
            className="btn btn-primary mt-1 w-full"
            disabled={pending}
          >
            {pending ? 'Sending code' : 'Send code'}
          </button>
        </>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Signup Page 2b: OTP verification (after code sent)                  */}
      {/* ------------------------------------------------------------------ */}
      {isSignUp && step === 'otp' ? (
        <>
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={state.fieldErrors?.email}
            disabled
          />

          <Field
            label="6-digit code"
            name="otpCode"
            type="text"
            maxLength={6}
            required
            error={state.fieldErrors?.otpCode}
            hint="Check your email for the code."
          />

          <input type="hidden" name="step" value="otp" />

          <button
            type="submit"
            className="btn btn-primary mt-1 w-full"
            disabled={pending}
          >
            {pending ? 'Verifying' : 'Verify code'}
          </button>

          <button
            type="button"
            onClick={() => setStep('email')}
            className="btn btn-ghost mt-1 w-full text-sm"
          >
            Request a new code
          </button>
        </>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Signup Page 3: Password + OTP verify                                */}
      {/* ------------------------------------------------------------------ */}
      {isSignUp && step === 'password' ? (
        <>
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            error={state.fieldErrors?.password}
            hint="At least 10 characters."
          />

          <Field
            label="6-digit code"
            name="otpCode"
            type="text"
            maxLength={6}
            required
            error={state.fieldErrors?.otpCode}
            hint="Check your email for the code."
          />

          <input type="hidden" name="step" value="password" />

          <button
            type="submit"
            className="btn btn-primary mt-1 w-full"
            disabled={pending}
          >
            {pending ? 'Creating account' : 'Create account'}
          </button>

          <button
            type="button"
            onClick={() => setStep('email')}
            className="btn btn-ghost mt-1 w-full text-sm"
          >
            Request a new code
          </button>
        </>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Signin Page 1: Email + CAPTCHA                                      */}
      {/* ------------------------------------------------------------------ */}
      {!isSignUp && step === 'name' ? (
        <>
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={state.fieldErrors?.email}
          />

          <input type="hidden" name="step" value="name" />

          {captcha ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="captcha-answer" className="text-sm font-medium text-ink">
                {captcha.question}
              </label>
              <input
                id="captcha-answer"
                name="captchaAnswer"
                type="number"
                required
                className="field w-[80px]"
              />
              <input type="hidden" name="captchaToken" value={captcha.token} />
            </div>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary mt-1 w-full"
            disabled={pending}
          >
            {pending ? 'Sending code' : 'Send code'}
          </button>
        </>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Signin Page 2: Password + OTP verify                                */}
      {/* ------------------------------------------------------------------ */}
      {!isSignUp && step === 'otp' ? (
        <>
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={state.fieldErrors?.email}
            disabled
          />

          <Field
            label="6-digit code"
            name="otpCode"
            type="text"
            maxLength={6}
            required
            error={state.fieldErrors?.otpCode}
            hint="Check your email for the code."
          />

          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            error={state.fieldErrors?.password}
            hint="At least 10 characters."
          />

          <input type="hidden" name="step" value="otp" />

          <button
            type="submit"
            className="btn btn-primary mt-1 w-full"
            disabled={pending}
          >
            {pending ? 'Signing in' : 'Sign in'}
          </button>

          <button
            type="button"
            onClick={() => setStep('name')}
            className="btn btn-ghost mt-1 w-full text-sm"
          >
            Request a new code
          </button>
        </>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Shared links                                                        */}
      {/* ------------------------------------------------------------------ */}
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
  maxLength,
  disabled,
}: {
  label: string
  name: string
  type: string
  error?: string
  hint?: string
  autoComplete?: string
  required?: boolean
  maxLength?: number
  disabled?: boolean
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
        maxLength={maxLength}
        disabled={disabled}
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
