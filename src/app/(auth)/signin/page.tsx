import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { AuthForm } from '@/components/auth-form'
import { authAction } from '@/lib/actions/auth'
import { generateCaptcha } from '@/lib/captcha'

/**
 * The public pages never read the session, so this page does the check instead.
 * Someone already signed in who lands here goes straight to their library.
 */
export default async function SignInPage({ searchParams }: PageProps<'/signin'>) {
  if (await getCurrentUser()) redirect('/library')

  const params = await searchParams
  const justReset = params.reset === '1'

  const captcha = generateCaptcha()

  return (
    <div>
      <h1 className="text-2xl">Sign in</h1>
      <p className="mt-1.5 mb-6 text-sm text-muted">Pick up where you left off.</p>
      <AuthForm
        mode="signin"
        action={authAction}
        notice={justReset ? 'Password changed. Sign in with the new one.' : undefined}
        captcha={captcha}
      />
    </div>
  )
}
