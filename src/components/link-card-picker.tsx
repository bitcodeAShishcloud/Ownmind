'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, Loader2, Unlink } from 'lucide-react'
import { toggleLink } from '@/lib/actions/cards'

type Result = {
  id: string
  kind: string
  title: string | null
  siteName: string | null
  tags: string[]
}

/** Search your library and connect two items by hand. */
export function LinkCardPicker({ cardId, linkedIds }: { cardId: string; linkedIds: string[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const requestRef = useRef(0)

  // Debounced search. The request id guards against a slow response arriving
  // after a newer one and overwriting the list. The setTimeout wrapper keeps
  // setState out of the synchronous effect body, which is a React 19 lint rule
  // for good reason: a state write during render cascades an extra pass.
  useEffect(() => {
    if (!open) return

    const requestId = ++requestRef.current

    const timer = setTimeout(() => {
      setLoading(true)
      void (async () => {
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=12`)
          if (!response.ok) throw new Error('search failed')
          const payload = (await response.json()) as { results: Result[] }
          if (requestId === requestRef.current) setResults(payload.results)
        } catch {
          if (requestId === requestRef.current) setResults([])
        } finally {
          if (requestId === requestRef.current) setLoading(false)
        }
      })()
    }, 220)

    return () => clearTimeout(timer)
  }, [query, open])

  async function toggle(targetId: string, isLinked: boolean) {
    setBusy(targetId)
    const form = new FormData()
    form.set('from', cardId)
    form.set('to', targetId)
    form.set('remove', String(isLinked))
    await toggleLink(form)
    setBusy(null)
    router.refresh()
  }

  return (
    <div className="mt-4 border-t border-line pt-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="btn btn-outline h-8 text-[0.8125rem]"
      >
        <Link2 size={13} strokeWidth={1.75} />
        {open ? 'Close' : 'Link another item'}
      </button>

      {open ? (
        <div className="mt-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your library"
            aria-label="Search your library to link an item"
            className="field h-9 text-sm"
            autoFocus
          />

          {loading ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Loader2 size={13} strokeWidth={2} className="animate-spin" />
              Searching
            </p>
          ) : results.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing matched that.</p>
          ) : (
            <ul className="mt-3 flex max-h-72 flex-col gap-1 overflow-y-auto">
              {results
                .filter((item) => item.id !== cardId)
                .map((item) => {
                  const isLinked = linkedIds.includes(item.id)
                  return (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-[5px] border border-line px-2.5 py-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{item.title ?? 'Untitled'}</span>
                        <span className="block truncate text-xs text-muted">
                          {[item.siteName, item.kind].filter(Boolean).join(' / ')}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => void toggle(item.id, isLinked)}
                        disabled={busy === item.id}
                        className="btn btn-ghost h-7 shrink-0 text-xs"
                      >
                        {busy === item.id ? (
                          <Loader2 size={12} strokeWidth={2} className="animate-spin" />
                        ) : isLinked ? (
                          <Unlink size={12} strokeWidth={1.75} />
                        ) : (
                          <Link2 size={12} strokeWidth={1.75} />
                        )}
                        {isLinked ? 'Unlink' : 'Link'}
                      </button>
                    </li>
                  )
                })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
