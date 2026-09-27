'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { completePasswordReset, type ResetState } from '@/lib/actions/reset'

const initial: ResetState = {}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(completePasswordReset, initial)
  const [value, setValue] = useState('')
  const [confirm, setConfirm] = useState('')

  const mismatch = confirm.length > 0 && value !== confirm
  const tooShort = value.length > 0 && value.length < 10

  return (
    <div>
      <h1 className="text-2xl">Choose a new password</h1>
      <p className="mt-1.5 mb-6 text-sm text-muted">
        At least 10 characters. This signs you out everywhere.
      </p>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="token" value={token} />

        {state.error ? (
          <p
            role="alert"
            className="rounded-[6px] border border-accent/40 bg-accent-wash px-3 py-2 text-sm text-accent-ink"
          >
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-describedby="password-hint"
            className="field"
          />
          <p id="password-hint" className="text-sm text-muted">
            {tooShort ? (
              <span className="text-accent-ink">{10 - value.length} more characters needed.</span>
            ) : (
              'At least 10 characters.'
            )}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm" className="text-sm font-medium">
            Confirm new password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            aria-invalid={mismatch || undefined}
            className="field"
          />
          {mismatch ? (
            <p role="alert" className="text-sm text-accent-ink">
              The two passwords do not match.
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={pending || value.length < 10 || mismatch}
        >
          {pending ? <Loader2 size={14} strokeWidth={2} className="animate-spin" /> : null}
          {pending ? 'Saving' : 'Change my password'}
        </button>

        <p className="text-center text-sm text-muted">
          <Link
            href="/forgot-password"
            className="text-ink underline underline-offset-2 hover:text-accent-ink"
          >
            Ask for a new link
          </Link>
        </p>
      </form>
    </div>
  )
}
