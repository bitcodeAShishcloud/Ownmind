'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { addSpace, type SaveState } from '@/lib/actions/cards'

export function NewSpaceForm() {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(addSpace, {})

  return (
    <form action={formAction} className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1.5">
        <label htmlFor="space-name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="space-name"
          name="name"
          placeholder="Kitchen tiles"
          className="field"
          maxLength={60}
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <label htmlFor="space-rule" className="text-sm font-medium">
          Rule
        </label>
        <input
          id="space-rule"
          name="rule"
          placeholder="tag:ceramics"
          className="field font-mono !text-[0.8125rem]"
          maxLength={200}
        />
      </div>

      <button type="submit" className="btn btn-primary shrink-0" disabled={pending}>
        {pending ? <Loader2 size={14} strokeWidth={2} className="animate-spin" /> : null}
        Create space
      </button>

      {state.error ? (
        <p role="alert" className="text-sm text-accent-ink sm:w-full">
          {state.error}
        </p>
      ) : null}
      {state.savedTitle && !state.error ? (
        <p role="status" className="text-sm text-muted sm:w-full">
          Added {state.savedTitle}.
        </p>
      ) : null}
    </form>
  )
}
