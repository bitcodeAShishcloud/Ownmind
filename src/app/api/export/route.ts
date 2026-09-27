import { getCurrentUser } from '@/lib/session'
import { db } from '@/lib/db'

/**
 * Full account export as JSON.
 *
 * The point of this endpoint is that nobody has to ask us for their data. It is
 * a plain GET so a browser can download it directly.
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ error: 'Not signed in.' }, { status: 401 })
  }

  const cards = db()
    .prepare(
      `select id, kind, title, body, url, site_name, domain, excerpt,
              image_url, accent, tags, summary, read_minutes, pinned,
              created_at, updated_at
       from cards where user_id = ? order by created_at`,
    )
    .all(user.id) as Record<string, unknown>[]

  const links = db()
    .prepare(
      `select l.from_id, l.to_id from card_links l
       join cards c on c.id = l.from_id
       where c.user_id = ?`,
    )
    .all(user.id)

  const spaces = db()
    .prepare('select id, name, rule, created_at from spaces where user_id = ? order by name')
    .all(user.id)

  const payload = {
    exportedAt: new Date().toISOString(),
    format: 'ownmind-export/1',
    account: {
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
    },
    cards: cards.map((row) => ({
      ...row,
      // tags is stored as a JSON string, hand it back as a real array
      tags: (() => {
        try {
          const parsed = JSON.parse(String(row.tags))
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      })(),
    })),
    links,
    spaces,
  }

  const stamp = new Date().toISOString().slice(0, 10)

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="ownmind-export-${stamp}.json"`,
      'cache-control': 'no-store',
    },
  })
}
