/**
 * Cloudflare Turnstile, server half.
 *
 * The widget hands the browser a token; this exchanges it with Cloudflare for
 * a verdict. A caller that never rendered the widget has no token, so a
 * request that skips the widget is refused here rather than upstream.
 *
 * Turnstile tokens are single use and good for five minutes. There is nothing
 * to store and nothing to count, which is most of what the old arithmetic
 * challenge was doing by hand.
 *
 * Server only.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Cloudflare publishes these for trying the widget out. They accept every
 * token, which makes them useful for wiring the flow up and useless as a
 * defence. Real keys come from the Turnstile dashboard on Cloudflare.
 */
const PUBLIC_TEST_SITE_KEY = '1x00000000000000000000AA'
const PUBLIC_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA'

let warned = false

export function turnstileSiteKey(): string {
  const key = process.env.OWNMIND_TURNSTILE_SITE_KEY || PUBLIC_TEST_SITE_KEY

  if (!process.env.OWNMIND_TURNSTILE_SITE_KEY && !warned) {
    warned = true
    console.warn(
      '[turnstile] using the public test keys. These accept every submission, ' +
        'so the challenge is not protecting anything. Set ' +
        'OWNMIND_TURNSTILE_SITE_KEY and OWNMIND_TURNSTILE_SECRET_KEY to fix it.',
    )
  }

  return key
}

function turnstileSecretKey(): string {
  return process.env.OWNMIND_TURNSTILE_SECRET_KEY || PUBLIC_TEST_SECRET_KEY
}

export type TurnstileResult = { ok: true } | { ok: false; reason: string }

/**
 * Ask Cloudflare whether the token is good. Anything unexpected fails closed:
 * a challenge that cannot be checked is not a challenge.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<TurnstileResult> {
  if (!token) {
    return { ok: false, reason: 'The challenge did not load. Refresh and try again.' }
  }

  const body = new URLSearchParams({ secret: turnstileSecretKey(), response: token })
  if (remoteIp) body.set('remoteip', remoteIp)

  let reply: Response
  try {
    reply = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      // A verdict we cannot get in time is a verdict we cannot trust.
      signal: AbortSignal.timeout(8_000),
    })
  } catch {
    return { ok: false, reason: 'The challenge could not be checked. Try again.' }
  }

  if (!reply.ok) {
    return { ok: false, reason: 'The challenge could not be checked. Try again.' }
  }

  let verdict: { success?: boolean; 'error-codes'?: string[] }
  try {
    verdict = (await reply.json()) as typeof verdict
  } catch {
    return { ok: false, reason: 'The challenge could not be checked. Try again.' }
  }

  if (verdict.success) return { ok: true }

  const codes = verdict['error-codes'] ?? []
  // Expired or already spent means the widget sat on screen too long.
  if (codes.includes('timeout-or-duplicate')) {
    return { ok: false, reason: 'The challenge expired. Try it again.' }
  }

  return { ok: false, reason: 'The challenge was not passed. Try again.' }
}