import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { AuthForm } from '@/components/auth-form'
import { signinSendCode, signinVerifyCode } from '@/lib/actions/auth'
import { generateCaptcha } from '@/lib/captcha'

/** Sign in, page 1 of 2: the address, the check, and the code. */
export default async function SignInPage({ searchParams }: PageProps<'/signin'>) {
  if (await getCurrentUser()) redirect('/library')

  const params = await searchParams

  return (
    <div>
      <h1 className="text-2xl">Sign in</h1>
      <p className="mt-1.5 mb-6 text-sm text-muted">Pick up where you left off.</p>
      <AuthForm
        step="email"
        action={signinVerifyCode}
        sendAction={signinSendCode}
        notice={params.reset === '1' ? 'Password changed. Sign in with the new one.' : undefined}
        captcha={generateCaptcha()}
      />
    </div>
  )
}