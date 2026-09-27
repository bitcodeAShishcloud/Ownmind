import Link from 'next/link'
import { PageHeader, Section } from '@/components/page-header'

export const metadata = {
  title: 'How it works',
  description:
    'What OwnMind does when you paste a link, drop an image or write a note, and how the search understands what you half remember.',
  alternates: { canonical: '/how' },
}

const SAVE_BEHAVIOUR = [
  {
    input: 'A link',
    example: 'https://example.com/a-long-article',
    steps: [
      'The page is fetched and stripped of menus, adverts, cookie banners and scripts.',
      'The title, site name, author and lead image are pulled out.',
      'The body text is kept, so the article still opens if the source is deleted later.',
      'A short summary and a set of tags are generated and attached.',
    ],
  },
  {
    input: 'An image',
    example: 'a screenshot or a photo',
    steps: [
      'The image is resized and compressed in your browser before upload.',
      'The dominant colour is measured, and cards carry a colour bar for that reason.',
      'The image is described: what is in it, what it is good for, and any text printed on it.',
      'Text found inside the image is added to the search index, so a word in a screenshot is findable.',
    ],
  },
  {
    input: 'A note',
    example: 'Ask about the kiln schedule before Friday',
    steps: [
      'The text is stored exactly as you typed it, with no rewriting.',
      'Tags are still generated, because keywords are what make it findable later.',
      'Short notes are left alone. There is no summary on something this short.',
    ],
  },
]

const SEARCH_ROWS = [
  { query: 'letterpress', does: 'Titles, text, tags, summaries and site names, all at once.' },
  { query: 'tag:typography', does: 'Only items carrying that tag.' },
  { query: 'kind:image', does: 'Only images. Also note, link and article.' },
  { query: 'site:typographica.org', does: 'Only saves from that domain.' },
  { query: 'ceramics -glaze', does: 'Ceramics, but leave out anything about glaze.' },
  { query: 'ochre', does: 'Matches a colour word in a tag, so a warm photograph is findable by its colour.' },
]

export default function HowPage() {
  return (
    <>
      <PageHeader
        eyebrow="How it works"
        title="One box goes in. Something findable comes out."
        lede={
          <>
            OwnMind takes whatever you drop in and does the tidying that you would otherwise
            have to do later. Here is exactly what happens to each kind of save.
          </>
        }
      />

      <Section>
        <h2 className="text-2xl">What happens to each save</h2>

        <div className="mt-8 flex flex-col gap-8">
          {SAVE_BEHAVIOUR.map((entry) => (
            <div key={entry.input} className="grid gap-4 md:grid-cols-[minmax(0,14rem)_1fr] md:gap-8">
              <div>
                <h3 className="text-lg">{entry.input}</h3>
                <p className="mt-1 font-mono text-[0.8125rem] text-muted">{entry.example}</p>
              </div>
              <ol className="flex flex-col gap-2.5">
                {entry.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink-2">
                    <span className="mt-0.5 shrink-0 font-mono text-xs text-muted">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Section>

      <Section alt>
        <h2 className="text-2xl">Searching by impression</h2>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
          Most search boxes want the exact word you saved. That is no use when you only
          remember a colour or half a brand. The operators below narrow a search when a plain
          word is too broad.
        </p>

        <dl className="mt-8 flex flex-col gap-3">
          {SEARCH_ROWS.map((row) => (
            <div
              key={row.query}
              className="grid gap-1 rounded-[6px] border border-line bg-surface px-4 py-3 sm:grid-cols-[minmax(0,18rem)_1fr] sm:gap-6"
            >
              <dt>
                <code className="font-mono text-[0.875rem] text-ink">{row.query}</code>
              </dt>
              <dd className="text-sm text-ink-2">{row.does}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section>
        <h2 className="text-2xl">Spaces</h2>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
          A space is a search you decided to keep. Give it a name and a rule, and it holds
          itself up to date. Tag a note{' '}
          <code className="rounded-[3px] bg-bg-alt px-1 py-0.5 text-[0.8125rem]">ceramics</code>{' '}
          today and it appears in a space built on that word without you doing anything else.
        </p>
        <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
          This is the closest thing to a folder, and it behaves differently. You never move
          things into it, and you never maintain it. If you change a tag, the membership
          follows.
        </p>
      </Section>

      <Section alt>
        <h2 className="text-2xl">Links between items</h2>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
          Open any item and you can connect it to another. The connection is stored on both
          sides, so neither note becomes a dead end. It is the one piece of organisation OwnMind
          leaves entirely to you, because a deliberate connection is worth more than an inferred
          one.
        </p>
        <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
          Items that share tags are also suggested underneath, which is usually enough to
          rediscover a trail you thought you had lost.
        </p>
      </Section>

      <Section>
        <h2 className="text-2xl">Recall</h2>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
          Recall shows one thing you saved weeks ago and have not opened since. You keep it or
          let it go. Things you let go are archived and stop being offered, and nothing is ever
          deleted from Recall without you asking.
        </p>
        <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
          It is on purpose slow. A stream of things you did not choose to see is just another
          feed.
        </p>
      </Section>

      <Section alt>
        <h2 className="text-2xl">What is not built yet</h2>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
          We would rather say this plainly than list it as a feature.
        </p>
        <ul className="mt-4 flex max-w-2xl flex-col gap-2.5">
          {[
            'There is no browser extension yet. Saving from another page means copying the link into the box.',
            'There are no mobile apps. The site works on a phone, but it is not a native app.',
            'There is no PDF analysis and no video upload. Those are planned, not shipped.',
            'There is no public API and no team sharing.',
          ].map((item) => (
            <li key={item} className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-ink-2">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
              {item}
            </li>
          ))}
        </ul>
        <Link href="/signup" className="btn btn-primary mt-7 h-10 px-5">
          Try it with what you already have
        </Link>
      </Section>
    </>
  )
}
