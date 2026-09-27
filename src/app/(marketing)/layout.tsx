import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

/**
 * Deliberately free of any request time data. Nothing on the public pages reads
 * a cookie, so all of them prerender as static HTML and can be served from a
 * cache without touching the application server.
 *
 * The header therefore always offers Sign in and Start saving. The sign in page
 * redirects an already authenticated visitor to their library, so nobody lands
 * somewhere confusing.
 */
export default function MarketingLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
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
