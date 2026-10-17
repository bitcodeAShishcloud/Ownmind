import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { AuthForm } from '@/components/auth-form'
import { signupStep2 } from '@/lib/actions/auth'

/**
 * Signup page 2 of 3: Email + OTP.
 * OTP is auto-sent when the page loads (via the server action's first render).
 */
export default async function SignUpEmailPage({ searchParams }: PageProps<'/signup/email'>) {
  if (await getCurrentUser()) redirect('/library')

  const token = typeof searchParams.token === 'string' ? searchParams.token : ''

  if (!token) {
    redirect('/signup')
  }

  return (
    <div>
      <h1 className="text-2xl">Enter your email</h1>
      <p className="mt-1.5 mb-6 text-sm text-muted">
        We will send a 6-digit code to this address.
      </p>
      <AuthForm
        mode="signup"
        action={signupStep2}
        step="email"
        token={token}
      />
    </div>
  )
}
