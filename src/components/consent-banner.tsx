'use client'

import Link from 'next/link'

/**
 * The banner, shown until a choice is made.
 *
 * The three buttons are the same element with the same classes, in the same
 * size and colour, in the same order every time. "Accept All" is deliberately
 * not the primary button: making refusal the harder option is the pattern this
 * whole system exists to avoid, and it is also unlawful.
 */
export function ConsentBanner({
  onAcceptAll,
  onRejectAll,
  onManage,
}: {
  onAcceptAll: () => void
  onRejectAll: () => void
  onManage: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-banner-title"
      aria-describedby="consent-banner-body"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line-strong bg-bg shadow-[0_-1px_0_var(--line),0_-18px_40px_-24px_rgba(0,0,0,0.35)]"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="max-w-2xl">
            <h2
              id="consent-banner-title"
              className="text-[0.9375rem] font-medium leading-snug"
            >
              This site can remember your choices
            </h2>
            <p
              id="consent-banner-body"
              className="mt-1.5 text-sm leading-relaxed text-muted"
            >
              Necessary storage is always on. Everything else — analytics, rough
              location and device details — stays off until you say yes, and you
              can change your mind at any time.{' '}
              <Link
                href="/cookie-policy"
                className="text-ink underline underline-offset-2 hover:text-accent-ink"
              >
                Cookie Policy
              </Link>
              {' · '}
              <Link
                href="/privacy"
                className="text-ink underline underline-offset-2 hover:text-accent-ink"
              >
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Same class on all three, same order every time, no emphasis. And a grid
          rather than a row, so each button gets exactly a third of the width.
          Left to size itself, the shortest label would render the narrowest
          button, which makes one option visually quieter than the others. */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:shrink-0">
            <button type="button" className="btn btn-outline w-full" onClick={onAcceptAll}>
              Accept all
            </button>
            <button type="button" className="btn btn-outline w-full" onClick={onRejectAll}>
              Reject non-essential
            </button>
            <button type="button" className="btn btn-outline w-full" onClick={onManage}>
              Manage preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}