import { locationFromHeaders, NO_LOCATION } from '@/lib/geo'

/**
 * Approximate location, resolved on the server from headers the edge already
 * attached. The visitor's address is never forwarded anywhere to be looked up.
 *
 * Returns a 200 with null fields when there is nothing to report, because "we
 * could not tell" is not an error the caller needs to handle. It never returns
 * an error that would tempt a caller into retrying in a loop.
 *
 * navigator.geolocation is not used anywhere in this project, so no precise
 * position is obtainable through this path.
 */
export function GET(request: Request) {
  const location = locationFromHeaders(request.headers)

  // No edge in front, so nothing was resolved. Say so rather than guessing.
  const behindEdge = request.headers.has('cf-ipcountry') || request.headers.has('cf-ipcity')

  return Response.json(
    behindEdge ? location : NO_LOCATION,
    {
      status: 200,
      headers: {
        // A per visitor answer should never be cached by an intermediary.
        'cache-control': 'no-store, private',
      },
    },
  )
}