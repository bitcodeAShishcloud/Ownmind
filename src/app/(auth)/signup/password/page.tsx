import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { AuthForm } from '@/components/auth-form'
import { signupStep3 } from '@/lib/actions/auth'

/** Sign up, page 3 of 3: the password. The code was already accepted. */
export default async function SignUpPasswordPage() {
  if (await getCurrentUser()) redirect('/library')

  return (
    <div>
      <h1 className="text-2xl">Choose a password</h1>
      <p className="mt-1.5 mb-6 text-sm text-muted">Last step. This signs you straight in.</p>
      <AuthForm step="password" action={signupStep3} />
    </div>
  )
}