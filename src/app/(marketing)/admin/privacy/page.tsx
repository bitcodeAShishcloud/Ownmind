import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { adminConfigured, ADMIN_COOKIE, isAdmin, tokensMatch } from '@/lib/admin'
import { buildDashboard } from '@/lib/analytics'
import {
  ANALYTICS_RETENTION_DAYS,
  CONSENT_RETENTION_DAYS,
  recentDeletionRequests,
} from '@/lib/retention'

export const metadata: Metadata = {
  title: 'Privacy dashboard',
  // Never index a page that reads the visitor table, even by accident.
  robots: { index: false, follow: false },
  alternates: { canonical: '/admin/privacy' },
}

/**
 * Never prerender this page.
 *
 * The public pages here are deliberately static, and a build can evaluate
 * process.env: a dashboard that read the admin token at build time would bake
 * in whatever the build machine happened to have, then serve that answer to
 * everyone. Every request has to read the environment as it is now.
 */
export const dynamic = 'force-dynamic'

/** Compared on the server, then dropped. It is never returned to the page. */
async function unlock(formData: FormData) {
  'use server'
  const provided = String(formData.get('token') ?? '')
  const expected = process.env.OWNMIND_ADMIN_TOKEN?.trim()
  if (!expected || provided.length === 0 || !tokensMatch(provided, expected)) return

  const jar = await cookies()
  jar.set(ADMIN_COOKIE, provided, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? 'sriprayagclasses.in' : undefined,
    expires: new Date(Date.now() + 8 * 3_600_000),
  })
}

export default async function AdminPrivacyPage() {
  if (!adminConfigured()) {
    return (
      <Frame>
        <h1 className="text-[2rem] leading-tight">Privacy dashboard</h1>
        <p className="mt-4 max-w-2xl text-ink-2">
          This dashboard is closed because{' '}
          <code className="font-mono text-[0.8125rem]">OWNMIND_ADMIN_TOKEN</code>{' '}
          is not set. That is deliberate: a dashboard left open because an
          environment variable was forgotten would publish every visitor&rsquo;s
          city and reading habits.
        </p>
        <p className="mt-3 max-w-2xl text-muted">
          Set it to any long random string, restart the service, then return
          here and unlock with that same value.
        </p>
      </Frame>
    )
  }

  if (!(await isAdmin())) {
    return (
      <Frame>
        <h1 className="text-[2rem] leading-tight">Privacy dashboard</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Aggregate counts only. Nothing here identifies a visitor, because
          nothing we store does.
        </p>
        <form action={unlock} className="mt-6 max-w-md">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="token" className="text-sm font-medium">
              Dashboard token
            </label>
            <input
              id="token"
              name="token"
              type="password"
              autoComplete="off"
              required
              className="field"
            />
          </div>
          <button type="submit" className="btn btn-primary mt-4 w-full">
            Unlock
          </button>
        </form>
      </Frame>
    )
  }

  const data = buildDashboard()
  const requests = recentDeletionRequests(10)

  return (
    <Frame>
      <h1 className="text-[2rem] leading-tight">Privacy dashboard</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Aggregate counts. The tables these are read from have no account and no
        email column, so there is no per visitor view to build even if one was
        wanted.
      </p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Page views" value={data.totals.pageviews} />
        <Stat label="Visits" value={data.totals.sessions} />
        <Stat label="Outbound clicks" value={data.totals.outboundClicks} />
        <Stat label="Read past half" value={data.totals.scrollHalf} />
        <Stat label="Consent decisions" value={data.totals.consentLogs} />
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <Section title="Page views per day">
          {data.pageviewsPerDay.length === 0 ? (
            <Empty />
          ) : (
            <Table
              head={['Day', 'Views']}
              rows={data.pageviewsPerDay.map((r) => [r.day, String(r.count)])}
            />
          )}
        </Section>

        <Section title="Top pages">
          {data.topPages.length === 0 ? (
            <Empty />
          ) : (
            <Table
              head={['Path', 'Views']}
              rows={data.topPages.map((r) => [r.path, String(r.count)])}
            />
          )}
        </Section>

        <Section title="Top referrers">
          {data.topReferrers.length === 0 ? (
            <Empty />
          ) : (
            <Table
              head={['Referrer', 'Views']}
              rows={data.topReferrers.map((r) => [r.referrer, String(r.count)])}
            />
          )}
        </Section>

        <Section title="Device type">
          {data.deviceTypes.length === 0 ? (
            <Empty />
          ) : (
            <Table
              head={['Device', 'Count']}
              rows={data.deviceTypes.map((r) => [r.device_type, String(r.count)])}
            />
          )}
        </Section>

        <Section title="Approximate city">
          {data.cities.length === 0 ? (
            <Empty />
          ) : (
            <Table
              head={['City', 'Count']}
              rows={data.cities.map((r) => [r.city, String(r.count)])}
            />
          )}
        </Section>

        <Section title="Approximate country">
          {data.countries.length === 0 ? (
            <Empty />
          ) : (
            <Table
              head={['Country', 'Count']}
              rows={data.countries.map((r) => [r.country, String(r.count)])}
            />
          )}
        </Section>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <Section title="Consent choices">
          {data.consentBreakdown.length === 0 ? (
            <Empty />
          ) : (
            <Table
              head={['Source', 'Times', 'Prefs', 'Analytics', 'Location', 'Device']}
              rows={data.consentBreakdown.map((r) => [
                r.source,
                String(r.count),
                String(r.preferences),
                String(r.analytics),
                String(r.location),
                String(r.device),
              ])}
            />
          )}
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Necessary is always on and so is not a column. A row of zeroes next
            to a mode is the expected result of a well functioning banner.
          </p>
        </Section>

        <Section title="Deletion requests">
          {requests.length === 0 ? (
            <Empty />
          ) : (
            <Table
              head={['When', 'Address', 'Status']}
              rows={requests.map((r) => [
                r.createdAt.slice(0, 16).replace('T', ' '),
                r.email,
                r.status,
              ])}
            />
          )}
        </Section>
      </div>

      <div className="mt-12 rounded-[6px] border border-line bg-bg-alt p-5">
        <h2 className="text-[0.9375rem] font-medium">Retention in force</h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-ink-2">
          <li>Analytics, location and device rows: {ANALYTICS_RETENTION_DAYS} days, then deleted.</li>
          <li>Consent records: {CONSENT_RETENTION_DAYS} days from the last decision, then deleted.</li>
          <li>Server access logs: 90 days, rotated away by logrotate.</li>
        </ul>
        <p className="mt-2 text-xs text-muted">
          Enforced by <code className="font-mono">ownmind-retention.timer</code>,
          daily. Manual run: <code className="font-mono">npm run retention</code>.
        </p>
      </div>
    </Frame>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-line">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-6">
        <p className="eyebrow">Analytics</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[6px] border border-line bg-bg-alt px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-[1.5rem] leading-none">{value.toLocaleString('en-IN')}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[0.9375rem] font-medium">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Empty() {
  return <p className="text-sm text-muted">Nothing recorded yet.</p>
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line-strong">
            {head.map((cell) => (
              <th key={cell} className="py-2 pr-4 font-medium text-ink">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join('|')} className="border-b border-line">
              {row.map((cell, index) => (
                <td key={index} className="max-w-[16rem] truncate py-2 pr-4 text-ink-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}