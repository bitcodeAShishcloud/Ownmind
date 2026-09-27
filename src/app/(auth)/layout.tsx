import Link from 'next/link'
import type { Metadata } from 'next'
import { Wordmark } from '@/components/mark'
import { ThemeToggle } from '@/components/theme-toggle'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Wordmark />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="panel p-6">{children}</div>
          <p className="mt-6 text-center text-xs leading-relaxed text-muted">
            {site.name} never sells your data or runs ads. Read the{' '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
