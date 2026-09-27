import Link from 'next/link'
import { requireUser } from '@/lib/session'
import { CARD_KINDS, countCards, listCards, type CardKind } from '@/lib/cards'
import { Composer } from '@/components/composer'
import { CardGrid } from '@/components/card-grid'

export const metadata = {
  title: 'Your saves',
  robots: { index: false, follow: false },
}

type Counts = {
  total: number
  notes: number
  links: number
  images: number
  articles: number
}

const FILTERS: Array<{ label: string; value: CardKind | 'all'; countKey: keyof Counts }> = [
  { label: 'Everything', value: 'all', countKey: 'total' },
  { label: 'Notes', value: 'note', countKey: 'notes' },
  { label: 'Links', value: 'link', countKey: 'links' },
  { label: 'Images', value: 'image', countKey: 'images' },
  { label: 'Articles', value: 'article', countKey: 'articles' },
]

export default async function AppHome({ searchParams }: PageProps<'/library'>) {
  const user = await requireUser('/library')
  const params = await searchParams

  const requested = typeof params.kind === 'string' ? params.kind : 'all'
  const kind = CARD_KINDS.includes(requested as CardKind) ? (requested as CardKind) : undefined

  const cards = listCards(user.id, { kind, limit: 300 })
  const counts = countCards(user.id)

  return (
    <div className="flex flex-col gap-5">
      <Composer />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {counts.total === 0
            ? 'Nothing saved yet.'
            : `${counts.total} ${counts.total === 1 ? 'item' : 'items'} saved`}
        </p>

        <ul className="flex flex-wrap items-center gap-1">
          {FILTERS.map((filter) => {
            const active = filter.value === 'all' ? !kind : kind === filter.value
            const href = filter.value === 'all' ? '/library' : `/library?kind=${filter.value}`
            const tally = counts[filter.countKey]

            return (
              <li key={filter.value}>
                <Link
                  href={href}
                  scroll={false}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-[5px] border px-2.5 py-1 text-[0.8125rem] ${
                    active
                      ? 'border-ink bg-ink text-bg'
                      : 'border-line text-ink-2 hover:border-line-strong hover:bg-surface'
                  }`}
                >
                  {filter.label}
                  <span className={active ? 'opacity-65' : 'text-muted'}> {tally}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {cards.length > 0 ? (
        <CardGrid cards={cards} />
      ) : (
        <EmptyState hasAny={counts.total > 0} filtered={Boolean(kind)} />
      )}
    </div>
  )
}

function EmptyState({ hasAny, filtered }: { hasAny: boolean; filtered: boolean }) {
  if (filtered) {
    return (
      <div className="panel px-6 py-14 text-center">
        <p className="text-sm text-ink-2">Nothing in this filter yet.</p>
        <Link href="/library" className="btn btn-outline mt-4">
          Show everything
        </Link>
      </div>
    )
  }

  if (hasAny) {
    return (
      <div className="panel px-6 py-14 text-center">
        <p className="text-sm text-ink-2">Your library is empty.</p>
      </div>
    )
  }

  return (
    <div className="panel px-6 py-16 text-center">
      <h2 className="text-lg">Save your first thing</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-2">
        Paste a link above and OwnMind will read it, name it, and tag it. Write a note and it
        stays exactly as you typed it. Drop an image and it gets filed by what is in it.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-muted">
        <span className="rounded-[4px] bg-bg-alt px-2 py-1">https://</span>
        <span className="rounded-[4px] bg-bg-alt px-2 py-1">a thought you had</span>
        <span className="rounded-[4px] bg-bg-alt px-2 py-1">a screenshot</span>
      </div>
    </div>
  )
}
