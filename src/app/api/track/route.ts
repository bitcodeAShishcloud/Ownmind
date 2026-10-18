import { recordConsentLog, recordEvent, validateEvent } from '@/lib/analytics'

/**
 * The single endpoint every first party event goes to.
 *
 * It accepts two shapes and no others:
 *
 *   { type: "consent_log", source, record }   the choice itself
 *   { type: "pageview" | "scroll_50" | ..., session_id, ... }
 *
 * Everything is validated and length capped before it reaches SQLite. A caller
 * that sends an unknown event type, a missing session, or a value that is the
 * wrong shape is refused rather than repaired, so a broken caller cannot fill
 * the table with half records.
 *
 * There is no third party call in this file and no identifier in what it
 * stores.
 */
export async function POST(request: Request) {
  let payload: Record<string, unknown>
  try {
    payload = (await request.json()) as Record<string, unknown>
  } catch {
    return Response.json({ error: 'Could not read the request body.' }, { status: 400 })
  }

  if (typeof payload !== 'object' || payload === null) {
    return Response.json({ error: 'Expected a JSON object.' }, { status: 400 })
  }

  // A consent record is kept whatever else was or was not chosen, including
  // when everything optional was refused.
  if (payload.type === 'consent_log') {
    const record = recordConsentLog(
      typeof payload.source === 'string' ? payload.source : '',
      payload.record,
    )
    if (record === null) {
      return Response.json({ error: 'That consent record was not usable.' }, { status: 400 })
    }
    return Response.json({ ok: true }, { status: 201 })
  }

  const event = validateEvent(payload)
  if (event === null) {
    return Response.json({ error: 'That event was not usable.' }, { status: 400 })
  }

  recordEvent(event)
  return Response.json({ ok: true }, { status: 201 })
}

/**
 * Nothing to read. This endpoint only ever takes, and a GET must never be able
 * to be turned into a way of pulling the table back out.
 */
export function GET() {
  return Response.json({ error: 'Not supported.' }, { status: 405 })
}