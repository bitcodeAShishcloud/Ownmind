import type { Metadata } from 'next'
import Link from 'next/link'
import { DeleteDataForm } from '@/components/delete-data-form'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Delete my data',
  description:
    'Ask for your OwnMind account and everything in it to be deleted. Handled immediately.',
}

const OFFICER = site.grievanceOfficer

export default function DataDeletionPage() {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-6 sm:py-18">
          <p className="eyebrow">Privacy</p>
          <h1 className="mt-3 text-[2rem] leading-tight sm:text-[2.25rem]">
            Delete my data
          </h1>
          <div className="mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
            <p>
              This is section 12 of the DPDP Act, made into a button. Enter the
              address on your account and it is deleted straight away. Your
              profile, every card you saved, every space, and every active
              session. You do not wait for a reply to get it done.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl gap-12 px-5 py-14 sm:px-6 lg:grid lg:grid-cols-[minmax(0,15rem)_1fr]">
        <nav aria-label="On this page" className="mb-10 lg:mb-0">
          <p className="eyebrow">On this page</p>
          <ol className="mt-3 flex flex-col gap-1.5">
            {[
              ['request', 'Make a request'],
              ['what-goes', 'What gets deleted'],
              ['what-stays', 'What is not linked to you'],
              ['no-account', 'No account found'],
              ['other-data', 'Anything else'],
            ].map(([id, label], index) => (
              <li key={id}>
                <a href={`#${id}`} className="text-sm text-ink-2 hover:text-accent-ink">
                  <span className="mr-1.5 font-mono text-xs text-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="prose-legal max-w-none">
          <section id="request" className="scroll-mt-24">
            <h2>Make a request</h2>
            <DeleteDataForm />
            <p className="mt-4">
              Prefer email? Write to{' '}
              <a href={`mailto:${OFFICER.email}`}>{OFFICER.email}</a> with{' '}
              <strong>Delete my data</strong> in the subject.
            </p>
          </section>

          <section id="what-goes" className="scroll-mt-24">
            <h2>What gets deleted</h2>
            <ul>
              <li>Your account record.</li>
              <li>Every card in your library, including links between them.</li>
              <li>Every space, and its rules.</li>
              <li>Every active session, so any signed in browser is signed out.</li>
              <li>Any unused sign in codes and half finished sign ups for that address.</li>
            </ul>
            <p>
              This is a real delete from the database. Rows are removed, not
              hidden with a flag, so there is nothing left to restore by
              accident and no copy kept as a backup.
            </p>
          </section>

          <section id="what-stays" className="scroll-mt-24">
            <h2>What is not linked to you</h2>
            <p>
              Page view statistics, rough location and device details are kept,
              and they are not something we can delete on request, because they
              were never attached to you in the first place.
            </p>
            <p>
              Those tables hold no account, no email, and no persistent
              identifier. A visit is counted under a random number that is new
              each time and discarded when the tab closes. There is no key we
              could look up to find your rows, which is exactly why nothing you
              approved as anonymous can be turned back into something personal
              later.
            </p>
            <p>
              Those rows are deleted on their own schedule instead:{' '}
              <Link href="/privacy">12 months</Link> after they were collected.
            </p>
          </section>

          <section id="no-account" className="scroll-mt-24">
            <h2>If no account is found</h2>
            <p>
              You will be told that nothing matched. That is not a way of
              checking whether an address is registered, because the same message
              comes back whether or not there was ever an account.
            </p>
            <p>
              You may still have browsed without ever signing up. That activity
              was anonymous from the start and is on the same 12 month schedule.
            </p>
          </section>

          <section id="other-data" className="scroll-mt-24">
            <h2>Anything else</h2>
            <p>
              If you asked us to delete something other than an account, or you
              want a copy of what we hold before deciding, write to{' '}
              <a href={`mailto:${OFFICER.email}`}>{OFFICER.email}</a>. We
              acknowledge privacy requests within 7 days and resolve them within
              30 days.
            </p>
            <p>
              Read the <Link href="/privacy">Privacy Policy</Link> for retention
              periods, or the <Link href="/cookie-policy">Cookie Policy</Link> to
              turn categories off without deleting an account.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}