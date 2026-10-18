'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { ConsentBanner } from './consent-banner'
import { ConsentModal } from './consent-modal'
import * as analytics from '@/lib/analytics-client'
import {
  type ConsentRecord,
  type ConsentSource,
  allOff,
  allOn,
  consentServerSnapshot,
  consentSnapshot,
  subscribeToConsent,
  writeConsent,
} from '@/lib/consent'

/** Dispatched by the footer link so the settings can be reopened from anywhere. */
export const OPEN_CONSENT_SETTINGS = 'ownmind:open-consent-settings'

/**
 * Owns the consent state for the whole site.
 *
 * The choice is read through useSyncExternalStore rather than copied into
 * state, because it lives in localStorage and is not React's to own. That
 * means this component never sets state in an effect, and the collectors below
 * react to the choice changing rather than to a local copy of it going stale.
 *
 * Ordering is the part that matters. Nothing is attached and nothing is sent
 * until a record exists. When one does, the collectors start. When the record
 * changes, start() tears the previous listeners down before attaching new ones,
 * so withdrawing a category genuinely stops it rather than merely hiding what
 * it collected.
 */
export function ConsentGate() {
  // undefined on the server and on the first client render, null once the
  // browser has answered with "no choice made".
  const record = useSyncExternalStore(
    subscribeToConsent,
    consentSnapshot,
    consentServerSnapshot,
  )
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    // null and undefined both mean there is nothing to collect against.
    if (record === undefined || record === null) analytics.stop()
    else analytics.start()
  }, [record])

  useEffect(() => {
    const open = () => setModalOpen(true)
    window.addEventListener(OPEN_CONSENT_SETTINGS, open)
    return () => window.removeEventListener(OPEN_CONSENT_SETTINGS, open)
  }, [])

  /** Save the choice, tell the server it happened. The store update restarts the collectors. */
  const commit = useCallback((next: ConsentRecord, source: ConsentSource) => {
    writeConsent(next)
    setModalOpen(false)
    // Reported whatever the choice says. A refusal is evidence too.
    void analytics.reportConsent(source, next)
  }, [])

  const acceptAll = useCallback(
    () => commit(allOn(), modalOpen ? 'modal_accept_all' : 'banner_accept_all'),
    [commit, modalOpen],
  )

  const rejectAll = useCallback(() => commit(allOff(), 'banner_reject'), [commit])

  // Nothing at all is rendered before the browser has been asked, so the server
  // never emits a banner the client then has to reconcile.
  if (record === undefined) return null

  const bannerOpen = record === null && !modalOpen

  return (
    <>
      {bannerOpen ? (
        <ConsentBanner
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onManage={() => setModalOpen(true)}
        />
      ) : null}

      {modalOpen ? (
        <ConsentModal
          record={record ?? allOff()}
          onSave={(next) => commit(next, 'modal_save')}
          onAcceptAll={acceptAll}
          onCancel={() => setModalOpen(false)}
        />
      ) : null}
    </>
  )
}