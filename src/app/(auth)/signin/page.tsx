import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { AuthForm } from '@/components/auth-form'
import { signinSendCode, signinVerifyCode } from '@/lib/actions/auth'
import { turnstileSiteKey } from '@/lib/turnstile'

/** Sign in: the address, the challenge, and the code, all on one page. */
export default async function SignInPage({ searchParams }: PageProps<'/signin'>) {
  if (await getCurrentUser()) redirect('/library')

  const params = await searchParams

  const notice =
    params.reset === '1'
      ? 'Password changed. Sign in with the new one.'
      : params.exists === '1'
        ? 'That address already has an account. Sign in instead.'
        : undefined

  return (
    <div>
      <h1 className="text-2xl">Sign in</h1>
      <p className="mt-1.5 mb-6 text-sm text-muted">
        No password. We send a code to your email and that is it.
      </p>
      <AuthForm
        step="code"
        action={signinVerifyCode}
        sendAction={signinSendCode}
        siteKey={turnstileSiteKey()}
        notice={notice}
      />
    </div>
  )
}