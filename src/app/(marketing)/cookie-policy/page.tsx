import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'Every cookie and local storage key OwnMind uses, what each one holds, how long it lasts, and how to turn it off.',
}

const EFFECTIVE = '18 October 2026'

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      effective={EFFECTIVE}
      summary={
        <>
          <p>
            This page lists every single thing this site stores in your browser
            and on our servers, why it is there, and how long it stays. There
            are no advertising cookies, no cross-site trackers, and no third
            party scripts of any kind. If a row is not on this page, the site
            does not use it.
          </p>
        </>
      }
      sections={[
        {
          id: 'how-to-refuse',
          heading: 'You can refuse, and nothing breaks',
          body: (
            <>
              <p>
                Every category except the necessary one starts switched off. You
                can leave it that way and use the whole site: read pages, watch
                nothing, sign in, save things. There is no cookie wall and no
                part of the site that stops working when you decline.
              </p>
              <p>
                The three options on the banner are drawn identically, in the
                same size and colour, in the same order every time. Accepting
                is not made easier than refusing, because a design that makes
                refusing harder is a dark pattern and the law does not allow it.
              </p>
              <p>
                You can change your mind whenever you like. Use{' '}
                <strong>Cookie settings</strong> in the footer of any page. A
                change takes effect immediately, and you do not need to clear
                your browser storage by hand.
              </p>
            </>
          ),
        },
        {
          id: 'necessary',
          heading: 'Necessary storage: always on',
          body: (
            <>
              <p>
                These are the only ones that run without your asking. They are
                what lets the site remember a decision you made, and what keeps
                you signed in. Switching them off would mean the site could not
                hold your consent record, which the law requires it to do.
              </p>
              <Table
                head={['Name', 'Where', 'What it holds', 'Duration']}
                rows={[
                  [
                    'cc_consent',
                    'localStorage',
                    'The categories you chose, the policy version, and the date and time you chose them.',
                    'Until you clear it or change it',
                  ],
                  [
                    'ownmind_session',
                    'Cookie (httpOnly)',
                    'A random session token. It identifies a signed in browser, not a person, and holds no personal data.',
                    '30 days, or until you sign out',
                  ],
                  [
                    'ownmind_pending_auth',
                    'Cookie (httpOnly)',
                    'A one-time token that carries a sign up or sign in across the two pages it needs.',
                    '1 hour',
                  ],
                  [
                    'ownmind_admin',
                    'Cookie (httpOnly)',
                    'The privacy dashboard unlock token. Set only if you unlock the dashboard yourself.',
                    'Session',
                  ],
                ]}
              />
              <p className="mt-4">
                <code>httpOnly</code> means the browser will not let a script
                read these. They are not readable or writable by anything the
                page runs.
              </p>
            </>
          ),
        },
        {
          id: 'preferences',
          heading: 'Preferences: off by default',
          body: (
            <>
              <p>
                Remembers choices you make about how the site looks and behaves,
                so you are not asked twice.
              </p>
              <Table
                head={['Name', 'Where', 'What it holds', 'Duration']}
                rows={[
                  [
                    'ownmind-theme',
                    'localStorage',
                    'Light or dark. Nothing else.',
                    'Until you clear it',
                  ],
                ]}
              />
            </>
          ),
        },
        {
          id: 'analytics',
          heading: 'Analytics: off by default',
          body: (
            <>
              <p>
                Counts what is read so the site can be improved. It records
                which page, how far down it was read, and which outside link was
                followed.
              </p>
              <Table
                head={['Name', 'Where', 'What it holds', 'Duration']}
                rows={[
                  [
                    'cc_session_id',
                    'sessionStorage',
                    'A random identifier for this visit only, so two page views can be counted as one visit. New every session, gone when the tab closes.',
                    'Until you close the tab',
                  ],
                ]}
              />
              <p className="mt-4">
                <code>cc_session_id</code> is not a person. It is not linked to
                your account, it is not reused in a later visit, and it cannot
                be turned into one by joining it against anything else.
              </p>
              <p>
                Queries are stripped from every URL before it is stored, so a
                value that arrived in a link by accident is never kept. The site
                never records what you type, what you search inside your
                library, what you save, or anything inside your account.
              </p>
            </>
          ),
        },
        {
          id: 'location',
          heading: 'Location: off by default, approximate only',
          body: (
            <>
              <p>
                Works out roughly where a visit came from, at city level. This
                site is served through Cloudflare, which reads the network
                address a request arrives on and attaches the country, region
                and city as request headers. Our server reads those headers
                directly.
              </p>
              <p>
                Your network address is never sent to a separate location
                service to be looked up. <code>navigator.geolocation</code> is
                not used anywhere in this project, and there is no way for it to
                be used, so an exact position cannot be obtained through this
                site even by accident.
              </p>
              <p>
                Where coordinates are available they are rounded to two decimal
                places, roughly a kilometre, before anything is stored. City,
                region and country are stored. A street, a building, or a pin on
                a map is not.
              </p>
            </>
          ),
        },
        {
          id: 'device',
          heading: 'Device information: off by default',
          body: (
            <>
              <p>
                Basic facts about the browser and screen, so the site can be
                checked on the devices people actually use. Read from the
                standard <code>navigator</code>, <code>screen</code> and{' '}
                <code>Intl</code> interfaces.
              </p>
              <p>
                Browser name and version, operating system, screen size, window
                size, language, time zone, and whether the visit was on a
                desktop or a mobile. No fingerprinting library is used, and the
                fields collected are not combined into a unique identifier.
              </p>
            </>
          ),
        },
        {
          id: 'no-marketing',
          heading: 'What is not here',
          body: (
            <>
              <p>
                There is no marketing category, because OwnMind runs no
                advertising and sells no data.
              </p>
              <ul>
                <li>No advertising cookies and no ad identifiers.</li>
                <li>No Google Ads, Meta Pixel, or any ad network SDK.</li>
                <li>No third party analytics such as Google Analytics or Clarity.</li>
                <li>No data sold, rented, or shared with advertisers.</li>
                <li>No cross-site tracking. Nothing follows you off this site.</li>
              </ul>
              <p>
                If a third party tool is ever added, it is agreed in writing
                first and this page is updated before it goes live.
              </p>
            </>
          ),
        },
        {
          id: 'controlling',
          heading: 'How to control this yourself',
          body: (
            <>
              <p>
                <strong>On this site.</strong> Use <strong>Cookie settings</strong>{' '}
                in the footer. Each category can be switched on or off on its
                own, and a change is immediate.
              </p>
              <p>
                <strong>In your browser.</strong> Every major browser can block
                or clear cookies and site data for this site. Blocking storage
                entirely will also sign you out, because the session lives
                there.
              </p>
              <p>
                <strong>Ask us to remove it.</strong> The{' '}
                <a href="/data-deletion">data deletion page</a> deletes an
                account and everything in it straight away. Write to{' '}
                <a href={`mailto:${site.grievanceOfficer.email}`}>
                  {site.grievanceOfficer.email}
                </a>{' '}
                for anything else.
              </p>
            </>
          ),
        },
      ]}
    />
  )
}

function Table({
  head,
  rows,
}: {
  head: string[]
  rows: string[][]
}) {
  return (
    <div className="my-5 overflow-x-auto">
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
            <tr key={row[0]} className="border-b border-line align-top">
              {row.map((cell, index) => (
                <td
                  key={index}
                  className="py-3 pr-4 leading-relaxed text-ink-2"
                >
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