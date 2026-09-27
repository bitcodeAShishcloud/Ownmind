'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteAccount } from '@/lib/actions/account'

/** Two step delete: reveal the field, then type the email to confirm. */
export function DeleteAccountButton({ email }: { email: string }) {
  const [confirming, setConfirming] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="btn btn-outline mt-3 h-9 hover:!border-accent hover:!text-accent-ink"
      >
        <Trash2 size={14} strokeWidth={1.75} />
        Delete my account
      </button>
    )
  }

  return (
    <form
      action={async (formData) => {
        setPending(true)
        setError(null)
        // On success this redirects, so the lines below never run.
        const result = await deleteAccount(formData)
        setPending(false)
        if (result?.error) setError(result.error)
      }}
      className="mt-3 flex flex-col gap-2"
    >
      <label htmlFor="confirm-email" className="text-sm font-medium">
        Type {email} to confirm
      </label>
      <input
        id="confirm-email"
        name="confirm"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoComplete="off"
        className="field"
        placeholder={email}
      />
      {error ? (
        <p role="alert" className="text-sm text-accent-ink">
          {error}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending || value.trim() === ''}
          className="btn btn-primary h-9 bg-accent hover:!bg-accent-ink hover:!border-accent-ink"
        >
          {pending ? 'Deleting' : 'Delete everything'}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false)
            setValue('')
            setError(null)
          }}
          disabled={pending}
          className="btn btn-ghost h-9"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
