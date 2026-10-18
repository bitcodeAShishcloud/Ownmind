import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { AuthForm } from '@/components/auth-form'
import { signupSendCode, signupVerifyCode } from '@/lib/actions/auth'
import { turnstileSiteKey } from '@/lib/turnstile'

/** Sign up, page 2 of 2: the address and the code. Both on one screen. */
export default async function SignUpEmailPage() {
  if (await getCurrentUser()) redirect('/library')

  return (
    <div>
      <h1 className="text-2xl">Confirm your email</h1>
      <p className="mt-1.5 mb-6 text-sm text-muted">
        Send a code to your address, then type it below. Accepting it signs you in.
      </p>
      <AuthForm
        step="code"
        action={signupVerifyCode}
        sendAction={signupSendCode}
        siteKey={turnstileSiteKey()}
      />
    </div>
  )
}