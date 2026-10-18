'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * The deletion request form.
 *
 * The address is the only field, because it has to be enough to identify what
 * to delete. Nothing else about the person is asked for, and what they type is
 * sent to our own server and not anywhere else.
 */
export function DeleteDataForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (state === 'busy') return
    setState('busy')
    setResult(null)

    try {
      const response = await fetch('/api/data-deletion', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const body = (await response.json()) as { message?: string; error?: string }
      if (response.ok) {
        setResult({ ok: true, message: body.message ?? 'Done.' })
        setEmail('')
        setState('done')
      } else {
        setResult({ ok: false, message: body.error ?? 'That did not work.' })
        setState('idle')
      }
    } catch {
      setResult({ ok: false, message: 'Could not reach the server. Try again.' })
      setState('idle')
    }
  }

  return (
    <form onSubmit={submit} className="not-prose mt-4 max-w-md" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="deletion-email" className="text-sm font-medium">
          Email address on the account
        </label>
        <input
          id="deletion-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="field"
          disabled={state === 'busy'}
        />
        <p className="text-sm text-muted">
          This cannot be undone. Everything in the account goes.
        </p>
      </div>

      <button
        type="submit"
        className="btn btn-primary mt-4 w-full"
        disabled={state === 'busy'}
      >
        {state === 'busy' ? (
          <Loader2 size={14} strokeWidth={2} className="animate-spin" />
        ) : null}
        {state === 'busy' ? 'Deleting' : 'Delete my account and data'}
      </button>

      {result ? (
        <p
          role="status"
          className={`mt-4 rounded-[6px] border px-3 py-2 text-sm ${
            result.ok
              ? 'border-line bg-bg-alt text-ink-2'
              : 'border-accent/40 bg-accent-wash text-accent-ink'
          }`}
        >
          {result.message}
        </p>
      ) : null}
    </form>
  )
}