import type { CardView } from '@/lib/cards'
import { CardTile } from './card-tile'

/**
 * Masonry via CSS columns. Simple, dependency free, and it reflows on resize
 * without any measurement JavaScript.
 */
export function CardGrid({ cards }: { cards: CardView[] }) {
  if (cards.length === 0) return null

  return (
    <div className="columns-1 gap-3 sm:columns-2 xl:columns-3 2xl:columns-4">
      {cards.map((card) => (
        <CardTile key={card.id} card={card} />
      ))}
    </div>
  )
}
