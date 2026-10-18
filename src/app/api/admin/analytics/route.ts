import { isAdmin } from '@/lib/admin'
import { buildDashboard } from '@/lib/analytics'

/**
 * The numbers behind the privacy dashboard.
 *
 * Aggregate counts only. There is no endpoint here that lists individual rows,
 * so there is no way to ask "what did this one visitor do" — which is the whole
 * point of storing aggregates with no identifier in them.
 *
 * Refused with 401 when the admin token is missing or wrong, and 503 when it is
 * not configured at all, so a misconfigured deployment fails closed instead of
 * reporting an empty dashboard that looks like real data.
 */
export async function GET() {
  if (!(await isAdmin())) {
    return Response.json({ error: 'Not authorised.' }, { status: 401 })
  }

  return Response.json(buildDashboard(), {
    status: 200,
    headers: { 'cache-control': 'no-store, private' },
  })
}