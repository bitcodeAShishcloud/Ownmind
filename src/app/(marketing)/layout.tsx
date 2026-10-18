import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ConsentGate } from '@/components/consent-gate'

/**
 * Deliberately free of any request time data. Nothing on the public pages reads
 * a cookie, so all of them prerender as static HTML and can be served from a
 * cache without touching the application server.
 *
 * The header therefore always offers Sign in and Start saving. The sign in page
 * redirects an already authenticated visitor to their library, so nobody lands
 * somewhere confusing.
 *
 * The consent gate lives here rather than in the root layout on purpose. The
 * workspace behind sign in holds somebody's own private library, and counting
 * what they read inside it would be measuring the wrong thing while asking for
 * a decision on a page where the decision does not apply.
 */
export default function MarketingLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <ConsentGate />
    </div>
  )
}

export function MarketingHeaderActions() {
  return (
    <>
      <Link href="/signin" className="btn btn-ghost hidden h-9 text-[0.8125rem] sm:inline-flex">
        Sign in
      </Link>
      <Link href="/signup" className="btn btn-primary h-9 text-[0.8125rem]">
        Start saving
      </Link>
    </>
  )
}
