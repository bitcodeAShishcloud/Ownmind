import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Pin, Trash2 } from 'lucide-react'
import { requireUser } from '@/lib/session'
import { getCard, linkedCards, relatedCards } from '@/lib/cards'
import { removeCard, setPinned } from '@/lib/actions/cards'
import { formatDateTime } from '@/lib/format'
import { CardGrid } from '@/components/card-grid'
import { EditCardForm } from '@/components/edit-card-form'
import { LinkCardPicker } from '@/components/link-card-picker'

export const metadata = {
  title: 'Saved item',
  robots: { index: false, follow: false },
}

export default async function CardPage({ params }: PageProps<'/library/card/[id]'>) {
  const user = await requireUser()
  const { id } = await params

  const card = getCard(user.id, id)
  if (!card) notFound()

  const linked = linkedCards(user.id, card.id)
  const related = relatedCards(user.id, card.id)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/library"
          className="btn btn-ghost -ml-2 h-8 text-[0.8125rem]"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          Back to everything
        </Link>

        <div className="flex items-center gap-1">
          <form action={setPinned}>
            <input type="hidden" name="id" value={card.id} />
            <input type="hidden" name="pinned" value={card.pinned ? 'false' : 'true'} />
            <button type="submit" className="btn btn-outline h-8 text-[0.8125rem]">
              <Pin
                size={14}
                strokeWidth={1.75}
                className={card.pinned ? 'fill-accent text-accent' : undefined}
              />
              {card.pinned ? 'Pinned' : 'Pin'}
            </button>
          </form>

          <form action={removeCard}>
            <input type="hidden" name="id" value={card.id} />
            <button
              type="submit"
              className="btn btn-ghost h-8 text-[0.8125rem] hover:!text-accent-ink"
            >
              <Trash2 size={14} strokeWidth={1.75} />
              Delete
            </button>
          </form>
        </div>
      </div>

      <article className="panel p-5 sm:p-7">
        <p className="eyebrow">
          {card.kind}
          {card.siteName ? ` / ${card.siteName}` : ''}
        </p>

        <h1 className="mt-2 text-2xl sm:text-[1.75rem]">{card.title ?? 'Untitled'}</h1>

        <p className="mt-2 text-xs text-muted">
          Saved {formatDateTime(card.createdAt)}
          {card.domain ? ` / ${card.domain}` : ''}
          {card.readMinutes ? ` / ${card.readMinutes} min read` : ''}
        </p>

        {card.url ? (
          <a
            href={card.url}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent-ink underline underline-offset-2"
          >
            {card.url}
            <ExternalLink size={13} strokeWidth={1.75} />
          </a>
        ) : null}

        {card.summary ? (
          <div className="mt-5 rounded-[5px] border-l-2 border-accent bg-accent-wash/50 px-4 py-3">
            <p className="text-sm leading-relaxed text-ink-2">{card.summary}</p>
          </div>
        ) : null}

        {card.imageUrl && card.kind === 'image' ? (
          <div
            className="mt-5 overflow-hidden rounded-[5px] bg-bg-alt"
            style={
              card.imageWidth && card.imageHeight
                ? { aspectRatio: `${card.imageWidth} / ${card.imageHeight}` }
                : { aspectRatio: '4 / 3' }
            }
          >
            {/* Local upload with known dimensions. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.imageUrl}
              alt={card.title ?? ''}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        {card.body ? (
          <div className="mt-5 max-w-[68ch] space-y-4">
            {card.body.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index} className="text-[0.9375rem] leading-[1.75] text-ink-2">
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}

        {card.tags.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-1.5 border-t border-line pt-4">
            {card.tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`/library/search?q=${encodeURIComponent(`tag:${tag}`)}`}
                  className="inline-block rounded-[3px] bg-bg-alt px-2 py-1 text-xs text-ink-2 hover:bg-line"
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </article>

      <section className="panel p-5">
        <h2 className="text-base">Linked items</h2>
        <p className="mt-1 text-sm text-muted">
          Connections you made by hand. They show up on both items.
        </p>

        {linked.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {linked.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <Link
                  href={`/library/card/${item.id}`}
                  className="min-w-0 flex-1 truncate text-sm text-ink hover:text-accent-ink"
                >
                  {item.title ?? 'Untitled'}
                </Link>
                <span className="shrink-0 text-xs text-muted">{item.kind}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">Nothing linked yet.</p>
        )}

        <LinkCardPicker cardId={card.id} linkedIds={linked.map((item) => item.id)} />
      </section>

      {related.length > 0 ? (
        <section>
          <h2 className="mb-3 text-base">Related by tag</h2>
          <CardGrid cards={related} />
        </section>
      ) : null}

      <EditCardForm card={card} />
    </div>
  )
}
