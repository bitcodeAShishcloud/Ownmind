import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { AuthForm } from '@/components/auth-form'
import { signupStep1 } from '@/lib/actions/auth'
import { turnstileSiteKey } from '@/lib/turnstile'

/** Sign up, page 1 of 2: the name and the challenge. */
export default async function SignUpPage() {
  if (await getCurrentUser()) redirect('/library')

  return (
    <div>
      <h1 className="text-2xl">Create your account</h1>
      <p className="mt-1.5 mb-6 text-sm text-muted">
        No password. We send a code to your email and that is it.
      </p>
      <AuthForm step="name" action={signupStep1} siteKey={turnstileSiteKey()} />
    </div>
  )
}