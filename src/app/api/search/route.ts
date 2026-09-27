import type { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { listCards, searchCards, type CardView } from '@/lib/cards'

/**
 * Search endpoint for the link picker and the browser extension.
 *
 * Returns a trimmed shape on purpose: no body text, no URLs beyond the domain.
 * The extension only needs enough to show a row and identify the card.
 */
function summarise(card: CardView) {
  return {
    id: card.id,
    kind: card.kind,
    title: card.title,
    siteName: card.siteName,
    domain: card.domain,
    accent: card.accent,
    tags: card.tags,
    createdAt: card.createdAt,
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ error: 'Not signed in.' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const query = params.get('q')?.trim() ?? ''

  const requested = Number(params.get('limit') ?? 20)
  const limit = Number.isFinite(requested)
    ? Math.min(Math.max(Math.trunc(requested), 1), 50)
    : 20

  // With no query, return the most recent so the picker has something to show
  // before you start typing.
  const results = query ? searchCards(user.id, query, { limit }) : listCards(user.id, { limit })

  return Response.json({ query, results: results.map(summarise) })
}
