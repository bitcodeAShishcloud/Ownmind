import { isSafeName, mimeFor, readUpload } from '@/lib/media'

/** Streams a stored upload. Names are validated before touching the filesystem. */
export async function GET(_request: Request, ctx: RouteContext<'/api/media/[name]'>) {
  const { name } = await ctx.params

  if (!isSafeName(name)) {
    return new Response('Not found', { status: 404 })
  }

  const bytes = readUpload(name)
  if (!bytes) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      'content-type': mimeFor(name),
      // Uploaded files are immutable, so cache them hard. A new upload gets a
      // new random name, so the URL never needs to be invalidated.
      'cache-control': 'private, max-age=31536000, immutable',
    },
  })
}
