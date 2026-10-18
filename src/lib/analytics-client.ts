'use client'

/**
 * The browser half of analytics. Every function here asks one question before
 * it does anything: did this category get consent right now?
 *
 * That question is asked at send time, not at setup time. So withdrawing a
 * category takes effect on the very next event rather than at the next page
 * load, and nothing at all is sent before a choice exists.
 *
 * There is no prefetch, no preload and no early beacon. Before consent, this
 * module has no listeners attached and holds no URLs, so there is nothing for
 * a network panel to show.
 */

import {
  type ConsentRecord,
  readConsent,
} from './consent'

export type DeviceInfo = {
  browser: string | null
  browser_version: string | null
  os: string | null
  screen: string | null
  viewport: string | null
  language: string | null
  timezone: string | null
  device_type: 'mobile' | 'desktop' | null
}

export type GeoInfo = {
  city: string | null
  region: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
}

const TRACK_URL = '/api/track'
const GEO_URL = '/api/geo'
const SESSION_KEY = 'cc_session_id'

/* -------------------------------------------------------------------------- */
/* Session                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A fresh anonymous id per session, in sessionStorage so it disappears when
 * the tab does. It is not a person, not an account, and not stable over time.
 */
function sessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY)
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing
    const fresh =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `s${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
    window.sessionStorage.setItem(SESSION_KEY, fresh)
    return fresh
  } catch {
    // Storage blocked. Still anonymous, just not stable across navigations.
    return `s${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  }
}

/* -------------------------------------------------------------------------- */
/* Deriving                                                                    */
/* -------------------------------------------------------------------------- */

/** From navigator and Intl. No fingerprinting library, and none added later. */
export function collectDevice(): DeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      browser: null,
      browser_version: null,
      os: null,
      screen: null,
      viewport: null,
      language: null,
      timezone: null,
      device_type: null,
    }
  }

  const ua = navigator.userAgent
  const uaLow = ua.toLowerCase()

  const browsers: Array<[string, string]> = [
    ['edg/', 'Edge'],
    ['opr/', 'Opera'],
    ['firefox/', 'Firefox'],
    ['chrome/', 'Chrome'],
    ['safari/', 'Safari'],
  ]
  let browser: string | null = null
  let browserVersion: string | null = null
  for (const [needle, name] of browsers) {
    const at = uaLow.indexOf(needle)
    if (at !== -1) {
      browser = name
      browserVersion = ua.slice(at + needle.length).split(/[ /;]/)[0] ?? null
      break
    }
  }

  let os: string | null = null
  if (/windows nt/i.test(ua)) os = 'Windows'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS'
  else if (/mac os x/i.test(ua)) os = 'macOS'
  else if (/linux/i.test(ua)) os = 'Linux'
  else if (/cros/i.test(ua)) os = 'ChromeOS'

  return {
    browser,
    browser_version: browserVersion,
    os,
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language ?? null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
    device_type: window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop',
  }
}

/* -------------------------------------------------------------------------- */
/* Sending                                                                     */
/* -------------------------------------------------------------------------- */

type Payload = Record<string, unknown>

/**
 * Report a consent decision. Deliberately separate from the event path: a
 * consent log is the record of the choice itself and is sent whatever the
 * categories say, because refusing everything still has to be provable.
 */
export async function reportConsent(
  source: string,
  record: ConsentRecord,
): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await fetch(TRACK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'consent_log', source, record }),
      keepalive: true,
    })
  } catch {
    // The choice is already saved in localStorage. A failed report means the
    // server has not been told, not that the person has lost their choice.
  }
}

async function send(type: string, extra: Payload): Promise<void> {
  try {
    await fetch(TRACK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type, session_id: sessionId(), ...extra }),
      keepalive: true,
    })
  } catch {
    // Analytics is never worth interrupting a visit for.
  }
}

/* -------------------------------------------------------------------------- */
/* Collectors                                                                  */
/* -------------------------------------------------------------------------- */

