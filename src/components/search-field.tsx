'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

/**
 * The search field in the app header. Submitting goes to /library/search so results
 * are a real, linkable URL rather than hidden component state.
 */
export function SearchField({ initial = '' }: { initial?: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(initial)

  // "/" focuses search from anywhere, Escape clears it. Skipped while typing.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable === true

      if (event.key === '/' && !typing) {
        event.preventDefault()
        inputRef.current?.focus()
      }
      if (event.key === 'Escape' && document.activeElement === inputRef.current) {
        setValue('')
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        const query = value.trim()
        router.push(query ? `/library/search?q=${encodeURIComponent(query)}` : '/library/search')
      }}
      className="relative w-full"
    >
      <Search
        size={15}
        strokeWidth={1.75}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
      />
      <input
        ref={inputRef}
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search by word, colour, tag, or site"
        aria-label="Search everything you have saved"
        className="field !h-9 !pl-9 text-sm"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue('')
            inputRef.current?.focus()
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
          aria-label="Clear search"
        >
          <X size={14} strokeWidth={2} />
        </button>
      ) : null}
    </form>
  )
}
