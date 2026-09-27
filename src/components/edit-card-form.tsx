'use client'

import { useActionState, useState, useTransition } from 'react'
import { Check, Loader2, Pencil } from 'lucide-react'
import { editCard, type SaveState } from '@/lib/actions/cards'
import type { CardView } from '@/lib/cards'

/**
 * Manual override for the automatic title, tags and body. Opens in place so you
 * do not lose your place in the page.
 */
export function EditCardForm({ card }: { card: CardView }) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, startSave] = useTransition()
  const [state, formAction] = useActionState<SaveState, FormData>(editCard, {})

  const busy = saving || state.savedId !== undefined
  const failed = error ?? state.error

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setOpen(true)
            setDone(false)
            setError(null)
          }}
          className="btn btn-outline h-8 text-[0.8125rem]"
        >
          <Pencil size={13} strokeWidth={1.75} />
          Edit title, tags and text
        </button>
        {done || state.savedTitle ? (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Check size={13} strokeWidth={2} />
            Saved
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        startSave(async () => {
          const result = await editCard({}, formData)
          if (result?.error) {
            setError(result.error)
          } else {
            setError(null)
            setOpen(false)
            setDone(true)
          }
        })
      }}
      className="panel flex flex-col gap-3 p-4"
    >
      <input type="hidden" name="id" value={card.id} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="edit-title"
          name="title"
          defaultValue={card.title ?? ''}
          className="field"
          maxLength={300}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-tags" className="text-sm font-medium">
          Tags
        </label>
        <input
          id="edit-tags"
          name="tags"
          defaultValue={card.tags.join(', ')}
          placeholder="typography, muted, reference"
          className="field"
        />
        <p className="text-xs text-muted">Separate tags with commas. Up to 8.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-body" className="text-sm font-medium">
          Text
        </label>
        <textarea
          id="edit-body"
          name="body"
          defaultValue={card.body ?? ''}
          rows={8}
          className="field text-[0.9375rem]"
        />
      </div>

      {failed ? (
        <p role="alert" className="text-sm text-accent-ink">
          {failed}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <button type="submit" className="btn btn-primary h-9" disabled={busy}>
          {busy ? <Loader2 size={14} strokeWidth={2} className="animate-spin" /> : null}
          {busy ? 'Saving' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-ghost h-9"
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
