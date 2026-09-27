import { Pin, Search } from 'lucide-react'

/**
 * A still of the product, drawn with the same tokens and the same card anatomy
 * as the real grid. No stock photography, because a photograph of someone else's
 * dashboard would tell you less than the interface itself does.
 */
const CARDS = [
  {
    kind: 'Article',
    source: 'craigmod.com',
    title: 'A philosophy of software design',
    body: 'Argues for fewer, better tools: small surface area, durable data formats, and software that ages well instead of demanding constant migration.',
    tags: ['software-design', 'simplicity'],
    accent: '#8a6a3d',
  },
  {
    kind: 'Note',
    source: null,
    title: 'Ask about the kiln schedule before Friday',
    body: 'Cone 6, slow cool from 1000C. She said the old one runs about 40 degrees hot at the top shelf.',
    tags: ['kiln', 'to-ask'],
    accent: null,
  },
  {
    kind: 'Image',
    source: 'screenshot',
    title: 'Screenshot of the error, cropped to the message',
    body: 'A flat block stands in for the image here. In the app, a real photo is described and colour tagged automatically.',
    tags: ['debugging', 'error'],
    accent: '#3f5d52',
    swatch: true,
  },
  {
    kind: 'Link',
    source: 'typographica.org',
    title: 'Choosing a typeface for long reading',
    body: 'A practical guide to x-height, measure and the point size where a text face starts to feel tiring.',
    tags: ['typography', 'reference'],
    accent: null,
  },
]

export function BoardPreview() {
  return (
    <div className="overflow-hidden rounded-[8px] border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* Window bar: the search box doing the work the folders used to do. */}
      <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-3 py-2.5">
        <div className="relative flex-1">
          <Search
            size={14}
            strokeWidth={1.75}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          />
          <div className="field !h-9 !pl-9 text-[0.8125rem] text-ink">
            tag:typography
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">
              2 results
            </span>
          </div>
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          {['All', 'Notes', 'Links', 'Images'].map((chip, index) => (
            <span
              key={chip}
              className={`rounded-[5px] border px-2 py-1 text-[0.6875rem] ${
                index === 0
                  ? 'border-ink bg-ink text-bg'
                  : 'border-line text-muted'
              }`}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className="columns-1 gap-3 p-3 sm:columns-2 lg:columns-3">
        {CARDS.map((card, index) => (
          <article
            key={card.title}
            className="relative mb-3 break-inside-avoid overflow-hidden rounded-[6px] border border-line bg-surface"
          >
            {card.accent ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ backgroundColor: card.accent }}
              />
            ) : null}

            <div className="p-3.5">
              <div className="mb-2 flex items-center gap-2 text-[0.6875rem] tracking-wide text-muted uppercase">
                <span>{card.kind}</span>
                {card.source ? (
                  <>
                    <span aria-hidden="true">/</span>
                    <span className="truncate normal-case tracking-normal">{card.source}</span>
                  </>
                ) : null}
                {index === 0 ? (
                  <Pin size={12} strokeWidth={1.75} className="ml-auto text-accent" />
                ) : null}
              </div>

              <h3 className="font-sans text-[0.9375rem] leading-snug font-semibold">
                {card.title}
              </h3>

              {card.swatch ? (
                <div
                  className="mt-2.5 grid h-28 place-items-center rounded-[4px]"
                  style={{ backgroundColor: card.accent ?? '#3f5d52' }}
                >
                  <span className="text-[0.6875rem] text-white/80">
                    dominant colour picked up
                  </span>
                </div>
              ) : null}

              <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-ink-2">{card.body}</p>

              <ul className="mt-3 flex flex-wrap gap-1.5">
                {card.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-[3px] bg-bg-alt px-1.5 py-0.5 text-[0.6875rem] text-muted"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between border-t border-line px-3.5 py-2 text-[0.6875rem] text-muted">
              <span>{index === 0 ? '12 Mar 2026 / 4 min' : index === 1 ? '14 Mar 2026' : '9 Mar 2026'}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
