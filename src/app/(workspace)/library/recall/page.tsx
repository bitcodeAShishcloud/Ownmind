import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { requireUser } from '@/lib/session'
import { pickRecallCard } from '@/lib/cards'
import { respondToRecall } from '@/lib/actions/cards'
import { formatDate } from '@/lib/format'

export const metadata = {
  title: 'Recall',
  robots: { index: false, follow: false },
}

/**
 * One forgotten item at a time. Deliberately slow: you decide whether it is
 * still worth keeping, and the answer is used to decide what comes next.
 */
export default async function RecallPage() {
  const user = await requireUser('/library/recall')
  const card = pickRecallCard(user.id)

  if (!card) {
    return (
      <div className="panel px-6 py-16 text-center">
        <h1 className="text-lg">Nothing to bring back yet</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Recall surfaces things you saved weeks ago and have not looked at since. Save a few
          more and it will have something to work with.
        </p>
        <Link href="/library" className="btn btn-outline mt-5">
          Back to everything
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-xl">Recall</h1>
        <p className="mt-1 text-sm text-muted">
          Something you saved on {formatDate(card.createdAt)}. Keep it or let it go.
        </p>
      </div>

      <article className="panel p-5 sm:p-6">
        {card.imageUrl ? (
          <div className="mb-4 overflow-hidden rounded-[5px] bg-bg-alt">
            {/* Local upload with known dimensions. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.imageUrl} alt={card.title ?? ''} className="w-full object-cover" />
          </div>
        ) : null}

        <h2 className="text-lg">{card.title ?? 'Untitled'}</h2>

        {card.siteName || card.domain ? (
          <p className="mt-1 text-xs text-muted">
            {[card.siteName, card.domain].filter(Boolean).join(' / ')}
          </p>
        ) : null}

        {card.summary ?? card.excerpt ?? card.body ? (
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
            {card.summary ?? card.excerpt ?? card.body}
          </p>
        ) : null}

        {card.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {card.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-[3px] bg-bg-alt px-1.5 py-0.5 text-[0.6875rem] text-muted"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <form action={respondToRecall}>
            <input type="hidden" name="id" value={card.id} />
            <input type="hidden" name="keep" value="true" />
            <button type="submit" className="btn btn-primary h-9">
              Keep it
            </button>
          </form>

          <form action={respondToRecall}>
            <input type="hidden" name="id" value={card.id} />
            <input type="hidden" name="keep" value="false" />
            <button type="submit" className="btn btn-outline h-9">
              Let it go
            </button>
          </form>

          <Link href={`/library/card/${card.id}`} className="btn btn-ghost h-9">
            Open
          </Link>

          {card.url ? (
            <a
              href={card.url}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-ghost h-9"
            >
              <ExternalLink size={14} strokeWidth={1.75} />
              Original
            </a>
          ) : null}
        </div>

        <p className="mt-4 text-xs text-muted">
          Letting one go archives it. Nothing is ever deleted from recall.
        </p>
      </article>
    </div>
  )
}
