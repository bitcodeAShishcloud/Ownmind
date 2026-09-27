import { requireUser } from '@/lib/session'
import { listCards } from '@/lib/cards'
import { CardGrid } from '@/components/card-grid'

export const metadata = {
  title: 'Pinned',
  robots: { index: false, follow: false },
}

export default async function PinnedPage() {
  const user = await requireUser('/library/pinned')
  const cards = listCards(user.id, { pinned: true, limit: 200 })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl">Pinned</h1>
        <p className="mt-1 text-sm text-muted">
          What you are working on right now. Pinned items sort to the top of everything and stay
          here.
        </p>
      </div>

      {cards.length > 0 ? (
        <CardGrid cards={cards} />
      ) : (
        <div className="panel px-6 py-14 text-center">
          <p className="text-sm text-ink-2">Nothing pinned.</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Hover any card and use the pin button to keep it at the top.
          </p>
        </div>
      )}
    </div>
  )
}
