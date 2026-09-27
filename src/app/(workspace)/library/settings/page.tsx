import { Download, ShieldCheck } from 'lucide-react'
import { requireUser } from '@/lib/session'
import { countCards } from '@/lib/cards'
import { formatDateTime, initials } from '@/lib/format'
import { isAiConfigured } from '@/lib/ai'
import { SignOutButton } from '@/components/sign-out-button'
import { DeleteAccountButton } from '@/components/delete-account-button'

export const metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
}

export default async function SettingsPage() {
  const user = await requireUser('/library/settings')
  const counts = countCards(user.id)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-xl">Settings</h1>
        <p className="mt-1 text-sm text-muted">Your account and your data.</p>
      </div>

      <section className="panel p-5">
        <h2 className="text-base">Account</h2>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Signed in as</dt>
            <dd className="truncate">{user.email}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Member since</dt>
            <dd>{formatDateTime(user.created_at)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Items stored</dt>
            <dd>{counts.total}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <SignOutButton email={user.email} initials={initials(user.email)} />
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="flex items-center gap-2 text-base">
          <Download size={15} strokeWidth={1.75} />
          Export everything
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
          A single JSON file with every note, link, image reference, tag and link you have saved.
          If you ever want to leave, this file is yours and nothing is held back.
        </p>
        <form action="/api/export" method="get" className="mt-3">
          <button type="submit" className="btn btn-outline h-9">
            Download my data
          </button>
        </form>
      </section>

      <section className="panel p-5">
        <h2 className="flex items-center gap-2 text-base">
          <ShieldCheck size={15} strokeWidth={1.75} />
          How your data is handled
        </h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-ink-2">
          <li>
            Labels and summaries run on our server. Whether a language model is currently
            enabled: <strong className="font-medium text-ink">{isAiConfigured() ? 'yes' : 'no'}</strong>.
          </li>
          <li>
            There are no third party analytics scripts, no advertising trackers and no pixels in
            this application.
          </li>
          <li>
            Images you upload are stored on our own disk under a random filename and served only
            to you.
          </li>
        </ul>
        <a
          href="/privacy"
          className="mt-3 inline-block text-sm text-accent-ink underline underline-offset-2"
        >
          Read the full privacy policy
        </a>
      </section>

      <section className="rounded-[6px] border border-line p-5">
        <h2 className="text-base text-accent-ink">Delete your account</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
          This removes your account and every note, link, image and tag attached to it. It cannot
          be undone. Export your data first if you want to keep a copy of the text.
        </p>
        <DeleteAccountButton email={user.email} />
      </section>
    </div>
  )
}
