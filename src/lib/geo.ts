/**
 * Approximate location, worked out from headers the edge already attached.
 *
 * The domain sits behind Cloudflare, so the network address a request arrived
 * on has already been turned into a country, a region and a city before this
 * server ever sees it. Reading those headers keeps the lookup first party: no
 * address is forwarded to a third party to be resolved.
 *
 * This is deliberately weak. There is no navigator.geolocation anywhere in this
 * project and there is no way to ask for one, so a precise position is not
 * obtainable through this path even by mistake.
 *
 * Server only.
 */

export type ApproximateLocation = {
  latitude: number | null
  longitude: number | null
  city: string | null
  region: string | null
  country: string | null
}

/** Nothing was resolvable. Not an error: the caller simply has no location. */
export const NO_LOCATION: ApproximateLocation = {
  latitude: null,
  longitude: null,
  city: null,
  region: null,
  country: null,
}

const CITY_RE = /^[a-z0-9 .'-]{1,64}$/i
const REGION_RE = /^[a-z0-9 .'-]{1,64}$/i
const COUNTRY_RE = /^[a-zA-Z]{2}$/

/** Round to two decimal places: about a kilometre, never a street. */
function round2(value: string | null): number | null {
  if (value === null) return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  if (n < -90 || n > 90) return null
  return Math.round(n * 100) / 100
}

/**
 * Cloudflare sends placeholder values when it has nothing useful, and they
 * differ per header, so each is checked rather than stored verbatim.
 */
function clean(value: string | null, pattern: RegExp): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (pattern.test(trimmed)) return trimmed
  return null
}

function latitudeOf(value: string | null): number | null {
  if (value === null) return null
  const n = Number(value)
  if (!Number.isFinite(n) || n < -90 || n > 90) return null
  return Math.round(n * 100) / 100
}

export function locationFromHeaders(headers: Headers): ApproximateLocation {
  // Cloudflare sends the literal "XX" for unknown, and similar markers when it
  // declines to be specific. None of them survive the checks above, so nothing
  // further is needed here to recognise a missing location.
  return {
    city: clean(headers.get('cf-ipcity'), CITY_RE),
    region: clean(headers.get('cf-region'), REGION_RE),
    country: clean(headers.get('cf-ipcountry'), COUNTRY_RE),
    latitude: latitudeOf(headers.get('cf-latitude')),
    longitude: round2(headers.get('cf-longitude')),
  }
}