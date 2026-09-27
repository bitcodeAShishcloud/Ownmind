'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { requestPasswordReset, type ResetState } from '@/lib/actions/reset'

const initial: ResetState = {}

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initial)

  if (state.sent) {
    return (
      <div>
        <h1 className="text-2xl">Check your email</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          If an account exists for that address, a reset link is on its way. The link works once
          and expires in an hour.
        </p>
        <Link href="/signin" className="btn btn-outline mt-6 w-full">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl">Reset your password</h1>
      <p className="mt-1.5 mb-6 text-sm text-muted">
        We will email you a link to choose a new one.
      </p>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {state.error ? (
          <p
            role="alert"
            className="rounded-[6px] border border-accent/40 bg-accent-wash px-3 py-2 text-sm text-accent-ink"
          >
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="field"
          />
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending ? <Loader2 size={14} strokeWidth={2} className="animate-spin" /> : null}
          {pending ? 'Sending' : 'Send the link'}
        </button>

        <p className="text-center text-sm text-muted">
          <Link href="/signin" className="text-ink underline underline-offset-2 hover:text-accent-ink">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
