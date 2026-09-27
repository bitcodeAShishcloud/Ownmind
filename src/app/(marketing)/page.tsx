import Link from 'next/link'
import {
  Bookmark,
  FileText,
  Image as ImageIcon,
  Link2,
  Lock,
  Search,
  Sparkles,
  StickyNote,
  Tags,
} from 'lucide-react'
import { heroCopy } from '@/lib/site'
import { BoardPreview } from '@/components/board-preview'

const FEATURES = [
  {
    icon: Bookmark,
    title: 'One box for everything',
    body: 'A link, a thought, a screenshot, a whole article. Same box, and OwnMind works out which it is for you.',
  },
  {
    icon: Tags,
    title: 'Tags you never wrote',
    body: 'Every save is labelled the moment it lands. Keywords, a readable title and a short summary, so the thing is findable later.',
  },
  {
    icon: Search,
    title: 'Search by what you remember',
    body: 'Type a word, a colour, a brand or a site. Add tag: or kind: when you want to be precise about it.',
  },
  {
    icon: FileText,
    title: 'Read it without the noise',
    body: 'Saved pages are stripped of menus, adverts and pop ups. The article text is kept, so it still opens when the source disappears.',
  },
  {
    icon: ImageIcon,
    title: 'Images that describe themselves',
    body: 'Drop in a photo and it gets a title, a summary and the dominant colour. Text inside a screenshot becomes searchable.',
  },
  {
    icon: Link2,
    title: 'Connect what belongs together',
    body: 'Link any two items by hand. Each link shows up on both, so a research trail stays readable months later.',
  },
  {
    icon: StickyNote,
    title: 'Notes that stay as written',
    body: 'Some things are a sentence, not a document. Write it and it is filed exactly as you typed it.',
  },
  {
    icon: Sparkles,
    title: 'Rediscover old saves',
    body: 'Recall brings back one thing you have not looked at in a while. Keep it or let it go, and it learns what to show you.',
  },
]

const STEPS = [
  {
    title: 'Drop it in',
    body: 'Paste a link, type a note, or drop an image into the box. One field, no format picker, no choose a folder dialog.',
  },
  {
    title: 'OwnMind reads it',
    body: 'The page is fetched and cleaned, the image is described, and the whole thing is labelled with a title, tags and a summary.',
  },
  {
    title: 'Find it later',
    body: 'Search the words you half remember. Or pin what you are working on this week and let Recall surface the rest.',
  },
]

export default function HomePage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <h1 className="text-[2.25rem] leading-[1.06] sm:text-[3rem]">
              {heroCopy.headline}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink-2">{heroCopy.sub}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn btn-primary h-11 px-5">
                {heroCopy.primaryCta}
              </Link>
              <Link href="/how" className="btn btn-outline h-11 px-5">
                {heroCopy.secondaryCta}
              </Link>
            </div>

            <p className="mt-4 text-sm text-muted">
              Free to start, no card. Add a browser extension when you want it.
            </p>
          </div>

          <div className="mt-14">
            <BoardPreview />
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <h2 className="text-2xl sm:text-[1.75rem]">
              You will not remember the folder.
              <br />
              You will remember the colour.
            </h2>
            <div className="flex flex-col gap-4 text-[0.9375rem] leading-relaxed text-ink-2">
              <p>
                Almost everyone who saves things on the web has a folder called Ideas, and a
                subfolder called Ideas to sort later. The filing takes longer than the finding, and
                the finding is the part you actually needed.
              </p>
              <p>
                What you really remember is not a category. It is a rough impression: a green
                photograph, something about letterpress, a page a friend sent you on a train.
                OwnMind indexes all of that, so you can search the impression instead of the label.
              </p>
              <p>
                There are no folders here, on purpose. There is one grid, and a search box that
                understands what you half know.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-bg-alt">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl sm:text-[1.75rem]">What it actually does</h2>
          <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
            Eight things, all of them real parts of the product rather than a roadmap.
          </p>

          <ul className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <li key={feature.title}>
                <feature.icon size={19} strokeWidth={1.6} className="text-accent" />
                <h3 className="mt-3 font-sans text-[0.9375rem] font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{feature.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl sm:text-[1.75rem]">Three steps, then you forget about it</h2>

          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="font-display text-3xl text-accent">{index + 1}</span>
                <h3 className="mt-2 text-lg">{step.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-line bg-bg-alt">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div>
              <Lock size={19} strokeWidth={1.6} className="text-accent" />
              <h2 className="mt-3 text-2xl sm:text-[1.75rem]">
                There is nothing to sell here
              </h2>
              <div className="mt-4 flex flex-col gap-4 text-[0.9375rem] leading-relaxed text-ink-2">
                <p>
                  The cheapest way to run a service is to have one thing to sell. OwnMind has one:
                  the subscription. That is why there are no adverts, no sponsored results and no
                  third party trackers in this app.
                </p>
                <p>
                  There is no public profile, no follower count, no leaderboard and no way for
                  anyone else to see what you saved. Your library is reachable by your account
                  alone, and you can export all of it as JSON whenever you want.
                </p>
              </div>
              <Link
                href="/privacy"
                className="mt-5 inline-block text-[0.9375rem] text-accent-ink underline underline-offset-2"
              >
                Read the privacy policy
              </Link>
            </div>

            <ul className="flex flex-col gap-3 self-start">
              {[
                'No advertising, on any page',
                'No third party analytics scripts',
                'No selling or sharing of your library',
                'No social features and no public links',
                'One click export of everything you saved',
                'Delete your account and all of its data',
              ].map((promise) => (
                <li key={promise} className="flex items-start gap-2.5 text-[0.9375rem] text-ink-2">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent"
                  />
                  {promise}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-[1.75rem]">Start with the last thing you saved</h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
              The free plan is not a trial that expires. Sign up, drop something in, and see
              whether you can find it again by describing it rather than naming it.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-primary h-11 px-5">
                Create your account
              </Link>
              <Link href="/pricing" className="btn btn-outline h-11 px-5">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
