import type { ReactNode } from 'react'
import Link from 'next/link'
import { legalLinks, site } from '@/lib/site'

/**
 * Shared frame for the legal pages: title, effective date, a table of contents
 * built from the sections passed in, and a cross link to the other document.
 */
export function LegalPage({
  title,
  effective,
  summary,
  sections,
}: {
  title: string
  effective: string
  summary: ReactNode
  sections: Array<{ id: string; heading: string; body: ReactNode }>
}) {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-6 sm:py-18">
          <p className="eyebrow">Legal</p>
          <h1 className="mt-3 text-[2rem] leading-tight sm:text-[2.25rem]">{title}</h1>
          <p className="mt-3 text-sm text-muted">Effective {effective}</p>
          <div className="mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
            {summary}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl gap-12 px-5 py-14 sm:px-6 lg:grid lg:grid-cols-[minmax(0,15rem)_1fr]">
        <nav aria-label="On this page" className="mb-10 lg:mb-0">
          <p className="eyebrow">On this page</p>
          <ol className="mt-3 flex flex-col gap-1.5">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-ink-2 hover:text-accent-ink"
                >
                  <span className="mr-1.5 font-mono text-xs text-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="prose-legal max-w-none">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2>{section.heading}</h2>
              {section.body}
            </section>
          ))}

          <div className="mt-12 rounded-[6px] border border-line bg-bg-alt p-5">
            <p className="text-sm text-ink-2">
              Questions about this document:{' '}
              <a
                href={`mailto:${site.legalName === site.name ? site.supportEmail : site.contactEmail}`}
                className="text-accent-ink underline underline-offset-2"
              >
                {site.contactEmail}
              </a>
              .
            </p>
            <p className="mt-2 text-sm text-muted">
              The{' '}
              {legalLinks.map((link, index) => (
                <span key={link.href}>
                  <Link
                    href={link.href}
                    className="text-ink-2 underline underline-offset-2 hover:text-accent-ink"
                  >
                    {link.label}
                  </Link>
                  {index < legalLinks.length - 1 ? ' and the ' : ''}
                </span>
              ))}
              {' '}cover the same service from different angles.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
