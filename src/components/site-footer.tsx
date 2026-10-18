import Link from 'next/link'
import { legalLinks, navLinks, site } from '@/lib/site'
import { ConsentSettingsButton } from './consent-settings-button'

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-xs">
          <p className="font-display text-[1.0625rem]">{site.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{site.tagline}</p>
          <p className="mt-4 text-sm text-muted">
            <a href={`mailto:${site.contactEmail}`} className="hover:text-ink">
              {site.contactEmail}
            </a>
          </p>
          <div className="mt-4">
            <ConsentSettingsButton />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <FooterColumn
            heading="Product"
            links={[
              ...navLinks,
              { href: '/signup', label: 'Start saving' },
            ]}
          />
          <FooterColumn
            heading="Legal"
            links={[...legalLinks, { href: '/faq', label: 'Questions' }]}
          />
          <FooterColumn
            heading="Account"
            links={[
              { href: '/signin', label: 'Sign in' },
              { href: '/library', label: 'Your library' },
            ]}
          />
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-5 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            &copy; {site.foundedYear} {site.legalName}. All rights reserved.
          </p>
          <p>{site.location}</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string
  links: ReadonlyArray<{ href: string; label: string }>
}) {
  return (
    <div>
      <h2 className="eyebrow">{heading}</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-ink-2 hover:text-accent-ink">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
