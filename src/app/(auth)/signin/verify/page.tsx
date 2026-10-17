import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { AuthForm } from '@/components/auth-form'
import { signinStep2 } from '@/lib/actions/auth'

/**
 * Signin page 2 of 2: Password + OTP verify → sign in.
 */
export default async function SignInVerifyPage({ searchParams }: PageProps<'/signin/verify'>) {
  if (await getCurrentUser()) redirect('/library')

  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : ''

  if (!token) {
    redirect('/signin')
  }

  return (
    <div>
      <h1 className="text-2xl">Sign in</h1>
      <p className="mt-1.5 mb-6 text-sm text-muted">
        Enter your password and the 6-digit code sent to your email.
      </p>
      <AuthForm
        mode="signin"
        action={signinStep2}
        step="otp"
        token={token}
      />
    </div>
  )
}
