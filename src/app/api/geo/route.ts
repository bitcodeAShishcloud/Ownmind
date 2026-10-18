import { locationFor } from '@/lib/geo'

/**
 * Approximate location, resolved on this server from a local MaxMind GeoLite2
 * database. The address is never sent anywhere to be looked up.
 *
 * Returns a 200 with null fields when there is nothing to report or the
 * database is not installed, because "we could not tell" is not an error the
 * caller should retry.
 *
 * City, region and country only. There is no coordinate field in the response,
 * because there is no column to store one and no plan to add one.
 *
 * navigator.geolocation is not used anywhere in this project, so no precise
 * position is obtainable through this path.
 */
export async function GET(request: Request) {
  const location = await locationFor(request.headers)

  return Response.json(location, {
    status: 200,
    headers: {
      // A per visitor answer should never be cached by an intermediary.
      'cache-control': 'no-store, private',
    },
  })
}