import { requireUser } from '@/lib/session'
import { getSpace, spaceCards } from '@/lib/cards'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CardGrid } from '@/components/card-grid'

export const metadata = {
  title: 'Space',
  robots: { index: false, follow: false },
}

export default async function SpacePage({ params }: PageProps<'/library/spaces/[spaceId]'>) {
  const user = await requireUser()
  const { spaceId } = await params

  const space = getSpace(user.id, spaceId)
  if (!space) notFound()

  const cards = spaceCards(user.id, space.id)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/library/spaces" className="btn btn-ghost -ml-2 h-8 text-[0.8125rem]">
          <ArrowLeft size={14} strokeWidth={1.75} />
          All spaces
        </Link>
        <h1 className="mt-2 text-xl">{space.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {cards.length} {cards.length === 1 ? 'item' : 'items'} matching{' '}
          <code className="rounded-[3px] bg-bg-alt px-1 py-0.5 text-[0.8125rem]">{space.rule}</code>
        </p>
      </div>

      {cards.length > 0 ? (
        <CardGrid cards={cards} />
      ) : (
        <div className="panel px-6 py-14 text-center">
          <p className="text-sm text-ink-2">Nothing matches this rule right now.</p>
        </div>
      )}
    </div>
  )
}
