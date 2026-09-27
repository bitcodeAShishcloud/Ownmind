'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'

const STORAGE_KEY = 'ownmind-theme'
type Theme = 'light' | 'dark'

/**
 * The active theme is state that lives outside React, on the <html> element.
 * The inline script in the document head sets that class before first paint, and
 * React Strict Mode remounts once in development and resets <html>, which is why
 * reading it with a subscription is more reliable than copying it into state
 * inside an effect.
 */
function subscribe(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/** Matches the class the server rendered, so hydration matches. */
function getServerSnapshot(): Theme {
  return 'light'
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  function toggle() {
    const next: Theme = getSnapshot() === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private browsing can refuse writes. The toggle still works for this page.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-ghost h-9 w-9 !px-0"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun size={17} strokeWidth={1.75} />
      ) : (
        <Moon size={17} strokeWidth={1.75} />
      )}
    </button>
  )
}
