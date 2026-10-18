import { edgeResolved, locationFromHeaders, NO_LOCATION } from '@/lib/geo'

/**
 * Approximate location, resolved on the server from headers the edge attached.
 * The visitor's address is never forwarded anywhere to be looked up.
 *
 * Returns a 200 with null fields when there is nothing to report, because "we
 * could not tell" is not an error the caller needs to handle. It never returns
 * an error that would tempt a caller into retrying in a loop.
 *
 * City, region and country only. There is no coordinate field in the response,
 * because there is no column to store one and no plan to add one.
 *
 * navigator.geolocation is not used anywhere in this project, so no precise
 * position is obtainable through this path.
 */
export function GET(request: Request) {
  // No edge in front, so nothing was resolved. Say so rather than guessing.
  const location = edgeResolved(request.headers)
    ? locationFromHeaders(request.headers)
    : NO_LOCATION

  return Response.json(location, {
    status: 200,
    headers: {
      // A per visitor answer should never be cached by an intermediary.
      'cache-control': 'no-store, private',
    },
  })
}