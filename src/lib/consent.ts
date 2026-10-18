/**
 * Consent: the one place that knows what a category is and how a choice is
 * recorded. Imported by both the banner and the server, so the two can never
 * disagree about the shape of a record.
 *
 * Nothing here sends anything. Storing a choice and reporting it are separate
 * acts on purpose, so that reading the choice never causes a request.
 */

import { site } from './site'

/** Bumping this invalidates every stored record and shows the banner again. */
export const CONSENT_VERSION = site.consentVersion

export const CONSENT_STORAGE_KEY = 'cc_consent'

/**
 * Categories the visitor can be asked about. Necessary is deliberately not in
 * this list: it is not a question, it is a statement. It is always on and the
 * UI renders it locked rather than offering a checkbox that does nothing.
 */
export const OPTIONAL_CATEGORIES = [
  'preferences',
  'analytics',
  'location',
  'device',
] as const

export type OptionalCategory = (typeof OPTIONAL_CATEGORIES)[number]

export type Category = 'necessary' | OptionalCategory

export const ALL_CATEGORIES: Category[] = ['necessary', ...OPTIONAL_CATEGORIES]

export type ConsentSource =
  | 'banner_accept_all'
  | 'banner_reject'
  | 'modal_save'
  | 'modal_accept_all'

/**
 * What actually gets stored. Two fields carry the legal weight: without a
 * version there is no way to tell an old choice from a current one, and without
 * a timestamp there is no way to show when consent was given.
 */
export type ConsentRecord = {
  consent_version: string
  timestamp: string
  necessary: true
  preferences: boolean
  analytics: boolean
  location: boolean
  device: boolean
}

export function emptyRecord(): ConsentRecord {
  return {
    consent_version: CONSENT_VERSION,
    timestamp: '',
    necessary: true,
    preferences: false,
    analytics: false,
    location: false,
    device: false,
  }
}

export function allOn(version = CONSENT_VERSION): ConsentRecord {
  return {
    consent_version: version,
    timestamp: new Date().toISOString(),
    necessary: true,
    preferences: true,
    analytics: true,
    location: true,
    device: true,
  }
}

/** Necessary only. What "Reject Non-Essential" produces. */
export function allOff(version = CONSENT_VERSION): ConsentRecord {
  return {
    consent_version: version,
    timestamp: new Date().toISOString(),
    necessary: true,
    preferences: false,
    analytics: false,
    location: false,
    device: false,
  }
}

export function granted(record: ConsentRecord, category: Category): boolean {
  if (category === 'necessary') return true
  return record[category] === true
}

/** How a category is described to the person deciding. Plain words, no jargon. */
export const CATEGORY_COPY: Record<
  Category,
  { label: string; short: string; detail: string }
> = {
  necessary: {
    label: 'Necessary',
    short: 'Always on',
    detail:
      'Security, and remembering this consent choice itself. These cannot be switched off because without them the site cannot remember you said no, and cannot keep you signed in.',
  },
  preferences: {
    label: 'Preferences',
    short: 'Off by default',
    detail:
      'Remembers choices you made about how the site behaves, such as your theme and language.',
  },
  analytics: {
    label: 'Analytics',
    short: 'Off by default',
    detail:
      'Counts which pages are read, how far down they are read, and which outbound links are followed. It does not record what you type.',
  },
  location: {
    label: 'Location',
    short: 'Off by default',
    detail:
      'Works out roughly which city and country the visit came from, using the network address the request already arrived on. Rounded to city level, never a street or a pin on a map.',
  },
  device: {
    label: 'Device info',
    short: 'Off by default',
    detail:
      'Basic facts about the browser and screen so the site can be checked on different devices. No fingerprinting.',
  },
}

export function isOptionalCategory(value: unknown): value is OptionalCategory {
  return (
    typeof value === 'string' &&
    (OPTIONAL_CATEGORIES as readonly string[]).includes(value)
  )
}

/* -------------------------------------------------------------------------- */
/* Storage                                                                     */
/* -------------------------------------------------------------------------- */

function parseStored(raw: string | null): ConsentRecord | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>
    if (parsed.consent_version !== CONSENT_VERSION) return null
    if (typeof parsed.timestamp !== 'string' || !parsed.timestamp) return null
    if (parsed.necessary !== true) return null
    return {
      consent_version: parsed.consent_version,
      timestamp: parsed.timestamp,
      necessary: true,
      preferences: parsed.preferences === true,
      analytics: parsed.analytics === true,
      location: parsed.location === true,
      device: parsed.device === true,
    }
  } catch {
    return null
  }
}

/**
 * Read the stored choice. Anything unreadable, malformed, or written under an
 * older version counts as no choice at all, which is why the version check is
 * part of reading rather than something the banner decides afterwards.
 */
export function readConsent(): ConsentRecord | null {
  if (typeof window === 'undefined') return null
  try {
    return parseStored(window.localStorage.getItem(CONSENT_STORAGE_KEY))
  } catch {
    return null
  }
}

export function writeConsent(record: ConsentRecord): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record))
  } catch {
    // Private mode, or storage is full. The site still works, it just asks
    // again next visit, which is the correct outcome rather than a silent one.
    return
  }
  // Written outside React, so anything subscribed has to be told.
  announce()
}

export function clearConsent(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY)
  } catch {
    return
  }
  announce()
}

/** Normalise a record that arrived over the network before it is trusted. */
export function sanitizeRecord(value: unknown): ConsentRecord | null {
  if (typeof value !== 'object' || value === null) return null
  const input = value as Record<string, unknown>
  if (input.necessary !== true) return null
  return {
    consent_version: CONSENT_VERSION,
    timestamp:
      typeof input.timestamp === 'string' ? input.timestamp : new Date().toISOString(),
    necessary: true,
    preferences: input.preferences === true,
    analytics: input.analytics === true,
    location: input.location === true,
    device: input.device === true,
  }
}

/* -------------------------------------------------------------------------- */
/* Subscription                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The choice lives in localStorage, which is outside React. Subscribing to it
 * rather than copying it into state means the banner, the modal and the
 * analytics collectors all read one value, and a change in one place updates
 * every one of them in the same tick.
 *
 * The parse is cached against the raw string because a snapshot is compared by
 * reference: handing back a fresh object on every call would loop forever.
 */
let cachedRaw: string | null = null
let cachedRecord: ConsentRecord | null = null
const listeners = new Set<() => void>()

function storedRaw(): string | null {
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY)
  } catch {
    return null
  }
}

/** ConsentRecord | null. null means a hydrated browser with no choice made. */
export function consentSnapshot(): ConsentRecord | null {
  const raw = storedRaw()
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedRecord = parseStored(raw)
  }
  return cachedRecord
}

/**
 * The server has no localStorage, and rendering the banner into HTML that the
 * browser then has to replace would be a hydration mismatch. undefined means
 * "not known yet", which is deliberately different from null.
 */
export function consentServerSnapshot(): undefined {
  return undefined
}

export function subscribeToConsent(onChange: () => void): () => void {
  listeners.add(onChange)
  // Another tab making the same choice should be picked up here.
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

function announce() {
  for (const listener of listeners) listener()
}