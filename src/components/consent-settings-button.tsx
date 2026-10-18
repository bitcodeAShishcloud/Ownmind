'use client'

import { OPEN_CONSENT_SETTINGS } from './consent-gate'

/**
 * The footer link that reopens the settings.
 *
 * Withdrawal has to be as available as consent was, so this is a plain button
 * in the footer of every page, not buried inside a settings screen. It is a
 * button rather than a link because it opens a dialog rather than navigating.
 */
export function ConsentSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_SETTINGS))}
      className="text-sm text-ink-2 hover:text-accent-ink"
    >
      Cookie settings
    </button>
  )
}