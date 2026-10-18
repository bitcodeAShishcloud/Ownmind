'use client'

import { useEffect, useRef, useState } from 'react'

/** Cloudflare serves this once; after that the API takes over. */
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let loading: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (loading) return loading

  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('turnstile script failed to load'))
    document.head.appendChild(script)
  })

  return loading
}

type TurnstileWidget = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  reset: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileWidget
  }
}

/**
 * Renders the challenge and copies whatever it says into a hidden field. The
 * form still submits without JavaScript, but the server checks the token and
 * turns away anything that is not a real verdict.
 */
export function Turnstile({
  siteKey,
  action,
  theme = 'auto',
}: {
  siteKey: string
  /** Named after the form step, so a token cannot be replayed on another. */
  action: string
  theme?: 'auto' | 'light' | 'dark'
}) {
  const host = useRef<HTMLDivElement>(null)
  const [token, setToken] = useState('')
  // Two different things go wrong here and a person fixes them differently.
  // The script failing to arrive is a connection problem; the widget refusing
  // is Cloudflare declining the visitor, and it offers its own retry.
  const [failure, setFailure] = useState<'load' | 'verify' | ''>('')

  useEffect(() => {
    let cancelled = false
    let widgetId: string | undefined

    loadScript()
      .then(() => {
        if (cancelled || !host.current || !window.turnstile) return
        widgetId = window.turnstile.render(host.current, {
          sitekey: siteKey,
          action,
          theme,
          callback: (value: string) => {
            setToken(value)
            setFailure('')
          },
          'expired-callback': () => setToken(''),
          'error-callback': () => {
            setToken('')
            setFailure('verify')
          },
        })
      })
      .catch(() => setFailure('load'))

    return () => {
      cancelled = true
      // The widget lives in a DOM node React is about to drop, so clear it
      // before that happens rather than leaving it attached to the document.
      if (widgetId && window.turnstile) window.turnstile.reset(widgetId)
    }
  }, [siteKey, action, theme])

  return (
    <div className="flex flex-col gap-1.5">
      <div ref={host} className="min-h-[65px]" />
      <input type="hidden" name="turnstileToken" value={token} />
      {failure ? (
        <p role="alert" className="text-sm text-accent-ink">
          {failure === 'load'
            ? 'The challenge did not load. Check your connection and refresh.'
            : 'Verification failed. Please try again, or refresh the page.'}
        </p>
      ) : null}
    </div>
  )
}