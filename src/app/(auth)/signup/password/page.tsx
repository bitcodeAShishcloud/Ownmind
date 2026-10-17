import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { AuthForm } from '@/components/auth-form'
import { signupStep3 } from '@/lib/actions/auth'

/**
 * Signup page 3 of 3: Password + OTP verify → create account.
 */
export default async function SignUpPasswordPage({ searchParams }: PageProps<'/signup/password'>) {
  if (await getCurrentUser()) redirect('/library')

  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : ''

  if (!token) {
    redirect('/signup')
  }

  return (
    <div>
      <h1 className="text-2xl">Create your password</h1>
      <p className="mt-1.5 mb-6 text-sm text-muted">
        Choose a password for your account.
      </p>
      <AuthForm
        mode="signup"
        action={signupStep3}
        step="password"
        token={token}
      />
    </div>
  )
}
