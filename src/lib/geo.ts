/**
 * Approximate location, worked out from headers the edge already attached.
 *
 * The domain resolves through Cloudflare's nameservers, so when the proxy is
 * switched on the network address a request arrived on has already been turned
 * into a country, a region and a city before this server sees it. Reading those
 * headers keeps the lookup first party: no address is forwarded to a third party
 * to be resolved.
 *
 * City, region and country only. There is deliberately no latitude or longitude
 * anywhere in this project, so a precise position cannot be obtained through
 * this path even by mistake, and navigator.geolocation is never called.
 *
 * Server only.
 */

export type ApproximateLocation = {
  city: string | null
  region: string | null
  country: string | null
}

/** Nothing was resolvable. Not an error: the caller simply has no location. */
export const NO_LOCATION: ApproximateLocation = {
  city: null,
  region: null,
  country: null,
}

const CITY_RE = /^[a-z0-9 .'-]{1,64}$/i
const REGION_RE = /^[a-z0-9 .'-]{1,64}$/i
const COUNTRY_RE = /^[a-zA-Z]{2}$/

/**
 * Cloudflare sends placeholder values when it has nothing useful, and they
 * differ per header, so each is checked rather than stored verbatim. Anything
 * that fails its pattern is treated as absent.
 */
function clean(value: string | null, pattern: RegExp): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (pattern.test(trimmed)) return trimmed
  return null
}

export function locationFromHeaders(headers: Headers): ApproximateLocation {
  return {
    city: clean(headers.get('cf-ipcity'), CITY_RE),
    region: clean(headers.get('cf-region'), REGION_RE),
    country: clean(headers.get('cf-ipcountry'), COUNTRY_RE),
  }
}

/** True when something upstream resolved the address into a place. */
export function edgeResolved(headers: Headers): boolean {
  return headers.has('cf-ipcountry') || headers.has('cf-ipcity') || headers.has('cf-region')
}