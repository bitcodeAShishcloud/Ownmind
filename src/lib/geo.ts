/**
 * Approximate location, resolved on our own server.
 *
 * The network address a request arrived on is looked up in a local MaxMind
 * GeoLite2 database. Nothing is sent anywhere to be resolved: the address never
 * leaves this process, which is why the privacy policy can say the lookup is
 * ours alone.
 *
 * City, region and country only. GeoLite2 also returns a latitude and a
 * longitude, and this module deliberately throws them away rather than rounding
 * them, because there is no column to store them and no plan to add one. The
 * database has no coordinate column either.
 *
 * navigator.geolocation is never called anywhere in this project, so a precise
 * position cannot be obtained through this path even by mistake.
 *
 * Server only.
 */

import { existsSync } from 'node:fs'
import { open, type Reader } from 'maxmind'
import type { CityResponse } from 'mmdb-lib'

export type ApproximateLocation = {
  city: string | null
  region: string | null
  country: string | null
}

export const NO_LOCATION: ApproximateLocation = {
  city: null,
  region: null,
  country: null,
}

const DB_PATH =
  process.env.OWNMIND_MAXMIND_DB_PATH || '/var/lib/ownmind/geoip/GeoLite2-City.mmdb'

const CITY_RE = /^[a-z0-9 .'-]{1,64}$/i
const REGION_RE = /^[a-z0-9 .'-]{1,64}$/i
const COUNTRY_RE = /^[a-zA-Z]{2}$/

let reader: Promise<Reader<CityResponse> | null> | null = null

/**
 * Open the database once and keep it. MaxMind readers hold an index in memory,
 * so this is a few megabytes held for the life of the process rather than a
 * per-request cost.
 *
 * A missing or unreadable file resolves to null instead of throwing. The
 * location category then reports nothing, which is the honest outcome: the
 * site is fully usable without it, and a visitor is never shown an error
 * because a data file is absent.
 */
function loadReader(): Promise<Reader<CityResponse> | null> {
  if (reader) return reader
  reader = open<CityResponse>(DB_PATH).catch((error: unknown) => {
    console.warn(
      `[geo] could not open ${DB_PATH}: ${(error as Error).message}. ` +
        'Location will be empty. Run: npm run fetch-geoip',
    )
    return null
  })
  return reader
}

/** A valid IPv4 or IPv6 address, or null. Anything else is not looked up. */
function parseIp(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 45) return null
  // Cheap shape check before handing it to the reader, which is stricter.
  if (!/^[0-9a-fA-F.:]+$/.test(trimmed)) return null
  return trimmed
}

/**
 * The address the request came from, in order of trustworthiness.
 *
 * cf-connecting-ip is set by the edge and cannot be spoofed by a client.
 * x-forwarded-for is a list a client can prepend to, so the first entry is only
 * believed when nothing better is present.
 */
export function callerIp(headers: Headers): string | null {
  const connecting = parseIp(headers.get('cf-connecting-ip'))
  if (connecting) return connecting

  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = parseIp(forwarded.split(',')[0] ?? null)
    if (first) return first
  }

  return parseIp(headers.get('x-real-ip'))
}

function clean(value: unknown, pattern: RegExp): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (pattern.test(trimmed)) return trimmed
  return null
}

/**
 * Look the address up.
 *
 * Cloudflare's headers are consulted first, but only for the city. The free
 * plan reliably sends a country and no city, so returning as soon as anything
 * arrived would mean the database never got asked. Anything the edge did not
 * answer is filled from GeoLite2, and anything GeoLite2 does not know falls
 * back to what the edge did say.
 */
export async function locationFor(headers: Headers): Promise<ApproximateLocation> {
  const fromEdge: ApproximateLocation = {
    city: clean(headers.get('cf-ipcity'), CITY_RE),
    region: clean(headers.get('cf-region'), REGION_RE),
    country: clean(headers.get('cf-ipcountry'), COUNTRY_RE),
  }

  // The edge named a city, so there is nothing left for the database to add.
  if (fromEdge.city) return fromEdge

  const ip = callerIp(headers)
  if (!ip) return fromEdge

  const db = await loadReader()
  if (!db) return fromEdge

  try {
    const hit = db.get(ip)
    if (!hit) return fromEdge

    // CityResponse.subdivisions is the region hierarchy, most specific first.
    const subdivisions = hit.subdivisions

    return {
      city: clean(hit.city?.names?.en, CITY_RE),
      region: clean(subdivisions?.[0]?.names?.en, REGION_RE) ?? fromEdge.region,
      country: clean(hit.country?.iso_code, COUNTRY_RE) ?? fromEdge.country,
    }
  } catch {
    // A malformed address or an unreadable record. Whatever the edge said is
    // still true, so it is kept rather than thrown away.
    return fromEdge
  }
}

/** Cheap check for the ops page and the tests. Does the database exist? */
export function geoipDatabasePresent(): boolean {
  try {
    return existsSync(DB_PATH)
  } catch {
    return false
  }
}