import { getCurrentUser } from '@/lib/session'
import { enrich } from '@/lib/enrich'
import { createCard, resyncAllSpaces } from '@/lib/cards'
import { saveDataUrl } from '@/lib/media'
import { normalizeUrl } from '@/lib/extract'

/**
 * Save endpoint for the browser extension.
 *
 * Authentication is the normal session cookie, so the extension needs to be
 * signed in in the browser profile it runs in. There is no separate API key
 * path, and no unauthenticated write route exists.
 *
 * Accepts JSON or form encoded bodies:
 *   { "url": "https://...", "note": "...", "image": "data:image/...", "accent": "#a3442c" }
 */
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ error: 'Not signed in.' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    const contentType = request.headers.get('content-type') ?? ''
    payload = contentType.includes('application/json')
      ? ((await request.json()) as Record<string, unknown>)
      : Object.fromEntries((await request.formData()).entries())
  } catch {
    return Response.json({ error: 'Could not read the request body.' }, { status: 400 })
  }

  const url = typeof payload.url === 'string' ? payload.url.trim() : ''
  const note = typeof payload.note === 'string' ? payload.note.trim() : ''
  const imageData = typeof payload.image === 'string' ? payload.image.trim() : ''
  const accent = typeof payload.accent === 'string' ? payload.accent.trim() : null

  if (!url && !note && !imageData) {
    return Response.json({ error: 'Send a url, a note or an image.' }, { status: 400 })
  }

  const image = imageData ? saveDataUrl(imageData) : null
  if (imageData && !image) {
    return Response.json({ error: 'That image could not be stored.' }, { status: 400 })
  }

  // A lone URL is a bookmark. A URL with a note attached keeps both.
  const bareUrl = Boolean(normalizeUrl(url)) && /^https?:\/\/\S+$/i.test(url)

  const result = await enrich({
    url: bareUrl ? url : null,
    title: bareUrl ? null : note || null,
    body: bareUrl ? null : note || null,
    imageUrl: image?.url ?? null,
    accent: accent || null,
  })

  const card = createCard(user.id, {
    kind: result.kind,
    title: result.title,
    body: result.body,
    url: result.url,
    siteName: result.siteName,
    domain: result.domain,
    excerpt: result.excerpt,
    imageUrl: result.imageUrl,
    accent: result.accent,
    tags: result.tags,
    summary: result.summary,
  })

  resyncAllSpaces(user.id)

  return Response.json(
    {
      id: card.id,
      kind: card.kind,
      title: card.title,
      domain: card.domain,
      tags: card.tags,
      savedAt: card.createdAt,
    },
    { status: 201 },
  )
}

/** Lets the extension check it is signed in without attempting a save. */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ signedIn: false }, { status: 401 })
  }

  return Response.json({ signedIn: true, email: user.email })
}
