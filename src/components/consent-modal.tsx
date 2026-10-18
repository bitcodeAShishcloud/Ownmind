'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CATEGORY_COPY,
  type Category,
  type ConsentRecord,
  OPTIONAL_CATEGORIES,
} from '@/lib/consent'

/**
 * The preferences modal. Also reachable from the footer at any time, which is
 * how consent is withdrawn under the DPDP Act — it has to be as easy to turn
 * something off as it was to turn it on.
 *
 * Necessary is rendered as a locked row, not a checkbox. A switch that cannot
 * move is a lie about being a control, so it reads as a statement instead.
 */
export function ConsentModal({
  record,
  onSave,
  onAcceptAll,
  onCancel,
}: {
  record: ConsentRecord
  onSave: (record: ConsentRecord) => void
  onAcceptAll: () => void
  onCancel: () => void
}) {
  const [choices, setChoices] = useState<Record<Category, boolean>>({
    necessary: true,
    preferences: record.preferences,
    analytics: record.analytics,
    location: record.location,
    device: record.device,
  })

  const toggle = (category: Category) => {
    setChoices((current) => ({ ...current, [category]: !current[category] }))
  }

  const save = () => {
    onSave({
      consent_version: record.consent_version,
      timestamp: new Date().toISOString(),
      necessary: true,
      preferences: choices.preferences,
      analytics: choices.analytics,
      location: choices.location,
      device: choices.device,
    })
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-ink/35 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-modal-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel()
      }}
    >
      <div className="w-full max-w-2xl rounded-t-[10px] border border-line bg-bg shadow-[0_24px_60px_-20px_rgba(0,0,0,0.4)] sm:rounded-[10px]">
        <div className="border-b border-line px-5 py-5 sm:px-7">
          <p className="eyebrow">Privacy</p>
          <h2 id="consent-modal-title" className="mt-2 text-[1.375rem] leading-tight sm:text-[1.5rem]">
            Cookie settings
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Choose what this site may remember. Turning something off stops it
            straight away — you do not need to clear cookies by hand.
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 sm:px-7">
          <Row
            category="necessary"
            locked
            checked
            onToggle={() => {}}
          />

          {OPTIONAL_CATEGORIES.map((category) => (
            <Row
              key={category}
              category={category}
              checked={choices[category]}
              onToggle={() => toggle(category)}
            />
          ))}
        </div>

        <div className="border-t border-line px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn btn-outline" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="btn btn-outline" onClick={onAcceptAll}>
              Accept all
            </button>
            <button type="button" className="btn btn-primary" onClick={save}>
              Save my choices
            </button>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Read the{' '}
            <Link href="/cookie-policy" className="text-ink-2 underline underline-offset-2">
              Cookie Policy
            </Link>{' '}
            for what each one stores and how long it is kept, the{' '}
            <Link href="/privacy" className="text-ink-2 underline underline-offset-2">
              Privacy Policy
            </Link>{' '}
            for who handles it, and{' '}
            <Link href="/data-deletion" className="text-ink-2 underline underline-offset-2">
              how to ask for it to be deleted
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

function Row({
  category,
  checked,
  locked = false,
  onToggle,
}: {
  category: Category
  checked: boolean
  locked?: boolean
  onToggle: () => void
}) {
  const copy = CATEGORY_COPY[category]

  return (
    <div className="border-b border-line py-4 last:border-b-0">
      <div className="flex items-start gap-3">
        {locked ? (
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-[3px] border border-line-strong bg-surface-2 text-[0.625rem] text-muted"
          >
            ✓
          </span>
        ) : (
          <input
            id={`consent-${category}`}
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="mt-1 h-[1.125rem] w-[1.125rem] shrink-0 cursor-pointer accent-[var(--ink)]"
          />
        )}

        <div className="min-w-0 flex-1">
          <label
            htmlFor={locked ? undefined : `consent-${category}`}
            className="flex flex-wrap items-baseline gap-x-2 text-[0.9375rem] font-medium"
          >
            {copy.label}
            <span className="text-xs font-normal text-muted">{copy.short}</span>
          </label>
          <p className="mt-1 text-sm leading-relaxed text-muted">{copy.detail}</p>
        </div>
      </div>
    </div>
  )
}