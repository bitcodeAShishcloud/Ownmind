import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { AuthForm } from '@/components/auth-form'
import { signUp } from '@/lib/actions/auth'

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect('/library')

  return (
    <div>
      <h1 className="text-2xl">Create your account</h1>
      <p className="mt-1.5 mb-6 text-sm text-muted">Free to start. No card required.</p>
      <AuthForm mode="signup" action={signUp} />
    </div>
  )
}
