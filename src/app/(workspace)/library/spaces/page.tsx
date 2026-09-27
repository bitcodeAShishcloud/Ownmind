import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { requireUser } from '@/lib/session'
import { listSpaces, spaceCards } from '@/lib/cards'
import { removeSpace } from '@/lib/actions/cards'
import { formatDate } from '@/lib/format'
import { NewSpaceForm } from '@/components/new-space-form'

export const metadata = {
  title: 'Spaces',
  robots: { index: false, follow: false },
}

export default async function SpacesPage() {
  const user = await requireUser('/library/spaces')
  const spaces = listSpaces(user.id)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl">Spaces</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          A space is a saved search. You give it a name and a rule, and it keeps itself up to
          date. Use the same rules as the search box, such as{' '}
          <code className="rounded-[3px] bg-bg-alt px-1 py-0.5 text-[0.8125rem]">tag:ceramics</code>{' '}
          or{' '}
          <code className="rounded-[3px] bg-bg-alt px-1 py-0.5 text-[0.8125rem]">
            ceramics
          </code>
          .
        </p>
      </div>

      <NewSpaceForm />

      {spaces.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {spaces.map((space) => {
            const cards = spaceCards(user.id, space.id)
            const cover = cards.find((card) => card.imageUrl)?.imageUrl ?? null

            return (
              <li key={space.id} className="panel overflow-hidden">
                <Link href={`/library/spaces/${space.id}`} className="block p-4">
                  {cover ? (
                    <div className="mb-3 h-24 overflow-hidden rounded-[4px] bg-bg-alt">
                      {/* Local upload with known dimensions. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cover} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <h2 className="text-base">{space.name}</h2>
                  <p className="mt-1 text-xs text-muted">
                    {cards.length} {cards.length === 1 ? 'item' : 'items'} / rule: {space.rule}
                  </p>
                </Link>
                <div className="flex items-center justify-between border-t border-line px-4 py-2">
                  <span className="text-xs text-muted">Since {formatDate(space.created_at)}</span>
                  <form action={removeSpace}>
                    <input type="hidden" name="id" value={space.id} />
                    <button
                      type="submit"
                      className="btn btn-ghost h-7 text-xs hover:!text-accent-ink"
                    >
                      <Trash2 size={12} strokeWidth={1.75} />
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="panel px-6 py-14 text-center">
          <p className="text-sm text-ink-2">No spaces yet.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            A space is just a search you want to keep. Make one for a project, a client, or
            anything you keep coming back to.
          </p>
        </div>
      )}
    </div>
  )
}
