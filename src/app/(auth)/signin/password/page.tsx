import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { AuthForm } from '@/components/auth-form'
import { signinStep2 } from '@/lib/actions/auth'

/** Sign in, page 2 of 2: the password. The code was already accepted. */
export default async function SignInPasswordPage() {
  if (await getCurrentUser()) redirect('/library')

  return (
    <div>
      <h1 className="text-2xl">Your password</h1>
      <p className="mt-1.5 mb-6 text-sm text-muted">Last step.</p>
      <AuthForm step="password" action={signinStep2} />
    </div>
  )
}