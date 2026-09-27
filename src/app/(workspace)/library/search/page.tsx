import Link from 'next/link'
import { requireUser } from '@/lib/session'
import { searchCards } from '@/lib/cards'
import { CardGrid } from '@/components/card-grid'
import { SearchField } from '@/components/search-field'

export const metadata = {
  title: 'Search',
  robots: { index: false, follow: false },
}

const OPERATORS = [
  { syntax: 'word', does: 'Searches titles, text, tags, summaries and domains at once.' },
  { syntax: 'tag:typography', does: 'Only items carrying that tag.' },
  { syntax: 'kind:note', does: 'Only notes. Also image, link, article.' },
  { syntax: 'site:nytimes.com', does: 'Only that domain.' },
  { syntax: '-recipe', does: 'Leaves out anything mentioning that word.' },
]

export default async function SearchPage({ searchParams }: PageProps<'/library/search'>) {
  const user = await requireUser('/library/search')
  const params = await searchParams

  const raw = typeof params.q === 'string' ? params.q : Array.isArray(params.q) ? params.q[0] : ''
  const query = (raw ?? '').trim()

  const results = query ? searchCards(user.id, query, { limit: 200 }) : []

  return (
    <div className="flex flex-col gap-5">
      <div className="mx-auto w-full max-w-xl">
        <SearchField initial={query} />
      </div>

      {query ? (
        <p className="text-sm text-muted">
          {results.length === 0
            ? 'Nothing matched.'
            : `${results.length} ${results.length === 1 ? 'result' : 'results'} for `}
          {results.length > 0 ? (
            <span className="text-ink">
              &ldquo;{query}&rdquo;
            </span>
          ) : null}
        </p>
      ) : (
        <p className="text-sm text-muted">Type what you remember.</p>
      )}

      {results.length > 0 ? <CardGrid cards={results} /> : null}

      <section className="panel p-5">
        <h2 className="text-base">Narrowing a search</h2>
        <p className="mt-1 text-sm text-muted">
          You rarely need these. When a word you typed is also a tag or a site name, these pull
          the search towards one meaning.
        </p>
        <dl className="mt-4 flex flex-col gap-2.5">
          {OPERATORS.map((operator) => (
            <div key={operator.syntax} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
              <dt className="shrink-0 sm:w-44">
                <code className="rounded-[3px] bg-bg-alt px-1.5 py-0.5 text-[0.8125rem]">
                  {operator.syntax}
                </code>
              </dt>
              <dd className="text-sm text-ink-2">{operator.does}</dd>
            </div>
          ))}
        </dl>
      </section>

      {query && results.length === 0 ? (
        <div className="panel px-6 py-12 text-center">
          <p className="text-sm text-ink-2">Try fewer words, or drop a tag filter.</p>
          <Link href="/library" className="btn btn-outline mt-4">
            Back to everything
          </Link>
        </div>
      ) : null}
    </div>
  )
}
