import { eraseAccount, recordDeletionRequest } from '@/lib/retention'

/**
 * Takes an erasure request.
 *
 * The address is collected here because the person has to be able to identify
 * what to erase — that is the point of the form, and it is voluntary. It is the
 * one place personal data enters this system, and it goes straight to the
 * account it names.
 *
 * A person may also have browsed without ever creating an account, in which
 * case nothing links to them and there is nothing stored to look up. The reply
 * is the same either way, so the endpoint cannot be used to find out whether
 * an address has an account.
 */

const EMAIL = /^[^\s@]+@[^\s@]{2,}\.[^\s@]{2,}$/

export async function POST(request: Request) {
  let payload: Record<string, unknown>
  try {
    payload = (await request.json()) as Record<string, unknown>
  } catch {
    return Response.json({ error: 'Could not read the request body.' }, { status: 400 })
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
  const details = typeof payload.details === 'string' ? payload.details.trim().slice(0, 1000) : null

  if (!EMAIL.test(email)) {
    return Response.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }

  recordDeletionRequest(email, details && details.length > 0 ? details : null)

  // Straight away, rather than waiting for a human to pick it up. A request to
  // be forgotten that sits in a queue is not a request that was honoured.
  const erased = eraseAccount(email)

  return Response.json(
    {
      ok: true,
      accountFound: erased.accountFound,
      cardsDeleted: erased.cardsDeleted,
      spacesDeleted: erased.spacesDeleted,
      sessionsDeleted: erased.sessionsDeleted,
      message: erased.accountFound
        ? 'Your account and everything in it has been deleted.'
        : 'No account matched that address. Nothing was held for it, so nothing needed deleting.',
    },
    { status: 200 },
  )
}

export function GET() {
  return Response.json({ error: 'Not supported.' }, { status: 405 })
}