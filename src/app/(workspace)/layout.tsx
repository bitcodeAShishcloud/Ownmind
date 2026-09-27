import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { site } from '@/lib/site'
import { Wordmark } from '@/components/mark'
import { SearchField } from '@/components/search-field'
import { ThemeToggle } from '@/components/theme-toggle'
import { SignOutButton } from '@/components/sign-out-button'
import { LibraryNav } from '@/components/library-nav'
import { initials } from '@/lib/format'

/**
 * A route group layout wraps several sibling segments, so there is no single
 * route literal to key LayoutProps off. Typed children explicitly instead.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Gate on the server. Every server action re-checks this, so the layout is
  // convenience rather than the security boundary.
  const user = await getCurrentUser()
  if (!user) redirect('/signin?next=%2Flibrary')

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/92 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-4 py-2.5 sm:px-6">
          <Wordmark className="shrink-0" />

          <div className="mx-auto w-full max-w-md">
            <SearchField />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <SignOutButton email={user.email} initials={initials(user.email)} />
          </div>
        </div>

        <LibraryNav />
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 sm:px-6">{children}</main>

      <footer className="border-t border-line px-4 py-4 sm:px-6">
        <p className="mx-auto w-full max-w-[1600px] text-xs text-muted">
          {site.name} keeps nothing for advertising and shares nothing with anyone.{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
            Privacy policy
          </Link>
        </p>
      </footer>
    </div>
  )
}
