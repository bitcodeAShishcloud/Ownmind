import Link from 'next/link'
import { ExternalLink, Pin, Trash2 } from 'lucide-react'
import type { CardView } from '@/lib/cards'
import { formatDate, hostFromUrl, truncate } from '@/lib/format'
import { removeCard, setPinned } from '@/lib/actions/cards'

/** Label shown in the corner so you can tell card types apart at a glance. */
const KIND_LABEL: Record<CardView['kind'], string> = {
  note: 'Note',
  link: 'Link',
  image: 'Image',
  article: 'Article',
}

export function CardTile({ card }: { card: CardView }) {
  const href = `/library/card/${card.id}`
  const source = card.siteName ?? card.domain ?? (card.url ? hostFromUrl(card.url) : null)

  return (
    <article
      data-card
      className="group relative mb-3 break-inside-avoid overflow-hidden rounded-[6px] border border-line bg-surface"
    >
      {card.accent ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ backgroundColor: card.accent }}
        />
      ) : null}

      <div className="p-3.5">
        <div className="mb-2 flex items-center gap-2 text-[0.6875rem] tracking-wide text-muted uppercase">
          <span>{KIND_LABEL[card.kind]}</span>
          {source ? (
            <>
              <span aria-hidden="true">/</span>
              <span className="truncate normal-case tracking-normal">{source}</span>
            </>
          ) : null}
        </div>

        <h3 className="font-sans text-[0.9375rem] leading-snug font-semibold text-ink">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {card.title ?? 'Untitled'}
          </Link>
        </h3>

        {card.imageUrl && card.kind === 'image' ? (
          <div
            className="mt-2.5 overflow-hidden rounded-[4px] bg-bg-alt"
            style={
              card.imageWidth && card.imageHeight
                ? { aspectRatio: `${card.imageWidth} / ${card.imageHeight}` }
                : { aspectRatio: '4 / 3' }
            }
          >
            {/* Uploaded images are our own files with known dimensions, so a
                plain img is the right tool here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.imageUrl}
              alt={card.title ?? ''}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        {card.summary ? (
          <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-ink-2">
            {truncate(card.summary, 190)}
          </p>
        ) : card.excerpt ? (
          <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-ink-2">
            {truncate(card.excerpt, 190)}
          </p>
        ) : card.body ? (
          <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-ink-2">
            {truncate(card.body, 190)}
          </p>
        ) : null}

        {card.tags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {card.tags.slice(0, 3).map((tag) => (
              <li
                key={tag}
                className="rounded-[3px] bg-bg-alt px-1.5 py-0.5 text-[0.6875rem] text-muted"
              >
                {tag}
              </li>
            ))}
            {card.tags.length > 3 ? (
              <li className="px-0.5 py-0.5 text-[0.6875rem] text-muted">
                +{card.tags.length - 3}
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      <footer className="flex items-center justify-between border-t border-line px-3.5 py-2 text-[0.6875rem] text-muted">
        <span>
          {formatDate(card.createdAt)}
          {card.readMinutes ? ` / ${card.readMinutes} min` : ''}
        </span>

        {/* Sits above the title's full-card link overlay. */}
        <div className="relative z-10 flex items-center gap-0.5 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
          {card.url ? (
            <a
              href={card.url}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-ghost h-7 w-7 !px-0"
              aria-label="Open the original page in a new tab"
            >
              <ExternalLink size={13} strokeWidth={1.75} />
            </a>
          ) : null}

          <form action={setPinned}>
            <input type="hidden" name="id" value={card.id} />
            <input type="hidden" name="pinned" value={card.pinned ? 'false' : 'true'} />
            <button
              type="submit"
              className="btn btn-ghost h-7 w-7 !px-0"
              aria-label={card.pinned ? 'Unpin this card' : 'Pin this card to the top'}
            >
              <Pin
                size={13}
                strokeWidth={1.75}
                className={card.pinned ? 'fill-accent text-accent' : undefined}
              />
            </button>
          </form>

          <form action={removeCard}>
            <input type="hidden" name="id" value={card.id} />
            <button
              type="submit"
              className="btn btn-ghost h-7 w-7 !px-0 hover:!text-accent-ink"
              aria-label="Delete this card"
            >
              <Trash2 size={13} strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </footer>
    </article>
  )
}