let deviceSent = false
let geoSent = false
let geo: GeoInfo | null = null
const listeners: Array<() => void> = []

function on(
  target: EventTarget,
  type: string,
  handler: (event: Event) => void,
  opts?: AddEventListenerOptions,
) {
  target.addEventListener(type, handler as EventListener, opts)
  listeners.push(() => target.removeEventListener(type, handler as EventListener, opts))
}

/** Called once per session. Only fires if device consent is currently on. */
export async function collectDeviceInfo(): Promise<void> {
  if (!granted('device') || deviceSent) return
  deviceSent = true
  await send('device', { device: collectDevice() })
}

/** Called once per session. Only fires if location consent is currently on. */
export async function collectLocation(): Promise<void> {
  if (!granted('location') || geoSent) return
  geoSent = true
  try {
    const response = await fetch(GEO_URL, { headers: { accept: 'application/json' } })
    if (!response.ok) return
    const body = (await response.json()) as Partial<GeoInfo>
    geo = {
      city: body.city ?? null,
      region: body.region ?? null,
      country: body.country ?? null,
      latitude: typeof body.latitude === 'number' ? body.latitude : null,
      longitude: typeof body.longitude === 'number' ? body.longitude : null,
    }
    await send('location', { geo })
  } catch {
    // No location is a fine outcome. Nothing is retried.
  }
}

/** Device and location ride along on events, but only when those are granted. */
function enrich(): Payload {
  const extra: Payload = {}
  if (granted('device')) extra.device = collectDevice()
  if (granted('location') && geo) extra.geo = geo
  return extra
}

export function trackPageview(): void {
  if (!granted('analytics')) return
  const path = window.location.pathname
  void send('pageview', {
    page_url: `${window.location.origin}${path}`,
    page_path: path,
    page_title: document.title,
    referrer: document.referrer || null,
    ...enrich(),
  })
}

export function trackOutboundClick(href: string): void {
  if (!granted('analytics')) return
  void send('outbound_click', {
    href,
    page_url: `${window.location.origin}${window.location.pathname}`,
    page_path: window.location.pathname,
    page_title: document.title,
    ...enrich(),
  })
}

/* -------------------------------------------------------------------------- */
/* Lifecycle                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Read the choice fresh every time. Withdrawal means withdrawal now, and a
 * record written under an older version already reads back as null.
 */
function granted(category: 'analytics' | 'location' | 'device'): boolean {
  const record = readConsent()
  if (record === null) return false
  return record[category] === true
}

/**
 * Attach the analytics listeners. Safe to call again after a change; the
 * previous set is removed first so a category is never collected twice.
 */
export function start(): void {
  stop()
  if (readConsent() === null) return

  // Halfway down, once per page view.
  let fired = false
  const onScroll = () => {
    if (fired || !granted('analytics')) return
    const doc = document.documentElement
    const scrolled = window.scrollY + window.innerHeight
    const total = doc.scrollHeight
    if (total > 0 && scrolled >= total / 2) {
      fired = true
      void send('scroll_50', {
        page_path: window.location.pathname,
        page_url: `${window.location.origin}${window.location.pathname}`,
        ...enrich(),
      })
      window.removeEventListener('scroll', onScroll)
    }
  }
  on(window, 'scroll', onScroll, { passive: true })

  // Only clicks that leave the site, and only the destination, never the text.
  const onClick = (event: Event) => {
    if (!granted('analytics')) return
    const target = (event.target as Element | null)?.closest?.('a[href]') as
      | HTMLAnchorElement
      | null
    if (!target) return
    const href = target.href
    if (!href || target.origin === window.location.origin) return
    if (target.target === '_blank' && !navigator.userActivation?.hasBeenActive) return
    trackOutboundClick(href)
  }
  on(document, 'click', onClick, { capture: true })

  void collectDeviceInfo()
  void collectLocation()
  trackPageview()
}

/** Detach everything. Called the moment a category is withdrawn. */
export function stop(): void {
  while (listeners.length) {
    const off = listeners.pop()
    off?.()
  }
}