'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Loader2, Pin, X } from 'lucide-react'
import { saveCard, type SaveState } from '@/lib/actions/cards'
import { prepareImage, type PreparedImage } from '@/lib/image-utils'

const MAX_TEXT = 8000

/**
 * One box for everything. Paste a URL and it is bookmarked and read, type a
 * sentence and it stays a note, drop an image and it is filed by what is in it.
 * OwnMind works out the rest.
 */
export function Composer() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<SaveState, FormData>(saveCard, {})
  const [text, setText] = useState('')
  const [image, setImage] = useState<PreparedImage | null>(null)
  const [pinned, setPinned] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [, startTransition] = useTransition()

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Grow the box with its content, up to a sensible ceiling.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`
  }, [text])

  function clear() {
    setText('')
    setImage(null)
    setPinned(false)
    setError(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  async function attach(file: File) {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Only images can be added here. Paste a link for anything else.')
      return
    }
    try {
      setImage(await prepareImage(file))
    } catch {
      setError('That image could not be read. Try a different file.')
    }
  }

  function onPaste(event: React.ClipboardEvent) {
    const files = Array.from(event.clipboardData.files)
    if (files.length > 0) {
      event.preventDefault()
      void attach(files[0])
    }
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) void attach(file)
  }

  /**
   * Clear straight away so typing is never blocked, then let the action resolve.
   * The action revalidates /library, so the new card appears on its own.
   */
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (pending) return
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    clear()
    startTransition(async () => {
      await saveCard({}, formData)
      router.refresh()
    })
  }

  const canSubmit = (text.trim().length > 0 || image !== null) && !pending

  return (
    <section
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      aria-label="Save something"
      className={`panel p-3 ${dragging ? 'border-accent' : ''}`}
    >
      <form action={formAction} onSubmit={onSubmit}>
        <input type="hidden" name="image" value={image?.dataUrl ?? ''} />
        <input type="hidden" name="accent" value={image?.accent ?? ''} />
        {pinned ? <input type="hidden" name="pinned" value="on" /> : null}

        {image ? (
          <div className="mb-2.5 flex items-center gap-3 rounded-[5px] border border-line bg-surface-2 p-2">
            {/* The preview is a local data URL, so a plain img avoids the loader. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.dataUrl} alt="" className="h-14 w-14 rounded-[3px] object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Image ready</p>
              <p className="text-xs text-muted">
                {image.width} by {image.height}, dominant colour {image.accent}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setImage(null)}
              className="btn btn-ghost h-8 w-8 !px-0"
              aria-label="Remove image"
            >
              <X size={15} strokeWidth={2} />
            </button>
          </div>
        ) : null}

        <textarea
          ref={textareaRef}
          name="content"
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, MAX_TEXT))}
          onPaste={onPaste}
          rows={1}
          maxLength={MAX_TEXT}
          placeholder="Paste a link, write a note, or drop an image"
          aria-label="What do you want to save?"
          className="field w-full resize-none border-transparent !bg-transparent !px-1 !py-1 text-[0.9375rem] focus:!shadow-none"
        />

        {error || state.error ? (
          <p role="alert" className="mt-1 px-1 text-sm text-accent-ink">
            {error || state.error}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line pt-2.5">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void attach(file)
              event.target.value = ''
            }}
            className="sr-only"
            tabIndex={-1}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn btn-ghost h-8 text-[0.8125rem]"
          >
            <ImagePlus size={15} strokeWidth={1.75} />
            Add image
          </button>

          <button
            type="button"
            onClick={() => setPinned((value) => !value)}
            aria-pressed={pinned}
            className={`btn h-8 text-[0.8125rem] ${
              pinned ? 'btn-outline text-accent-ink' : 'btn-ghost'
            }`}
          >
            <Pin size={15} strokeWidth={1.75} />
            {pinned ? 'Pinned' : 'Pin'}
          </button>

          <span className="ml-auto flex items-center gap-2">
            {pending ? (
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                Reading it
              </span>
            ) : null}
            <button type="submit" className="btn btn-primary h-8 text-[0.8125rem]" disabled={!canSubmit}>
              Save
            </button>
          </span>
        </div>
      </form>
    </section>
  )
}
