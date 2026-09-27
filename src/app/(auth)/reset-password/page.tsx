import type { Metadata } from 'next'
import Link from 'next/link'
import { isResetTokenValid } from '@/lib/password-reset'
import { ResetPasswordForm } from '@/components/reset-password-form'

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
}

export default async function ResetPasswordPage({ searchParams }: PageProps<'/reset-password'>) {
  const params = await searchParams
  const raw = typeof params.token === 'string' ? params.token : ''
  const token = raw ? decodeURIComponent(raw) : ''

  // Checked here so an expired link never renders a form that cannot work.
  if (!isResetTokenValid(token)) {
    return (
      <div>
        <h1 className="text-2xl">That link has expired</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Reset links work once and last an hour. This one has already been used, or it has
          expired. Ask for a new one and it will arrive in a moment.
        </p>
        <Link href="/forgot-password" className="btn btn-primary mt-6 w-full">
          Send me a new link
        </Link>
      </div>
    )
  }

  return <ResetPasswordForm token={token} />
}
